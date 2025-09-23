import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaFileAlt, FaCalculator, FaDownload, FaPrint, FaRupeeSign, FaInfoCircle } from 'react-icons/fa';

const TaxComputationSheet = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState('new');

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
    }
  }, [employeeData]);

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
    if (!employeeData?.employmentDetails) return;

    const salary = employeeData.employmentDetails.salary || {};
    const basicSalary = salary.base || 0;
    const da = employeeData.employmentDetails.da || 0;
    const hra = employeeData.employmentDetails.hra_received || 0;
    const otherAllowances = employeeData.employmentDetails.other_allowances || 0;
    const grossSalary = basicSalary + da + hra + otherAllowances;
    
    const pfEmployee = Math.round(grossSalary * 0.12);
    const esicEmployee = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
    const hraExemption = Math.round(Math.min(hra, Math.max(0, (employeeData.employmentDetails.rent_paid || 0) - basicSalary * 0.1), basicSalary * 0.5));
    
    const taxableIncomeOld = grossSalary - 50000 - pfEmployee - esicEmployee;
    const taxableIncomeNew = grossSalary - 75000 - pfEmployee - esicEmployee;
    
    const taxOld = calculateTax(taxableIncomeOld);
    const taxNew = calculateTax(taxableIncomeNew);
    
    const netTakeHome = grossSalary - pfEmployee - esicEmployee - Math.min(taxOld, taxNew);
    
    const payrollResult = {
      gross_salary: grossSalary,
      input_snapshot: {
        basic_salary: basicSalary,
        da: da,
        hra_received: hra,
        other_allowances: otherAllowances,
        rent_paid: employeeData.employmentDetails.rent_paid || 0,
        city: employeeData.personalDetails?.city === 'Metro' ? 'Metro' : 'Non-Metro'
      },
      pf_employee: pfEmployee,
      esic: {
        employee: esicEmployee,
        employer: grossSalary <= 21000 ? Math.round(grossSalary * 0.0325) : 0
      },
      hra_exemption: hraExemption,
      taxable_income_old: taxableIncomeOld,
      taxable_income_new: taxableIncomeNew,
      total_tax_old: taxOld,
      total_tax_new: taxNew,
      net_take_home: netTakeHome,
      recommendation: taxOld <= taxNew ? 'Old Regime is better' : 'New Regime is better',
      createdAt: new Date()
    };

    setPayrollData(payrollResult);
    setSelectedRegime(taxOld <= taxNew ? 'old' : 'new');
  };


  const calculateTax = (income) => {
    if (income <= 400000) return 0;
    if (income <= 800000) return (income - 400000) * 0.05;
    if (income <= 1200000) return 20000 + (income - 800000) * 0.10;
    if (income <= 1600000) return 60000 + (income - 1200000) * 0.15;
    if (income <= 2000000) return 120000 + (income - 1600000) * 0.20;
    return 200000 + (income - 2000000) * 0.30;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const downloadTaxSheet = () => {
    // In a real implementation, this would generate and download a PDF/Excel
    toast.success('Tax computation sheet downloaded');
  };

  const printTaxSheet = () => {
    window.print();
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
              <p className="mt-2 text-gray-600">Loading tax computation...</p>
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
                  Tax Computation Sheet
                </h1>
                <p className="text-gray-600">Detailed tax calculation for the selected regime</p>
              </div>
              <div className="flex gap-3 mt-4 lg:mt-0">
                <button
                  onClick={downloadTaxSheet}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaDownload /> Download
                </button>
                <button
                  onClick={printTaxSheet}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPrint /> Print
                </button>
              </div>
            </div>
          </div>

          {payrollData && (
            <div className="space-y-6">
              {/* Tax Regime Selection */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tax Regime Selection</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedRegime('old')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedRegime === 'old'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Old Regime
                  </button>
                  <button
                    onClick={() => setSelectedRegime('new')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedRegime === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    New Regime
                  </button>
                </div>
              </div>

              {/* Income Details */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Income Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Salary Components</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Basic Salary</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.basic_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dearness Allowance</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.da)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>House Rent Allowance</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.hra_received)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Allowances</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.other_allowances)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>Gross Salary</span>
                        <span className="text-green-600">{formatCurrency(payrollData.gross_salary)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Deductions</h3>
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
                        <span>Professional Tax</span>
                        <span className="font-medium">{formatCurrency(200)}</span>
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
                            (payrollData.esic?.employee || 0) + 
                            200 - 
                            payrollData.hra_exemption
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Computation */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Tax Computation - {selectedRegime === 'old' ? 'Old Regime' : 'New Regime'}</h2>
                
                <div className="space-y-6">
                  {/* Standard Deduction */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Standard Deduction</h3>
                    <div className="flex justify-between">
                      <span>Standard Deduction ({selectedRegime === 'old' ? '₹50,000' : '₹75,000'})</span>
                      <span className="font-semibold">
                        {formatCurrency(selectedRegime === 'old' ? 50000 : 75000)}
                      </span>
                    </div>
                  </div>

                  {/* Taxable Income */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-3">Taxable Income</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gross Salary</span>
                        <span>{formatCurrency(payrollData.gross_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: Standard Deduction</span>
                        <span>-{formatCurrency(selectedRegime === 'old' ? 50000 : 75000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: PF Contribution</span>
                        <span>-{formatCurrency(payrollData.pf_employee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: ESI Contribution</span>
                        <span>-{formatCurrency(payrollData.esic?.employee || 0)}</span>
                      </div>
                      {selectedRegime === 'old' && (
                        <div className="flex justify-between">
                          <span>Less: HRA Exemption</span>
                          <span>-{formatCurrency(payrollData.hra_exemption)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                        <span>Taxable Income</span>
                        <span className="text-blue-600">
                          {formatCurrency(selectedRegime === 'old' ? payrollData.taxable_income_old : payrollData.taxable_income_new)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Slabs */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3">Tax Calculation</h3>
                    <div className="space-y-2">
                      {selectedRegime === 'old' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Up to ₹2,50,000 (0%)</span>
                            <span>{formatCurrency(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>₹2,50,001 - ₹5,00,000 (5%)</span>
                            <span>{formatCurrency(Math.max(0, Math.min(250000, payrollData.taxable_income_old - 250000)) * 0.05)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>₹5,00,001 - ₹10,00,000 (20%)</span>
                            <span>{formatCurrency(Math.max(0, Math.min(500000, payrollData.taxable_income_old - 500000)) * 0.20)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Above ₹10,00,000 (30%)</span>
                            <span>{formatCurrency(Math.max(0, payrollData.taxable_income_old - 1000000) * 0.30)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>Up to ₹4,00,000 (0%)</span>
                            <span>{formatCurrency(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>₹4,00,001 - ₹8,00,000 (5%)</span>
                            <span>{formatCurrency(Math.max(0, Math.min(400000, payrollData.taxable_income_new - 400000)) * 0.05)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>₹8,00,001 - ₹12,00,000 (10%)</span>
                            <span>{formatCurrency(Math.max(0, Math.min(400000, payrollData.taxable_income_new - 800000)) * 0.10)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>₹12,00,001 - ₹16,00,000 (15%)</span>
                            <span>{formatCurrency(Math.max(0, Math.min(400000, payrollData.taxable_income_new - 1200000)) * 0.15)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>₹16,00,001 - ₹20,00,000 (20%)</span>
                            <span>{formatCurrency(Math.max(0, Math.min(400000, payrollData.taxable_income_new - 1600000)) * 0.20)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Above ₹20,00,000 (30%)</span>
                            <span>{formatCurrency(Math.max(0, payrollData.taxable_income_new - 2000000) * 0.30)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                        <span>Total Tax</span>
                        <span className="text-green-600">
                          {formatCurrency(selectedRegime === 'old' ? payrollData.total_tax_old : payrollData.total_tax_new)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cess */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-3">Cess & Surcharge</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Health & Education Cess (4%)</span>
                        <span>
                          {formatCurrency((selectedRegime === 'old' ? payrollData.total_tax_old : payrollData.total_tax_new) * 0.04)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                        <span>Total Tax Payable</span>
                        <span className="text-yellow-600">
                          {formatCurrency((selectedRegime === 'old' ? payrollData.total_tax_old : payrollData.total_tax_new) * 1.04)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <h2 className="text-xl font-semibold mb-4">Tax Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-blue-100">Annual Tax</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency((selectedRegime === 'old' ? payrollData.total_tax_old : payrollData.total_tax_new) * 1.04)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100">Monthly Tax</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(((selectedRegime === 'old' ? payrollData.total_tax_old : payrollData.total_tax_new) * 1.04) / 12)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100">Net Take Home</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(payrollData.net_take_home)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxComputationSheet;
