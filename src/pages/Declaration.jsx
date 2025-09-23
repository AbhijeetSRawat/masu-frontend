import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaFileAlt, FaSave, FaCalculator, FaRupeeSign, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const Declaration = () => {
  const [declarationData, setDeclarationData] = useState({
    // Section 80C (₹1,50,000 limit)
    providentFund: 0,
    elss: 0,
    lifeInsurance: 0,
    nsc: 0,
    ppf: 0,
    sukanyaSamriddhi: 0,
    homeLoanPrincipal: 0,
    tuitionFees: 0,
    other80C: 0,
    
    // Section 80D (Medical Insurance)
    medicalInsuranceSelf: 0,
    medicalInsuranceParents: 0,
    
    // Section 80E (Education Loan)
    educationLoanInterest: 0,
    
    // Section 80G (Donations)
    donations: 0,
    
    // Section 80TTA (Interest on Savings)
    savingsInterest: 0,
    
    // Section 80TTB (Interest on Deposits)
    depositInterest: 0,
    
    // Section 80EE (First Home Loan)
    firstHomeLoanInterest: 0,
    
    // Section 80EEA (Affordable Housing)
    affordableHousingInterest: 0,
    
    // HRA
    rentPaid: 0,
    landlordName: '',
    landlordPan: '',
    
    // LTA
    ltaAmount: 0,
    ltaDetails: '',
    
    // Medical Reimbursement
    medicalReimbursement: 0,
    
    // Other Deductions
    otherDeductions: 0,
    otherDeductionDetails: ''
  });

  const [payrollData, setPayrollData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalDeductions, setTotalDeductions] = useState(0);

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const employee = useSelector((state) => state.employees.reduxEmployee);

  useEffect(() => {
    if (employee?._id) {
      fetchEmployeeData();
    }
  }, [employee]);

  useEffect(() => {
    if (employeeData) {
      fetchPayrollData();
      prefillDeclarationData();
    }
  }, [employeeData]);

  useEffect(() => {
    calculateTotalDeductions();
  }, [declarationData]);

  const fetchEmployeeData = async () => {
    try {
      const response = await apiConnector(
        "GET",
        `${employeeEndpoints.getEmployeeProfile}${employee._id}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data?.employee) {
        setEmployeeData(response.data.employee);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to fetch employee data');
    }
  };

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await apiConnector(
        "GET",
        `${payrollEndpoints.GET_PAYROLL_HISTORY}${employee._id}?page=1&limit=1`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data.payrollHistory && response.data.payrollHistory.length > 0) {
        setPayrollData(response.data.payrollHistory[0]);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prefillDeclarationData = () => {
    if (!employeeData?.employmentDetails) return;

    const salary = employeeData.employmentDetails.salary || {};
    const pfAmount = Math.round((salary.base || 0) * 0.12);
    
    setDeclarationData(prev => ({
      ...prev,
      providentFund: pfAmount,
      rentPaid: employeeData.employmentDetails.rent_paid || 0,
      // Pre-fill other data from employee profile if available
      landlordName: employeeData.personalDetails?.landlordName || '',
      landlordPan: employeeData.personalDetails?.landlordPan || ''
    }));
  };

  const calculateTotalDeductions = () => {
    const total = 
      Math.min(declarationData.providentFund + declarationData.elss + declarationData.lifeInsurance + 
               declarationData.nsc + declarationData.ppf + declarationData.sukanyaSamriddhi + 
               declarationData.homeLoanPrincipal + declarationData.tuitionFees + declarationData.other80C, 150000) +
      Math.min(declarationData.medicalInsuranceSelf + declarationData.medicalInsuranceParents, 100000) +
      declarationData.educationLoanInterest +
      declarationData.donations +
      Math.min(declarationData.savingsInterest, 10000) +
      Math.min(declarationData.depositInterest, 50000) +
      Math.min(declarationData.firstHomeLoanInterest, 50000) +
      Math.min(declarationData.affordableHousingInterest, 200000) +
      declarationData.medicalReimbursement +
      declarationData.otherDeductions;
    
    setTotalDeductions(total);
  };

  const handleInputChange = (field, value) => {
    setDeclarationData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleTextChange = (field, value) => {
    setDeclarationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveDeclaration = async () => {
    try {
      setSaving(true);
      
      // Calculate payroll with declaration data
      const payrollInput = {
        employeeId: employee._id,
        basic_salary: employeeData?.employmentDetails?.salary?.base || 0,
        da: employeeData?.employmentDetails?.da || 0,
        hra_received: employeeData?.employmentDetails?.hra_received || 0,
        other_allowances: employeeData?.employmentDetails?.other_allowances || 0,
        rent_paid: declarationData.rentPaid,
        city: employeeData?.personalDetails?.city === 'Metro' ? 'Metro' : 'Non-Metro',
        // Include declaration data for tax calculation
        investment_declaration: declarationData
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
        toast.success('Investment declaration saved successfully');
        // Refresh payroll data
        fetchPayrollData();
      }
    } catch (error) {
      console.error('Error saving declaration:', error);
      toast.error('Failed to save investment declaration');
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

  const getSection80CTotal = () => {
    return Math.min(
      declarationData.providentFund + declarationData.elss + declarationData.lifeInsurance + 
      declarationData.nsc + declarationData.ppf + declarationData.sukanyaSamriddhi + 
      declarationData.homeLoanPrincipal + declarationData.tuitionFees + declarationData.other80C, 
      150000
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <EmployeeSidebar />
        <div className="lg:ml-[20vw]">
          <EmployeeHeader />
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading declaration form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <EmployeeSidebar />
      <div className="lg:ml-[20vw]">
        <EmployeeHeader />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <FaFileAlt className="text-blue-600" />
                  Investment Declaration
                </h1>
                <p className="text-gray-600">Declare your investments and deductions for tax calculation</p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <FaCalculator />
                    <span className="font-semibold">Total Deductions</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalDeductions)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 80C */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaRupeeSign className="text-green-600" />
                Section 80C - Investments & Payments (Limit: ₹1,50,000)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provident Fund (PF)</label>
                    <input
                      type="number"
                      value={declarationData.providentFund}
                      onChange={(e) => handleInputChange('providentFund', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter PF amount"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ELSS (Equity Linked Savings Scheme)</label>
                    <input
                      type="number"
                      value={declarationData.elss}
                      onChange={(e) => handleInputChange('elss', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter ELSS amount"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Life Insurance Premium</label>
                    <input
                      type="number"
                      value={declarationData.lifeInsurance}
                      onChange={(e) => handleInputChange('lifeInsurance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter life insurance premium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NSC (National Savings Certificate)</label>
                    <input
                      type="number"
                      value={declarationData.nsc}
                      onChange={(e) => handleInputChange('nsc', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter NSC amount"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PPF (Public Provident Fund)</label>
                    <input
                      type="number"
                      value={declarationData.ppf}
                      onChange={(e) => handleInputChange('ppf', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter PPF amount"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sukanya Samriddhi Yojana</label>
                    <input
                      type="number"
                      value={declarationData.sukanyaSamriddhi}
                      onChange={(e) => handleInputChange('sukanyaSamriddhi', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Sukanya Samriddhi amount"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Loan Principal Repayment</label>
                    <input
                      type="number"
                      value={declarationData.homeLoanPrincipal}
                      onChange={(e) => handleInputChange('homeLoanPrincipal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter home loan principal"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Children's Tuition Fees</label>
                    <input
                      type="number"
                      value={declarationData.tuitionFees}
                      onChange={(e) => handleInputChange('tuitionFees', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tuition fees"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other 80C Investments</label>
                    <input
                      type="number"
                      value={declarationData.other80C}
                      onChange={(e) => handleInputChange('other80C', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter other 80C investments"
                    />
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total 80C Deduction:</span>
                      <span className="text-green-600">{formatCurrency(getSection80CTotal())}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Remaining limit: {formatCurrency(150000 - getSection80CTotal())}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 80D */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaRupeeSign className="text-blue-600" />
                Section 80D - Medical Insurance (Limit: ₹1,00,000)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance - Self & Family</label>
                  <input
                    type="number"
                    value={declarationData.medicalInsuranceSelf}
                    onChange={(e) => handleInputChange('medicalInsuranceSelf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter medical insurance premium"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance - Parents</label>
                  <input
                    type="number"
                    value={declarationData.medicalInsuranceParents}
                    onChange={(e) => handleInputChange('medicalInsuranceParents', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter parents' medical insurance"
                  />
                </div>
              </div>
            </div>

            {/* Other Deductions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaRupeeSign className="text-purple-600" />
                Other Deductions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Loan Interest (80E)</label>
                    <input
                      type="number"
                      value={declarationData.educationLoanInterest}
                      onChange={(e) => handleInputChange('educationLoanInterest', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter education loan interest"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donations (80G)</label>
                    <input
                      type="number"
                      value={declarationData.donations}
                      onChange={(e) => handleInputChange('donations', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter donation amount"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Savings Interest (80TTA) - Max ₹10,000</label>
                    <input
                      type="number"
                      value={declarationData.savingsInterest}
                      onChange={(e) => handleInputChange('savingsInterest', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter savings interest"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Interest (80TTB) - Max ₹50,000</label>
                    <input
                      type="number"
                      value={declarationData.depositInterest}
                      onChange={(e) => handleInputChange('depositInterest', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter deposit interest"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Home Loan Interest (80EE) - Max ₹50,000</label>
                    <input
                      type="number"
                      value={declarationData.firstHomeLoanInterest}
                      onChange={(e) => handleInputChange('firstHomeLoanInterest', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first home loan interest"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Affordable Housing Interest (80EEA) - Max ₹2,00,000</label>
                    <input
                      type="number"
                      value={declarationData.affordableHousingInterest}
                      onChange={(e) => handleInputChange('affordableHousingInterest', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter affordable housing interest"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Reimbursement</label>
                    <input
                      type="number"
                      value={declarationData.medicalReimbursement}
                      onChange={(e) => handleInputChange('medicalReimbursement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter medical reimbursement"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions</label>
                    <input
                      type="number"
                      value={declarationData.otherDeductions}
                      onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter other deductions"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* HRA Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-orange-600" />
                HRA (House Rent Allowance) Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent Paid</label>
                  <input
                    type="number"
                    value={declarationData.rentPaid}
                    onChange={(e) => handleInputChange('rentPaid', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter monthly rent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Name</label>
                  <input
                    type="text"
                    value={declarationData.landlordName}
                    onChange={(e) => handleTextChange('landlordName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter landlord name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landlord PAN</label>
                  <input
                    type="text"
                    value={declarationData.landlordPan}
                    onChange={(e) => handleTextChange('landlordPan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter landlord PAN"
                  />
                </div>
              </div>
            </div>

            {/* LTA Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-teal-600" />
                LTA (Leave Travel Allowance) Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LTA Amount</label>
                  <input
                    type="number"
                    value={declarationData.ltaAmount}
                    onChange={(e) => handleInputChange('ltaAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter LTA amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LTA Details</label>
                  <input
                    type="text"
                    value={declarationData.ltaDetails}
                    onChange={(e) => handleTextChange('ltaDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter travel details"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                onClick={saveDeclaration}
                disabled={saving}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Investment Declaration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Declaration;
