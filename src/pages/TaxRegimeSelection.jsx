import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FaCalculator, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle, 
  FaRupeeSign, 
  FaChartBar,
  FaLightbulb,
  FaFileAlt,
  FaBalanceScale
} from 'react-icons/fa';

const TaxRegimeSelection = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [selectedRegime, setSelectedRegime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingSelection, setHasExistingSelection] = useState(false);

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const employee = useSelector((state) => state.employees.reduxEmployee);

  useEffect(() => {
    if (employee?._id || user?._id) {
      fetchEmployeeData();
    }
  }, [employee, user]);

  useEffect(() => {
    if (employeeData) {
      fetchPayrollData();
    }
  }, [employeeData]);

  const fetchEmployeeData = async () => {
    try {
      const employeeId = employee?._id || user?._id;
      const response = await apiConnector(
        "GET",
        `${employeeEndpoints.getEmployeeProfile}${employeeId}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data?.success && response.data?.employee) {
        setEmployeeData(response.data.employee);
      } else if (employee || user) {
        // Use existing employee/user data if API fails
        setEmployeeData(employee || user);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // Use existing employee/user data as fallback
      if (employee || user) {
        setEmployeeData(employee || user);
      } else {
        toast.error('Failed to fetch employee data');
      }
    }
  };

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const employeeId = employee?._id || user?._id;
      const response = await apiConnector(
        "GET",
        `${payrollEndpoints.GET_PAYROLL_HISTORY}${employeeId}?page=1&limit=1`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data?.success && response.data.payrollHistory?.length > 0) {
        setPayrollData(response.data.payrollHistory[0]);
        setHasExistingSelection(true);
        // Set the recommended regime as default
        setSelectedRegime(response.data.payrollHistory[0].recommendation === 'Old Regime is better' ? 'old' : 'new');
      } else {
        // Calculate from employee data if no payroll history exists
        calculatePayrollFromEmployeeData();
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      // Calculate from employee data if API fails
      calculatePayrollFromEmployeeData();
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollFromEmployeeData = () => {
    if (!employeeData) return;

    // Try to get salary data from different possible structures
    const employmentDetails = employeeData.employmentDetails || {};
    const personalDetails = employeeData.personalDetails || {};
    
    const salary = employmentDetails.salary || {};
    const basicSalary = salary.base || salary.basic || 500000; // Default basic salary
    const da = employmentDetails.da || 0;
    const hra = employmentDetails.hra_received || basicSalary * 0.4; // Default 40% of basic
    const otherAllowances = employmentDetails.other_allowances || 0;
    const rentPaid = employmentDetails.rent_paid || 0;
    const otherIncome = employmentDetails.other_income || 0;
    
    const grossSalary = basicSalary + da + hra + otherAllowances;
    
    // Calculate deductions
    const pfEmployee = Math.round(Math.min(grossSalary, 180000) * 0.12); // PF cap at 15k per month
    const esicEmployee = grossSalary <= 252000 ? Math.round(grossSalary * 0.0075) : 0; // ESIC cap at 21k per month
    
    // HRA exemption calculation
    const salaryForHra = basicSalary + da;
    const tenPercentSalary = salaryForHra * 0.1;
    const rentMinusTenPercent = Math.max(0, rentPaid - tenPercentSalary);
    const city = personalDetails.city;
    const isMetro = ['Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad', 'Pune'].includes(city);
    const percentOfSalary = (isMetro ? 0.50 : 0.40) * salaryForHra;
    const hraExemption = Math.min(hra, rentMinusTenPercent, percentOfSalary);
    
    // Taxable income calculations
    const taxableIncomeOld = Math.max(0, grossSalary + otherIncome - 50000 - pfEmployee - esicEmployee - hraExemption);
    const taxableIncomeNew = Math.max(0, grossSalary + otherIncome - 75000 - pfEmployee - esicEmployee);
    
    // Tax calculations
    const taxOld = calculateTaxOldRegime(taxableIncomeOld);
    const taxNew = calculateTaxNewRegime(taxableIncomeNew);
    
    // Add 4% cess
    const cessOld = Math.round(taxOld * 0.04);
    const cessNew = Math.round(taxNew * 0.04);
    const totalTaxOld = taxOld + cessOld;
    const totalTaxNew = taxNew + cessNew;
    
    // Net take home with recommended tax
    const recommendedTax = totalTaxOld <= totalTaxNew ? totalTaxOld : totalTaxNew;
    const netTakeHome = grossSalary - pfEmployee - esicEmployee - recommendedTax;
    
    const payrollResult = {
      gross_salary: grossSalary,
      input_snapshot: {
        basic_salary: basicSalary,
        da: da,
        hra_received: hra,
        other_allowances: otherAllowances,
        rent_paid: rentPaid,
        city: isMetro ? 'Metro' : 'Non-Metro',
        other_income: otherIncome
      },
      pf_employee: pfEmployee,
      esic: {
        employee: esicEmployee,
        employer: grossSalary <= 252000 ? Math.round(grossSalary * 0.0325) : 0
      },
      hra_exemption: Math.round(hraExemption),
      taxable_income_old: taxableIncomeOld,
      taxable_income_new: taxableIncomeNew,
      tax_old: taxOld,
      tax_new: taxNew,
      cess_old: cessOld,
      cess_new: cessNew,
      total_tax_old: totalTaxOld,
      total_tax_new: totalTaxNew,
      net_take_home: netTakeHome,
      recommendation: totalTaxOld <= totalTaxNew ? 'Old Regime is better' : 'New Regime is better',
      createdAt: new Date()
    };

    setPayrollData(payrollResult);
    setSelectedRegime(totalTaxOld <= totalTaxNew ? 'old' : 'new');
    setHasExistingSelection(false);
  };

  const calculateTaxOldRegime = (income) => {
    // Old regime tax slabs for FY 2025-26
    let tax = 0;
    
    if (income <= 250000) return 0;
    if (income <= 500000) {
      tax = (income - 250000) * 0.05;
    } else if (income <= 1000000) {
      tax = 12500 + (income - 500000) * 0.20;
    } else {
      tax = 112500 + (income - 1000000) * 0.30;
    }
    
    // 87A rebate for income up to 5L
    if (income <= 500000) tax = 0;
    
    return Math.round(tax);
  };

  const calculateTaxNewRegime = (income) => {
    // New regime tax slabs for FY 2025-26
    let tax = 0;
    
    if (income <= 400000) return 0;
    if (income <= 800000) {
      tax = (income - 400000) * 0.05;
    } else if (income <= 1200000) {
      tax = 20000 + (income - 800000) * 0.10;
    } else if (income <= 1600000) {
      tax = 60000 + (income - 1200000) * 0.15;
    } else if (income <= 2000000) {
      tax = 120000 + (income - 1600000) * 0.20;
    } else {
      tax = 200000 + (income - 2000000) * 0.30;
    }
    
    // Rebate up to ₹60,000 if income ≤ 12L
    if (income <= 1200000) {
      tax = Math.max(0, tax - 60000);
    }
    
    return Math.round(tax);
  };

  const saveTaxRegimeSelection = async () => {
    try {
      setSaving(true);
      
      if (!payrollData || !selectedRegime) {
        toast.error('Please select a tax regime');
        return;
      }
      
      // Calculate payroll with selected regime
      const payrollInput = {
        employeeId: employee?._id || user?._id,
        basic_salary: payrollData.input_snapshot.basic_salary,
        da: payrollData.input_snapshot.da || 0,
        hra_received: payrollData.input_snapshot.hra_received || 0,
        other_allowances: payrollData.input_snapshot.other_allowances || 0,
        rent_paid: payrollData.input_snapshot.rent_paid || 0,
        city: payrollData.input_snapshot.city || 'Non-Metro',
        other_income: payrollData.input_snapshot.other_income || 0,
        tax_regime: selectedRegime
      };

      const response = await apiConnector(
        "POST",
        payrollEndpoints.CALCULATE_PAYROLL,
        payrollInput,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data) {
        toast.success('Tax regime selection saved successfully');
        setHasExistingSelection(true);
        // Refresh payroll data
        setTimeout(() => {
          fetchPayrollData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving tax regime:', error);
      toast.error(error.response?.data?.message || 'Failed to save tax regime selection');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getTaxSavings = () => {
    if (!payrollData) return 0;
    return Math.abs(payrollData.total_tax_old - payrollData.total_tax_new);
  };

  const getRecommendedRegime = () => {
    if (!payrollData) return 'new';
    return payrollData.recommendation === 'Old Regime is better' ? 'old' : 'new';
  };

  const getEmployeeName = () => {
    if (employeeData?.personalDetails?.firstName) {
      return `${employeeData.personalDetails.firstName} ${employeeData.personalDetails.lastName || ''}`.trim();
    }
    if (employeeData?.user?.profile?.firstName) {
      return `${employeeData.user.profile.firstName} ${employeeData.user.profile.lastName || ''}`.trim();
    }
    if (user?.profile?.firstName) {
      return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
    }
    return user?.name || 'Employee';
  };

  if (loading) {
    return (
      <div className="flex">
        <EmployeeSidebar />
        <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
          <EmployeeHeader />
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading tax information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
        <EmployeeHeader />
        
        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <FaBalanceScale className="text-3xl text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">Tax Regime Selection</h1>
                  <p className="text-gray-600">Choose between Old and New tax regimes for {getEmployeeName()}</p>
                </div>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center gap-2">
                    <FaRupeeSign />
                    <span className="font-semibold">Potential Savings</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(getTaxSavings())}
                  </p>
                  <p className="text-sm text-green-100">Annual savings with recommended regime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          {hasExistingSelection && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-800">
                <FaInfoCircle />
                <span className="font-semibold">Current Selection</span>
              </div>
              <p className="text-blue-700 mt-1">
                You have already selected the {selectedRegime === 'old' ? 'Old' : 'New'} tax regime. 
                You can change your selection below if needed.
              </p>
            </div>
          )}

          {payrollData ? (
            <>
              {/* Regime Comparison Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Old Regime */}
                <div className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                  selectedRegime === 'old' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Old Tax Regime</h2>
                    {getRecommendedRegime() === 'old' && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <FaLightbulb /> Recommended
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Key Features</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          Standard Deduction: ₹50,000
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          80C deductions up to ₹1.5 Lakh
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          HRA exemption available
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          Medical insurance deduction
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          Home loan interest deduction
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Taxable Income:</span>
                        <span className="font-semibold">{formatCurrency(payrollData.taxable_income_old)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Annual Tax:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(payrollData.total_tax_old)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Monthly Tax:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(payrollData.total_tax_old / 12)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRegime('old')}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        selectedRegime === 'old'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedRegime === 'old' ? (
                        <span className="flex items-center justify-center gap-2">
                          <FaCheckCircle /> Selected
                        </span>
                      ) : (
                        'Select Old Regime'
                      )}
                    </button>
                  </div>
                </div>

                {/* New Regime */}
                <div className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                  selectedRegime === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">New Tax Regime</h2>
                    {getRecommendedRegime() === 'new' && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <FaLightbulb /> Recommended
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Key Features</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          Higher Standard Deduction: ₹75,000
                        </li>
                        <li className="flex items-center gap-2">
                          <FaTimesCircle className="text-red-500 text-xs" />
                          No 80C deductions allowed
                        </li>
                        <li className="flex items-center gap-2">
                          <FaTimesCircle className="text-red-500 text-xs" />
                          No HRA exemption
                        </li>
                        <li className="flex items-center gap-2">
                          <FaTimesCircle className="text-red-500 text-xs" />
                          No medical insurance deduction
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-xs" />
                          Lower tax rates on higher slabs
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Taxable Income:</span>
                        <span className="font-semibold">{formatCurrency(payrollData.taxable_income_new)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Annual Tax:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(payrollData.total_tax_new)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Monthly Tax:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(payrollData.total_tax_new / 12)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRegime('new')}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        selectedRegime === 'new'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedRegime === 'new' ? (
                        <span className="flex items-center justify-center gap-2">
                          <FaCheckCircle /> Selected
                        </span>
                      ) : (
                        'Select New Regime'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Comparison Table */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <FaChartBar className="text-blue-600" />
                  Detailed Comparison
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parameter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Old Regime
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New Regime
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Difference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Gross Salary
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payrollData.gross_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payrollData.gross_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Standard Deduction
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(50000)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(75000)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          +{formatCurrency(25000)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          HRA Exemption
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payrollData.hra_exemption)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{formatCurrency(payrollData.hra_exemption)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Taxable Income
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payrollData.taxable_income_old)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(payrollData.taxable_income_new)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          payrollData.taxable_income_new > payrollData.taxable_income_old 
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {payrollData.taxable_income_new > payrollData.taxable_income_old ? '+' : ''}
                          {formatCurrency(payrollData.taxable_income_new - payrollData.taxable_income_old)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          Annual Tax
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(payrollData.total_tax_old)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(payrollData.total_tax_new)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                          payrollData.total_tax_new < payrollData.total_tax_old ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {payrollData.total_tax_new < payrollData.total_tax_old ? '-' : '+'}
                          {formatCurrency(Math.abs(payrollData.total_tax_new - payrollData.total_tax_old))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salary Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-blue-600" />
                  Salary Breakdown
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {formatCurrency(payrollData.gross_salary)}
                    </div>
                    <div className="text-sm text-gray-600">Gross Salary</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedRegime === 'old' ? payrollData.total_tax_old : payrollData.total_tax_new)}
                    </div>
                    <div className="text-sm text-gray-600">Tax ({selectedRegime === 'old' ? 'Old' : 'New'} Regime)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(payrollData.net_take_home)}
                    </div>
                    <div className="text-sm text-gray-600">Net Take Home</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-center">
                <button
                  onClick={saveTaxRegimeSelection}
                  disabled={saving || !selectedRegime}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving Selection...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Save Tax Regime Selection
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaCalculator className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Salary Data Available</h3>
              <p className="text-gray-500">
                Please contact HR to set up your salary information before selecting a tax regime.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxRegimeSelection;
