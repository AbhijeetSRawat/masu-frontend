import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaCalculator, FaDownload, FaFilePdf, FaFileExcel, FaInfoCircle } from 'react-icons/fa';

const PayrollCalculation = () => {
  const [payrollForm, setPayrollForm] = useState({
    basic_salary: '',
    da: '',
    hra_received: '',
    other_allowances: '',
    rent_paid: '',
    city: 'Non-Metro',
    other_income: '',
    deductions: {}
  });

  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const token = useSelector((state) => state.auth.token);

  const calculatePayroll = async () => {
    // Validate required fields
    if (!payrollForm.basic_salary) {
      toast.error('Please enter basic salary');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...payrollForm,
        basic_salary: parseFloat(payrollForm.basic_salary) || 0,
        da: parseFloat(payrollForm.da) || 0,
        hra_received: parseFloat(payrollForm.hra_received) || 0,
        other_allowances: parseFloat(payrollForm.other_allowances) || 0,
        rent_paid: parseFloat(payrollForm.rent_paid) || 0,
        other_income: parseFloat(payrollForm.other_income) || 0,
      };

      const response = await apiConnector(
        "POST",
        payrollEndpoints.CALCULATE_PAYROLL,
        payload,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      setPayrollData(response.data);
      setShowDetails(true);
      toast.success('Payroll calculated successfully');
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error('Failed to calculate payroll');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (format) => {
    if (!payrollData) {
      toast.error('Please calculate payroll first');
      return;
    }

    try {
      // Create a temporary employee ID for calculation-only downloads
      const tempEmployeeId = 'temp-' + Date.now();
      
      // First save the calculation
      const saveResponse = await apiConnector(
        "POST",
        payrollEndpoints.CALCULATE_PAYROLL,
        {
          ...payrollForm,
          employeeId: tempEmployeeId
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      const endpoint = format === 'pdf' 
        ? payrollEndpoints.DOWNLOAD_PAYSLIP_PDF 
        : payrollEndpoints.DOWNLOAD_PAYSLIP_EXCEL;
      
      const response = await fetch(`${endpoint}${tempEmployeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download payslip');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-calculation-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Payslip downloaded successfully`);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error('Failed to download payslip');
    }
  };

  const resetForm = () => {
    setPayrollForm({
      basic_salary: '',
      da: '',
      hra_received: '',
      other_allowances: '',
      rent_paid: '',
      city: 'Non-Metro',
      other_income: '',
      deductions: {}
    });
    setPayrollData(null);
    setShowDetails(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className='lg:ml-[20vw]'>
      <AdminHeader />
      </div>
      
      <div className="lg:ml-[20vw] lg:mr-0 ml-0 mr-0">
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <FaCalculator className="text-blue-600" />
                  Payroll Calculator
                </h1>
                <p className="text-gray-600">Calculate employee salaries with tax computations for both old and new regimes</p>
              </div>
              <div className="flex gap-3 mt-4 lg:mt-0">
                <button
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Salary Details</h2>
              
              <div className="space-y-6">
                {/* Basic Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Basic Salary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={payrollForm.basic_salary}
                    onChange={(e) => setPayrollForm({...payrollForm, basic_salary: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter basic salary"
                    required
                  />
                </div>

                {/* Dearness Allowance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dearness Allowance (DA)
                  </label>
                  <input
                    type="number"
                    value={payrollForm.da}
                    onChange={(e) => setPayrollForm({...payrollForm, da: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter DA amount"
                  />
                </div>

                {/* HRA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Rent Allowance (HRA)
                  </label>
                  <input
                    type="number"
                    value={payrollForm.hra_received}
                    onChange={(e) => setPayrollForm({...payrollForm, hra_received: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter HRA amount"
                  />
                </div>

                {/* Other Allowances */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Allowances
                  </label>
                  <input
                    type="number"
                    value={payrollForm.other_allowances}
                    onChange={(e) => setPayrollForm({...payrollForm, other_allowances: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter other allowances"
                  />
                </div>

                {/* Rent Paid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rent Paid (for HRA exemption)
                  </label>
                  <input
                    type="number"
                    value={payrollForm.rent_paid}
                    onChange={(e) => setPayrollForm({...payrollForm, rent_paid: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter monthly rent paid"
                  />
                </div>

                {/* City Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City Type
                  </label>
                  <select
                    value={payrollForm.city}
                    onChange={(e) => setPayrollForm({...payrollForm, city: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Non-Metro">Non-Metro (40% HRA exemption)</option>
                    <option value="Metro">Metro (50% HRA exemption)</option>
                  </select>
                </div>

                {/* Other Income */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Income (if any)
                  </label>
                  <input
                    type="number"
                    value={payrollForm.other_income}
                    onChange={(e) => setPayrollForm({...payrollForm, other_income: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter other income"
                  />
                </div>

                {/* Calculate Button */}
                <button
                  onClick={calculatePayroll}
                  disabled={loading || !payrollForm.basic_salary}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                >
                  {loading ? 'Calculating...' : 'Calculate Payroll'}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {!showDetails ? (
                <div className="text-center py-12">
                  <FaCalculator className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Calculate Payroll</h3>
                  <p className="text-gray-500">Enter salary details and click calculate to see the breakdown</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Calculation Results</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadPayslip('pdf')}
                        className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <FaFilePdf /> PDF
                      </button>
                      <button
                        onClick={() => downloadPayslip('excel')}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <FaFileExcel /> Excel
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">Gross Salary</h3>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(payrollData.gross_salary)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">Net Take Home</h3>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollData.net_take_home)}</p>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-4">
                    {/* Earnings */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">Earnings</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Basic Salary</span>
                          <span className="font-medium">{formatCurrency(payrollForm.basic_salary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dearness Allowance</span>
                          <span className="font-medium">{formatCurrency(payrollForm.da)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HRA Received</span>
                          <span className="font-medium">{formatCurrency(payrollForm.hra_received)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Allowances</span>
                          <span className="font-medium">{formatCurrency(payrollForm.other_allowances)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Total Gross Salary</span>
                          <span className="text-green-600">{formatCurrency(payrollData.gross_salary)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-3">Deductions</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Provident Fund (PF)</span>
                          <span className="font-medium">{formatCurrency(payrollData.pf_employee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ESI (Employee)</span>
                          <span className="font-medium">{formatCurrency(payrollData.esic?.employee || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HRA Exemption</span>
                          <span className="font-medium text-green-600">-{formatCurrency(payrollData.hra_exemption)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span>Total Deductions</span>
                          <span className="text-red-600">
                            {formatCurrency(
                              payrollData.pf_employee + 
                              (payrollData.esic?.employee || 0) - 
                              payrollData.hra_exemption
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tax Comparison */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">Tax Comparison</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Taxable Income (Old Regime)</span>
                          <span className="font-medium">{formatCurrency(payrollData.taxable_income_old)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxable Income (New Regime)</span>
                          <span className="font-medium">{formatCurrency(payrollData.taxable_income_new)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (Old Regime)</span>
                          <span className="font-medium">{formatCurrency(payrollData.total_tax_old)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (New Regime)</span>
                          <span className="font-medium">{formatCurrency(payrollData.total_tax_new)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Recommendation</span>
                          <span className={`font-semibold ${
                            payrollData.recommendation === 'Old Regime is better' 
                              ? 'text-green-600' 
                              : 'text-blue-600'
                          }`}>
                            {payrollData.recommendation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tax Savings Info */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <FaInfoCircle className="text-yellow-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 mb-1">Tax Savings</h4>
                          <p className="text-sm text-yellow-700">
                            By choosing the recommended regime, you can save{' '}
                            <span className="font-semibold">
                              {formatCurrency(Math.abs(payrollData.total_tax_old - payrollData.total_tax_new))}
                            </span>{' '}
                            in taxes annually.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollCalculation;
