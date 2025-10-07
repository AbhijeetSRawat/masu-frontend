import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { ctcEndpoints, flexiEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaRupeeSign, FaCalculator, FaFileAlt, FaChartPie, FaInfoCircle, FaDownload, FaHome } from 'react-icons/fa';

const SalaryBreakdown = () => {
  const [ctcData, setCTCData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('2024-2025');
  
  // Flexi declaration modal state
  const [showFlexiModal, setShowFlexiModal] = useState(false);
  const [flexiOptions, setFlexiOptions] = useState([]);
  const [flexiForm, setFlexiForm] = useState([]);
  const [submittingFlexi, setSubmittingFlexi] = useState(false);
  
  const token = useSelector((state) => state.auth.token);
  const company = useSelector((state) => state.permissions.company);
  const employee = useSelector((state) => state.employees.reduxEmployee);

  useEffect(() => {
    if (employee?._id && company?._id) {
      fetchCTCData();
    }
  }, [employee?._id, company?._id, selectedFinancialYear]);

  const fetchCTCData = async () => {
    try {
      setLoading(true);
      const url = `${ctcEndpoints.getCTCByEmployee
        .replace(':employeeId', employee._id)
        .replace(':companyId', company._id)}?financialYear=${selectedFinancialYear}`;
      
      const response = await apiConnector(
        'GET',
        url,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data.success) {
        setCTCData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching CTC data:', error);
      if (error.response?.status === 404) {
        toast.error('No CTC data found for this financial year');
        setCTCData(null);
      } else {
        toast.error('Failed to fetch CTC breakdown');
      }
    } finally {
      setLoading(false);
    }
  };

  // Open Flexi Modal and fetch flexi options
  const openFlexiModal = async () => {
    try {
      setShowFlexiModal(true);
      const url = flexiEndpoints.getFlexiBasket.replace(':companyId', company._id);
      const result = await apiConnector('GET', url, null, { Authorization: `Bearer ${token}` });
      
      if (result.data.success && result.data.data.options) {
        const activeOptions = result.data.data.options.filter(o => o.isActive);
        setFlexiOptions(activeOptions);
        setFlexiForm(
          activeOptions.map(opt => ({
            headCode: opt.headCode,
            declaredAmount: 0,
            declaredUnits: 0,
            remark: ''
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch flexi options');
      setShowFlexiModal(false);
    }
  };

  const handleFlexiAmountChange = (idx, field, value) => {
    const updated = [...flexiForm];
    updated[idx][field] = field === 'declaredUnits' || field === 'declaredAmount'
      ? parseFloat(value) || 0
      : value;
    setFlexiForm(updated);
  };

  const handleSubmitFlexi = async () => {
    const declarations = flexiForm.filter(item => (item.declaredAmount || 0) > 0 || (item.declaredUnits || 0) > 0);
    
    if (!declarations.length) {
      toast.error("Please enter at least one flexi declaration.");
      return;
    }

    setSubmittingFlexi(true);
    try {
      // Create or update declaration
      const resp = await apiConnector(
        'POST',
        flexiEndpoints.createOrUpdateFlexiDeclaration,
        { 
          employeeId: employee._id, 
          financialYear: selectedFinancialYear, 
          declarations 
        },
        { Authorization: `Bearer ${token}` }
      );

      if (resp.data.success && resp.data.data) {
        toast.success("Declaration saved! Submitting now...");
        
        // Submit the declaration
        await apiConnector(
          'POST',
          flexiEndpoints.submitFlexiDeclaration.replace(':id', resp.data.data._id),
          {},
          { Authorization: `Bearer ${token}` }
        );
        
        toast.success("Flexi Declaration Submitted Successfully!");
        setShowFlexiModal(false);
        setFlexiForm([]);
        
        // Refresh CTC data
        setTimeout(() => fetchCTCData(), 500);
      } else {
        toast.error(resp.data.message || "Failed to declare flexi benefits.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Error declaring flexi benefits.");
    } finally {
      setSubmittingFlexi(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear - i;
      years.push({
        value: `${year}-${year + 1}`,
        label: `FY ${year}-${year + 1}`
      });
    }
    return years;
  };

  const calculateTakeHomePercentage = () => {
    if (!ctcData?.summary) return 0;
    const percentage = (ctcData.summary.netSalary / ctcData.annualCTC) * 100;
    return percentage.toFixed(2);
  };

  const getComponentsByCategory = (category) => {
    if (!ctcData?.monthlyBreakup) return [];
    
    switch(category) {
      case 'fixed':
        return ctcData.monthlyBreakup.filter(item => 
          !item.isFlexiComponent && 
          !['PF Employer', 'Gratuity', 'ESI Employer'].includes(item.salaryHead)
        );
      case 'flexi':
        return ctcData.monthlyBreakup.filter(item => item.isFlexiComponent);
      case 'benefits':
        return ctcData.monthlyBreakup.filter(item => 
          ['PF Employer', 'Gratuity', 'ESI Employer'].includes(item.salaryHead)
        );
      default:
        return [];
    }
  };

  const downloadCTCBreakdown = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex">
        <EmployeeSidebar />
        <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
          <EmployeeHeader />
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading CTC breakdown...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <EmployeeHeader />
        
        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <FaFileAlt className="text-blue-600" />
                  CTC & Salary Breakdown
                </h1>
                <p className="text-gray-600 mt-1">
                  Detailed breakdown of your salary components and benefits
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <select
                  value={selectedFinancialYear}
                  onChange={(e) => setSelectedFinancialYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getFinancialYears().map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
                {ctcData && (
                  <button
                    onClick={downloadCTCBreakdown}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaDownload />
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>

          {ctcData ? (
            <div className="space-y-6">
              {/* CTC Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <FaRupeeSign className="text-3xl opacity-80" />
                    <span className="text-sm opacity-90">Annual</span>
                  </div>
                  <h3 className="text-sm font-medium opacity-90">Total CTC</h3>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(ctcData.annualCTC)}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatCurrency(Math.round(ctcData.annualCTC / 12))} / month
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <FaCalculator className="text-3xl opacity-80" />
                    <span className="text-sm opacity-90">Monthly</span>
                  </div>
                  <h3 className="text-sm font-medium opacity-90">Net Take Home</h3>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(Math.round((ctcData.summary?.netSalary || 0) / 12))}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    After all deductions
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <FaChartPie className="text-3xl opacity-80" />
                    <span className="text-sm opacity-90">Percentage</span>
                  </div>
                  <h3 className="text-sm font-medium opacity-90">Take Home %</h3>
                  <p className="text-2xl font-bold mt-1">{calculateTakeHomePercentage()}%</p>
                  <p className="text-xs opacity-75 mt-1">of CTC as take home</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <FaInfoCircle className="text-3xl opacity-80" />
                    <span className="text-sm opacity-90">Status</span>
                  </div>
                  <h3 className="text-sm font-medium opacity-90">CTC Status</h3>
                  <p className="text-2xl font-bold mt-1">{ctcData.status}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {ctcData.hasFlexiBenefits ? 'With Flexi Benefits' : 'Fixed Structure'}
                  </p>
                </div>
              </div>

              {/* Employee & Template Info */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Employee Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Employee ID</p>
                    <p className="font-semibold text-gray-800">
                      {ctcData.employee?.employmentDetails?.employeeId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-800">
                      {ctcData.employee?.user?.profile?.firstName} {ctcData.employee?.user?.profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department</p>
                    <p className="font-semibold text-gray-800">
                      {ctcData.employee?.employmentDetails?.department?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Designation</p>
                    <p className="font-semibold text-gray-800">
                      {ctcData.employee?.employmentDetails?.designation || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Template</p>
                    <p className="font-semibold text-gray-800">
                      {ctcData.template?.templateName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Financial Year</p>
                    <p className="font-semibold text-gray-800">{ctcData.financialYear}</p>
                  </div>
                </div>
              </div>

              {/* Fixed Components */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  Fixed Salary Components
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Component</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Monthly Amount</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Annual Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Calculation Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getComponentsByCategory('fixed').map((component, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{component.salaryHead}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatCurrency(component.monthlyAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            {formatCurrency(component.annualAmount)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {component.calculationBasis || '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-bold">
                        <td className="px-4 py-3">Total Fixed</td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Math.round((ctcData.summary?.fixedSalary || 0) / 12))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(ctcData.summary?.fixedSalary || 0)}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Flexi Benefits */}
              {ctcData.hasFlexiBenefits && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Flexi Benefits
                    </h2>
                    {ctcData.flexiDetails && (
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        ctcData.flexiDetails.status === 'Approved' 
                          ? 'bg-green-100 text-green-700'
                          : ctcData.flexiDetails.status === 'Submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {ctcData.flexiDetails.status}
                      </span>
                    )}
                  </div>

                  {ctcData.flexiDetails ? (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Total Flexi Amount</p>
                          <p className="text-lg font-bold text-green-700">
                            {formatCurrency(ctcData.totalFlexiAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Declared Amount</p>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(ctcData.flexiDetails.totalDeclaredAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Remaining Balance</p>
                          <p className="text-lg font-bold text-orange-700">
                            {formatCurrency(ctcData.flexiDetails.remainingBalance)}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Benefit</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-700">Monthly</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-700">Annual</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-700">Tax Benefit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {ctcData.flexiDetails.declarations.map((decl, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{decl.headCode}</td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                  {formatCurrency(decl.monthlyAmount)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                  {formatCurrency(decl.declaredAmount)}
                                </td>
                                <td className="px-4 py-3 text-right text-green-600">
                                  {formatCurrency(decl.taxBenefitAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-yellow-50 rounded-lg">
                      <p className="text-gray-600 mb-2">Flexi benefits available but not declared yet</p>
                      <p className="text-sm text-gray-500">
                        Total Flexi Amount: <strong>{formatCurrency(ctcData.totalFlexiAmount)}</strong>
                      </p>
                      <button 
                        onClick={openFlexiModal}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Declare Flexi Benefits
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* HRA Exemption Section - NEW */}
              {ctcData.hraExemption && ctcData.hraExemption > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaHome className="text-yellow-600" />
                      HRA Exemption Details
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      Calculated
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Financial Year</p>
                        <p className="text-2xl font-bold text-gray-800">{ctcData.financialYear}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">HRA Exemption Amount</p>
                        <p className="text-3xl font-bold text-green-700">
                          {formatCurrency(ctcData.hraExemption)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Tax Exempt Amount</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Monthly Benefit</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(Math.round(ctcData.hraExemption / 12))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Per Month</p>
                      </div>
                    </div>

                    <div className="mt-6 bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="text-green-600 text-xl flex-shrink-0 mt-1" />
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold text-gray-800 mb-2">About HRA Exemption:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>This amount is exempt from income tax as per IT rules</li>
                            <li>HRA exemption is calculated based on actual rent paid, salary structure, and city type</li>
                            <li>This reduces your taxable income significantly</li>
                            <li>Keep rent receipts for verification during tax filing</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Benefits */}
              {getComponentsByCategory('benefits').length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    Company Benefits
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Benefit</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Monthly</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Annual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getComponentsByCategory('benefits').map((component, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{component.salaryHead}</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {formatCurrency(component.monthlyAmount)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">
                              {formatCurrency(component.annualAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">CTC Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-90">Fixed Salary</p>
                    <p className="text-lg font-bold">{formatCurrency(ctcData.summary?.fixedSalary || 0)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-90">Flexi Benefits</p>
                    <p className="text-lg font-bold">{formatCurrency(ctcData.summary?.flexiBenefits || 0)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-90">Reimbursements</p>
                    <p className="text-lg font-bold">{formatCurrency(ctcData.summary?.reimbursement || 0)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-90">Company Benefits</p>
                    <p className="text-lg font-bold">{formatCurrency(ctcData.summary?.benefits || 0)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-90">Gross Earnings</p>
                    <p className="text-lg font-bold">{formatCurrency(ctcData.summary?.totalGrossEarning || 0)}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm opacity-90">Total Deductions</p>
                    <p className="text-lg font-bold">{formatCurrency(ctcData.summary?.totalDeductions || 0)}</p>
                  </div>
                  {ctcData.hraExemption > 0 && (
                    <div className="bg-green-600 rounded-lg p-4">
                      <p className="text-sm opacity-90">HRA Tax Exemption</p>
                      <p className="text-lg font-bold">{formatCurrency(ctcData.hraExemption)}</p>
                    </div>
                  )}
                  <div className={`bg-green-600 rounded-lg p-4 ${ctcData.hraExemption > 0 ? '' : 'col-span-2'}`}>
                    <p className="text-sm opacity-90">Annual Net Salary</p>
                    <p className="text-2xl font-bold">{formatCurrency(ctcData.summary?.netSalary || 0)}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {formatCurrency(Math.round((ctcData.summary?.netSalary || 0) / 12))} / month
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-blue-500 text-xl flex-shrink-0 mt-1" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-gray-800 mb-2">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Actual take-home salary may vary based on attendance and variable pay components</li>
                      <li>Tax deductions are subject to your income tax declarations and regime selection</li>
                      <li>Flexi benefits require proper documentation for tax exemptions</li>
                      {ctcData.hraExemption > 0 && <li>HRA exemption of {formatCurrency(ctcData.hraExemption)} has been calculated and will reduce your taxable income</li>}
                      <li>This breakdown is for the financial year {ctcData.financialYear}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No CTC Data Available</h3>
              <p className="text-gray-600 mb-4">
                CTC breakdown for {selectedFinancialYear} is not available yet.
              </p>
              <p className="text-sm text-gray-500">
                Please contact HR to set up your salary structure.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flexi Declaration Modal */}
      {showFlexiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Declare Flexi Benefits</h3>
                <button 
                  onClick={() => setShowFlexiModal(false)} 
                  className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-2">
                Enter the annual amounts for each flexi benefit you wish to declare
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {flexiOptions.map((opt, idx) => (
                  <div key={opt.headCode} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-lg">
                          {opt.name}
                          <span className="text-gray-400 text-sm ml-2">({opt.headCode})</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{opt.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Max Limit:</span> {formatCurrency(opt.maxLimit)}
                          {opt.calculationBasis && <span className="ml-3">• {opt.calculationBasis}</span>}
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        {opt.optionType === "unit" && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Units</label>
                            <input
                              type="number"
                              className="border border-gray-300 px-3 py-2 w-24 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                              value={flexiForm[idx].declaredUnits}
                              onChange={e => handleFlexiAmountChange(idx, 'declaredUnits', e.target.value)}
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Annual Amount (₹)</label>
                          <input
                            type="number"
                            className="border border-gray-300 px-3 py-2 w-36 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                            value={flexiForm[idx].declaredAmount}
                            onChange={e => handleFlexiAmountChange(idx, 'declaredAmount', e.target.value)}
                            min={opt.minLimit || 0}
                            max={opt.maxLimit || 9999999}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Remark</label>
                          <input
                            type="text"
                            className="border border-gray-300 px-3 py-2 w-44 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional"
                            value={flexiForm[idx].remark}
                            onChange={e => handleFlexiAmountChange(idx, 'remark', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {flexiOptions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No active flexi options available</p>
                </div>
              )}
            </div>

            <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
              <button
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                onClick={() => setShowFlexiModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 ${
                  submittingFlexi ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={handleSubmitFlexi}
                disabled={submittingFlexi}
              >
                {submittingFlexi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Declaration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryBreakdown;
