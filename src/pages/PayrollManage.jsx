import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaCalculator, FaDownload, FaHistory, FaFileExcel, FaFilePdf, FaSearch, FaCalendarAlt, FaClock } from 'react-icons/fa';

const PayrollManage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [monthlySalaryData, setMonthlySalaryData] = useState(null);
  const [calculatedSalaryData, setCalculatedSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  
  // Month and Year selectors for salary calculation
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const token = useSelector((state) => state.auth.token);
  const company = useSelector((state) => state.permissions.company);

  // Payroll calculation form state
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiConnector(
        "GET",
        `${employeeEndpoints.GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=1&limit=100`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      console.log(response);
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  // FRONTEND SALARY CALCULATION LOGIC
  const calculatePerformanceBasedSalary = (rawSalaryData) => {
    if (!rawSalaryData) return null;

    const baseSalary = rawSalaryData.baseSalary || 0;
    const daysInMonth = rawSalaryData.daysInMonth || 30;
    const workingDays = rawSalaryData.workingDays || (daysInMonth - (rawSalaryData.holidayDays?.count || 0) - (rawSalaryData.weekOffDays?.count || 0));
    
    // Calculate per day salary based on working days only
    const perDaySalary = workingDays > 0 ? baseSalary / workingDays : 0;
    const perHalfDaySalary = perDaySalary / 2;

    // Get attendance counts
    const presentDays = rawSalaryData.presentDays?.count || 0;
    const halfDays = rawSalaryData.halfDays?.count || 0;
    const absentDays = rawSalaryData.absentDays?.count || 0;
    const weekOffDays = rawSalaryData.weekOffDays?.count || 0;
    const holidayDays = rawSalaryData.holidayDays?.count || 0;

    // PERFORMANCE-BASED CALCULATION: Only pay for work performed
    const presentAmount = presentDays * perDaySalary;
    const halfDayAmount = halfDays * perHalfDaySalary;
    const weekOffAmount = 0; // NO PAYMENT for week offs
    const holidayAmount = 0; // NO PAYMENT for holidays
    const absentAmount = 0; // NO PAYMENT for absent days

    // Calculate total payable days and final salary
    const totalPayableDays = presentDays + (halfDays * 0.5);
    const finalSalary = presentAmount + halfDayAmount;

    return {
      ...rawSalaryData,
      perDaySalary: parseFloat(perDaySalary.toFixed(2)),
      perHalfDaySalary: parseFloat(perHalfDaySalary.toFixed(2)),
      workingDays,
      presentDays: {
        count: presentDays,
        amount: parseFloat(presentAmount.toFixed(2))
      },
      halfDays: {
        count: halfDays,
        amount: parseFloat(halfDayAmount.toFixed(2))
      },
      absentDays: {
        count: absentDays,
        amount: 0 // No payment for absent days
      },
      weekOffDays: {
        count: weekOffDays,
        amount: 0 // No payment for week offs
      },
      holidayDays: {
        count: holidayDays,
        amount: 0 // No payment for holidays
      },
      totalPayableDays: parseFloat(totalPayableDays.toFixed(2)),
      finalSalary: parseFloat(finalSalary.toFixed(2)),
      breakdown: [
        {
          type: 'Present Days',
          days: presentDays,
          rate: parseFloat(perDaySalary.toFixed(2)),
          amount: parseFloat(presentAmount.toFixed(2)),
          paid: true
        },
        {
          type: 'Half Days',
          days: halfDays,
          rate: parseFloat(perHalfDaySalary.toFixed(2)),
          amount: parseFloat(halfDayAmount.toFixed(2)),
          paid: true
        },
        {
          type: 'Week Off Days',
          days: weekOffDays,
          rate: 0,
          amount: 0,
          paid: false
        },
        {
          type: 'Holidays',
          days: holidayDays,
          rate: 0,
          amount: 0,
          paid: false
        },
        {
          type: 'Absent Days',
          days: absentDays,
          rate: 0,
          amount: 0,
          paid: false
        }
      ]
    };
  };

  // Fetch monthly salary data based on attendance
  const fetchMonthlySalary = async (employeeId, year, month) => {
    try {
      setLoading(true);
      const response = await apiConnector(
        "GET",
        `${payrollEndpoints.GET_MONTHLY_SALARY}${employeeId}/${year}/${month}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data.success) {
        const rawData = response.data.data;
        setMonthlySalaryData(rawData);
        
        // Apply performance-based calculation
        const calculatedData = calculatePerformanceBasedSalary(rawData);
        setCalculatedSalaryData(calculatedData);
        
        // Update payroll form with attendance-based salary
        setPayrollForm(prev => ({
          ...prev,
          basic_salary: calculatedData.finalSalary || calculatedData.baseSalary || prev.basic_salary,
        }));
        
        toast.success(`Monthly salary data calculated for ${getMonthName(month)} ${year}`);
        return calculatedData;
      }
    } catch (error) {
      console.error('Error fetching monthly salary:', error);
      toast.error('Failed to fetch monthly salary data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!calculatedSalaryData) {
      toast.error('Please fetch monthly salary data first');
      return;
    }

    try {
      setLoading(true);

      // Use the performance-based calculated salary for payroll calculation
      const payload = {
        basic_salary: calculatedSalaryData.finalSalary * 12, // Convert to annual for tax calculation
        da: parseFloat(payrollForm.da) * 12 || 0,
        hra_received: parseFloat(payrollForm.hra_received) * 12 || 0,
        other_allowances: parseFloat(payrollForm.other_allowances) * 12 || 0,
        rent_paid: parseFloat(payrollForm.rent_paid) * 12 || 0,
        city: payrollForm.city,
        other_income: parseFloat(payrollForm.other_income) || 0,
        deductions: payrollForm.deductions,
        employeeId: selectedEmployee._id,
        // Include salary breakdown information
        salaryBreakdown: calculatedSalaryData,
        month: selectedMonth,
        year: selectedYear
      };

      console.log('Payload being sent:', payload);

      const response = await apiConnector(
        "POST",
        payrollEndpoints.CALCULATE_PAYROLL,
        payload,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      setPayrollData(response.data);
      toast.success(`Payroll calculated successfully for ${getMonthName(selectedMonth)} ${selectedYear}`);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        toast.error(`Payroll for ${getMonthName(selectedMonth)} ${selectedYear} already exists for this employee`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to calculate payroll');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollHistory = async (employeeId) => {
    try {
      const response = await apiConnector(
        "GET",
        `${payrollEndpoints.GET_PAYROLL_HISTORY}${employeeId}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setPayrollHistory(response.data.payrollHistory || []);
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      toast.error('Failed to fetch payroll history');
    }
  };

  const downloadPayslip = async (format) => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (!payrollData) {
      toast.error('Please calculate payroll first');
      return;
    }

    try {
      const endpoint = format === 'pdf' 
        ? payrollEndpoints.DOWNLOAD_PAYSLIP_PDF 
        : payrollEndpoints.DOWNLOAD_PAYSLIP_EXCEL;
      
      const url = `${endpoint}${selectedEmployee._id}?month=${selectedMonth}&year=${selectedYear}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download payslip');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const employeeName = selectedEmployee.user?.profile?.firstName && selectedEmployee.user?.profile?.lastName 
        ? `${selectedEmployee.user.profile.firstName}_${selectedEmployee.user.profile.lastName}`
        : selectedEmployee.user?.profile?.firstName || 'employee';
      a.download = `payslip-${employeeName}-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast.success(`Payslip downloaded successfully`);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error(error.message || 'Failed to download payslip');
    }
  };

  const downloadPayrollReport = async () => {
    try {
      const response = await fetch(
        `${payrollEndpoints.GET_PAYROLL_REPORT}${company._id}?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download payroll report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Payroll report downloaded successfully');
    } catch (error) {
      console.error('Error downloading payroll report:', error);
      toast.error(error.message || 'Failed to download payroll report');
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  const filteredEmployees = employees.filter(emp => {
    const employeeName = emp.user?.profile?.firstName && emp.user?.profile?.lastName 
      ? `${emp.user.profile.firstName} ${emp.user.profile.lastName}`
      : emp.user?.profile?.firstName || 'N/A';
    const employeeId = emp.employmentDetails?.employeeId || 'N/A';
    
    return employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           employeeId.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Payroll Management</h1>
                <p className="text-gray-600">Performance-based salary calculation - Pay only for work performed</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaCalculator /> Payroll Calculator
                </button>
                <button
                  onClick={downloadPayrollReport}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaFileExcel /> Download Report
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Employee Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Employee</h2>
              
              {/* Search */}
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Employee List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading employees...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEmployees.map((employee) => (
                      <div
                        key={employee._id}
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowHistory(false);
                          setMonthlySalaryData(null);
                          setCalculatedSalaryData(null);
                          setPayrollData(null);
                          // Pre-populate form with employee's actual salary data
                          if (employee.employmentDetails) {
                            setPayrollForm({
                              basic_salary: employee.employmentDetails.salary?.base || '',
                              da: employee.employmentDetails.da || '',
                              hra_received: employee.employmentDetails.hra_received || '',
                              other_allowances: employee.employmentDetails.other_allowances || '',
                              rent_paid: employee.employmentDetails.rent_paid || '',
                              city: employee.personalDetails?.city === 'Mumbai' || employee.personalDetails?.city === 'Delhi' || employee.personalDetails?.city === 'Kolkata' || employee.personalDetails?.city === 'Chennai' ? 'Metro' : 'Non-Metro',
                              other_income: employee.employmentDetails.other_income || '',
                              deductions: employee.employmentDetails.deductions || {}
                            });
                          }
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedEmployee?._id === employee._id
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {employee.user?.profile?.firstName && employee.user?.profile?.lastName 
                                ? `${employee.user.profile.firstName} ${employee.user.profile.lastName}`
                                : employee.user?.profile?.firstName || 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-600">ID: {employee.employmentDetails?.employeeId || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{employee.employmentDetails?.department?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Base: {formatCurrency((employee.employmentDetails?.salary?.base || 0))}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchPayrollHistory(employee._id);
                              setShowHistory(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaHistory />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Month/Year Selection */}
            {selectedEmployee && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  Select Month & Year for Payroll
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value));
                        setCalculatedSalaryData(null);
                        setPayrollData(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        setCalculatedSalaryData(null);
                        setPayrollData(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => fetchMonthlySalary(selectedEmployee._id, selectedYear, selectedMonth)}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <FaClock />
                  {loading ? 'Calculating...' : `Calculate Performance-Based Salary for ${getMonthName(selectedMonth)} ${selectedYear}`}
                </button>
              </div>
            )}

            {/* Performance-Based Salary Summary */}
            {calculatedSalaryData && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Performance-Based Salary - {getMonthName(selectedMonth)} {selectedYear}
                </h2>
                
                {/* Calculation Note */}
                <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Performance-Based Calculation:</strong> Employee receives payment only for present days and half payment for half days. No payment for weekends, holidays, or absent days.
                  </p>
                </div>
                
                {/* Employee Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Employee: {calculatedSalaryData.employee.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Base Salary (Monthly):</span>
                      <span className="ml-2 font-medium">{formatCurrency(calculatedSalaryData.baseSalary)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Working Days:</span>
                      <span className="ml-2 font-medium">{calculatedSalaryData.workingDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Per Day Rate:</span>
                      <span className="ml-2 font-medium">{formatCurrency(calculatedSalaryData.perDaySalary)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Days in Month:</span>
                      <span className="ml-2 font-medium">{calculatedSalaryData.daysInMonth}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 flex items-center gap-2 text-sm">
                      <FaCalendarAlt className="text-green-600" />
                      Present Days (Paid)
                    </h3>
                    <p className="text-2xl font-bold text-green-600">{calculatedSalaryData.presentDays.count}</p>
                    <p className="text-sm text-green-700">{formatCurrency(calculatedSalaryData.presentDays.amount)}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-800 text-sm">Half Days (50% Paid)</h3>
                    <p className="text-2xl font-bold text-orange-600">{calculatedSalaryData.halfDays.count}</p>
                    <p className="text-sm text-orange-700">{formatCurrency(calculatedSalaryData.halfDays.amount)}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-800 text-sm">Absent Days (Unpaid)</h3>
                    <p className="text-2xl font-bold text-red-600">{calculatedSalaryData.absentDays.count}</p>
                    <p className="text-sm text-red-700">{formatCurrency(0)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm">Weekends (Unpaid)</h3>
                    <p className="text-2xl font-bold text-gray-600">{calculatedSalaryData.weekOffDays.count}</p>
                    <p className="text-sm text-gray-700">{formatCurrency(0)}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm">Holidays (Unpaid)</h3>
                    <p className="text-2xl font-bold text-gray-600">{calculatedSalaryData.holidayDays.count}</p>
                    <p className="text-sm text-gray-700">{formatCurrency(0)}</p>
                  </div>
                </div>

                {/* Detailed Breakdown Table */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Days</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedSalaryData.breakdown.map((item, index) => (
                          <tr key={index} className={`hover:bg-gray-50 ${item.paid ? 'bg-green-25' : 'bg-red-25'}`}>
                            <td className="border border-gray-300 px-4 py-2 font-medium">{item.type}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{item.days}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.rate)}</td>
                            <td className={`border border-gray-300 px-4 py-2 text-right font-semibold ${
                              item.paid ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.paid 
                                  ? item.type === 'Half Days' 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.paid 
                                  ? item.type === 'Half Days' 
                                    ? '50% PAID' 
                                    : 'PAID'
                                  : 'UNPAID'
                                }
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-50 font-bold">
                          <td className="border border-gray-300 px-4 py-2">Total Payable</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{calculatedSalaryData.totalPayableDays}</td>
                          <td className="border border-gray-300 px-4 py-2"></td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-blue-700 text-lg">
                            {formatCurrency(calculatedSalaryData.finalSalary)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">TOTAL</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Final Salary Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance-Based Monthly Salary</h3>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(calculatedSalaryData.finalSalary)}</p>
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Earned from {calculatedSalaryData.totalPayableDays} effective work days</p>
                      <p className="mt-1">
                        ({calculatedSalaryData.presentDays.count} full days + {calculatedSalaryData.halfDays.count} half days)
                      </p>
                      <p className="mt-1 text-xs">
                        Base salary would have been: {formatCurrency(calculatedSalaryData.baseSalary)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payroll Calculator */}
            {showCalculator && calculatedSalaryData && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Tax Calculation & Payroll Processing</h2>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Tax calculation will be based on the performance-based salary of {formatCurrency(calculatedSalaryData.finalSalary)} per month.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Salary (Performance-Based)
                      </label>
                      <input
                        type="number"
                        value={calculatedSalaryData.finalSalary}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Calculated from attendance"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DA (Dearness Allowance - Monthly)</label>
                      <input
                        type="number"
                        value={payrollForm.da}
                        onChange={(e) => setPayrollForm({...payrollForm, da: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter monthly DA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HRA Received (Monthly)</label>
                      <input
                        type="number"
                        value={payrollForm.hra_received}
                        onChange={(e) => setPayrollForm({...payrollForm, hra_received: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter monthly HRA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances (Monthly)</label>
                      <input
                        type="number"
                        value={payrollForm.other_allowances}
                        onChange={(e) => setPayrollForm({...payrollForm, other_allowances: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter monthly other allowances"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rent Paid (Monthly)</label>
                      <input
                        type="number"
                        value={payrollForm.rent_paid}
                        onChange={(e) => setPayrollForm({...payrollForm, rent_paid: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter monthly rent paid"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City Type</label>
                      <select
                        value={payrollForm.city}
                        onChange={(e) => setPayrollForm({...payrollForm, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Non-Metro">Non-Metro</option>
                        <option value="Metro">Metro</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={calculatePayroll}
                    disabled={loading || !selectedEmployee || !calculatedSalaryData}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCalculator />
                    {loading ? 'Calculating...' : `Calculate Tax & Final Payroll for ${getMonthName(selectedMonth)} ${selectedYear}`}
                  </button>
                </div>
              </div>
            )}

            {/* Payroll Results */}
            {payrollData && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Final Payroll Calculation - {getMonthName(selectedMonth)} {selectedYear}
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Performance-Based Salary (Monthly):</span>
                    <span className="font-semibold">{formatCurrency(calculatedSalaryData.finalSalary)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Gross Salary (Annual):</span>
                    <span className="font-semibold">{formatCurrency(payrollData.gross_salary)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">PF (Employee - Monthly):</span>
                    <span className="font-semibold">{formatCurrency(payrollData.pf_employee / 12)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">ESI (Employee - Monthly):</span>
                    <span className="font-semibold">{formatCurrency(payrollData.esic?.employee / 12)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Tax (Old Regime - Annual):</span>
                    <span className="font-semibold">{formatCurrency(payrollData.total_tax_old)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Tax (New Regime - Annual):</span>
                    <span className="font-semibold">{formatCurrency(payrollData.total_tax_new)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Recommendation:</span>
                    <span className={`font-semibold ${
                      payrollData.recommendation === 'Old Regime is better' 
                        ? 'text-green-600' 
                        : 'text-blue-600'
                    }`}>
                      {payrollData.recommendation}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-50 rounded-lg px-3">
                    <span className="font-bold text-lg">Net Take Home (Monthly):</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(payrollData.net_take_home / 12)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-green-50 rounded-lg px-3">
                    <span className="font-bold text-lg">Net Take Home (Annual):</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(payrollData.net_take_home)}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => downloadPayslip('pdf')}
                    disabled={!payrollData}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaFilePdf /> Download PDF
                  </button>
                  <button
                    onClick={() => downloadPayslip('excel')}
                    disabled={!payrollData}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaFileExcel /> Download Excel
                  </button>
                </div>
              </div>
            )}

            {/* Payroll History */}
            {showHistory && payrollHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payroll History</h2>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {payrollHistory.map((payroll, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {payroll.month && payroll.year 
                              ? `${getMonthName(payroll.month)} ${payroll.year}` 
                              : new Date(payroll.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">Net Take Home: {formatCurrency(payroll.net_take_home)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          payroll.recommendation === 'Old Regime is better' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payroll.recommendation}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Gross: {formatCurrency(payroll.gross_salary)}</div>
                        <div>PF: {formatCurrency(payroll.pf_employee)}</div>
                        <div>ESI: {formatCurrency(payroll.esic?.employee || 0)}</div>
                        <div>Tax: {formatCurrency(Math.min(payroll.total_tax_old, payroll.total_tax_new))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollManage;
