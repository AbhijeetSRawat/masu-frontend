import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaRupeeSign, FaCalculator, FaFileAlt, FaChartPie, FaInfoCircle } from 'react-icons/fa';

const SalaryBreakdown = () => {
  const [payrollData, setPayrollData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
      fetchLatestPayrollData();
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

  const fetchLatestPayrollData = async () => {
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
      } else {
        // If no payroll data exists, calculate from employee salary data
        calculatePayrollFromEmployeeData();
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      // Calculate from employee data if payroll history doesn't exist
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
    
    setPayrollData({
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
    });
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

  const getMonthOptions = () => {
    const months = [
      { value: '', label: 'Current Month' },
      { value: '1', label: 'January' },
      { value: '2', label: 'February' },
      { value: '3', label: 'March' },
      { value: '4', label: 'April' },
      { value: '5', label: 'May' },
      { value: '6', label: 'June' },
      { value: '7', label: 'July' },
      { value: '8', label: 'August' },
      { value: '9', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ];
    return months;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 3; i--) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
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
              <p className="mt-2 text-gray-600">Loading salary breakdown...</p>
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
                  <FaChartPie className="text-blue-600" />
                  CTC & Salary Structure
                </h1>
                <p className="text-gray-600">Detailed breakdown of your salary components and deductions</p>
              </div>
              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="flex items-center gap-2">
                  <FaCalculator className="text-blue-600" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getMonthOptions().map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalculator className="text-blue-600" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getYearOptions().map(year => (
                      <option key={year.value} value={year.value}>{year.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {payrollData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CTC Overview */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaRupeeSign className="text-green-600" />
                  Cost to Company (CTC)
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold">Total CTC</span>
                      <span className="text-3xl font-bold">{formatCurrency(payrollData.gross_salary)}</span>
                    </div>
                    <p className="text-green-100 text-sm mt-1">Per Month</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Basic Salary</span>
                      <span className="font-semibold">{formatCurrency(payrollData.input_snapshot?.basic_salary)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Dearness Allowance</span>
                      <span className="font-semibold">{formatCurrency(payrollData.input_snapshot?.da)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">House Rent Allowance</span>
                      <span className="font-semibold">{formatCurrency(payrollData.input_snapshot?.hra_received)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Other Allowances</span>
                      <span className="font-semibold">{formatCurrency(payrollData.input_snapshot?.other_allowances)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Take Home */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-blue-600" />
                  Net Take Home
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold">Net Salary</span>
                      <span className="text-3xl font-bold">{formatCurrency(payrollData.net_take_home)}</span>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">After all deductions</p>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {((payrollData.net_take_home / payrollData.gross_salary) * 100).toFixed(1)}%
                    </div>
                    <p className="text-gray-600">of CTC as take home</p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Detailed Salary Breakdown</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="font-semibold text-green-800 mb-4 text-lg">Earnings</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Basic Salary</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.basic_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dearness Allowance (DA)</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.da)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>House Rent Allowance (HRA)</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.hra_received)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Allowances</span>
                        <span className="font-medium">{formatCurrency(payrollData.input_snapshot?.other_allowances)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3 font-semibold text-lg">
                        <span>Total Earnings</span>
                        <span className="text-green-600">{formatCurrency(payrollData.gross_salary)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-red-50 rounded-lg p-6">
                    <h3 className="font-semibold text-red-800 mb-4 text-lg">Deductions</h3>
                    <div className="space-y-3">
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
                        <span>Income Tax (TDS)</span>
                        <span className="font-medium">{formatCurrency(Math.min(payrollData.total_tax_old, payrollData.total_tax_new))}</span>
                      </div>
                      <div className="flex justify-between border-t pt-3 font-semibold text-lg">
                        <span>Total Deductions</span>
                        <span className="text-red-600">
                          {formatCurrency(
                            payrollData.pf_employee + 
                            (payrollData.esic?.employee || 0) + 
                            200 + 
                            Math.min(payrollData.total_tax_old, payrollData.total_tax_new)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Information */}
                <div className="mt-6 bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-800 mb-4 text-lg flex items-center gap-2">
                    <FaInfoCircle />
                    Tax Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tax Regime</p>
                      <p className="font-semibold text-lg">
                        {payrollData.recommendation === 'Old Regime is better' ? 'Old Regime' : 'New Regime'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">HRA Exemption</p>
                      <p className="font-semibold text-lg text-green-600">
                        {formatCurrency(payrollData.hra_exemption)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Taxable Income (Old Regime)</p>
                      <p className="font-semibold text-lg">
                        {formatCurrency(payrollData.taxable_income_old)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Taxable Income (New Regime)</p>
                      <p className="font-semibold text-lg">
                        {formatCurrency(payrollData.taxable_income_new)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <FaChartPie className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Salary Data Available</h3>
              <p className="text-gray-500">Please contact HR to set up your salary structure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryBreakdown;
