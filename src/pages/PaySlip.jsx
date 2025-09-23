import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaDownload, FaFilePdf, FaFileExcel, FaCalendarAlt, FaHistory, FaRupeeSign } from 'react-icons/fa';
import { MdAccountBalance } from 'react-icons/md';

const PaySlip = () => {
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const employee = useSelector((state) => state.employees.reduxEmployee);

  useEffect(() => {
    if (employee?._id || user?._id) {
      fetchPayrollHistory();
    }
  }, [employee, user]);

  const fetchPayrollHistory = async () => {
    try {
      setLoading(true);
      const employeeId = employee?._id;
      
      if (!employeeId) {
        toast.error('Employee data not found');
        return;
      }
      
      const response = await apiConnector(
        "GET",
        `${payrollEndpoints.GET_PAYROLL_HISTORY}${employeeId}?page=1&limit=50`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data.payrollHistory) {
        setPayrollHistory(response.data.payrollHistory);
        // Auto-select the most recent payroll if available
        if (response.data.payrollHistory.length > 0) {
          setSelectedPayroll(response.data.payrollHistory[0]);
        }
      } else {
        setPayrollHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payroll history:', error);
      toast.error('Failed to fetch payroll history');
      setPayrollHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (format) => {
    if (!selectedPayroll) {
      toast.error('Please select a payslip to download');
      return;
    }

    try {
      const employeeId = employee?._id || user?._id;
      const endpoint = format === 'pdf' 
        ? `${payrollEndpoints.DOWNLOAD_PAYSLIP_PDF}${employeeId}`
        : `${payrollEndpoints.DOWNLOAD_PAYSLIP_EXCEL}${employeeId}`;
      
      // Add month and year parameters if available
      let url = endpoint;
      if (selectedPayroll.month && selectedPayroll.year) {
        url += `?month=${selectedPayroll.month}&year=${selectedPayroll.year}`;
      }
      
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
      
      // Better filename with month/year if available
      const dateStr = selectedPayroll.month && selectedPayroll.year 
        ? `${selectedPayroll.year}-${String(selectedPayroll.month).padStart(2, '0')}`
        : new Date(selectedPayroll.createdAt).toISOString().split('T')[0];
      
      a.download = `payslip-${getEmployeeName()}-${dateStr}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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

  const getEmployeeName = () => {
    if (employee?.user?.profile?.firstName) {
      return `${employee.user.profile.firstName} ${employee.user.profile.lastName || ''}`.trim();
    }
    if (employee?.personalDetails?.firstName) {
      return `${employee.personalDetails.firstName} ${employee.personalDetails.lastName || ''}`.trim();
    }
    if (user?.profile?.firstName) {
      return `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
    }
    return user?.name || employee?.name || 'Employee';
  };

  const getEmployeeId = () => {
    return employee?.employmentDetails?.employeeId || user?.employeeId || 'N/A';
  };

  const getDepartment = () => {
    return employee?.employmentDetails?.department?.name || user?.department || 'N/A';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (monthNumber) => {
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber] || '';
  };

  const formatPayrollDate = (payroll) => {
    if (payroll.month && payroll.year) {
      return `${getMonthName(payroll.month)} ${payroll.year}`;
    }
    return formatDate(payroll.createdAt);
  };

  // Updated filtering logic to use month/year fields from payroll
  const filteredPayrollHistory = payrollHistory.filter(payroll => {
    // If payroll has month/year fields, use them
    if (payroll.month && payroll.year) {
      if (selectedMonth && selectedYear) {
        return payroll.month === parseInt(selectedMonth) && payroll.year === parseInt(selectedYear);
      } else if (selectedYear) {
        return payroll.year === parseInt(selectedYear);
      }
      return true;
    }
    
    // Fallback to createdAt date
    const payrollDate = new Date(payroll.createdAt);
    const month = payrollDate.getMonth() + 1;
    const year = payrollDate.getFullYear();
    
    if (selectedMonth && selectedYear) {
      return month === parseInt(selectedMonth) && year === parseInt(selectedYear);
    } else if (selectedYear) {
      return year === parseInt(selectedYear);
    }
    return true;
  });

  const getMonthOptions = () => {
    const months = [
      { value: '', label: 'All Months' },
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
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  };

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
                <MdAccountBalance className="text-3xl text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-1">Pay Slips</h1>
                  <p className="text-gray-600">View and download your monthly payslips</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 lg:mt-0">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {getMonthOptions().map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {getYearOptions().map(year => (
                      <option key={year.value} value={year.value}>{year.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Payroll History List */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FaHistory />
                    Payroll History ({filteredPayrollHistory.length} records)
                  </h2>
                </div>
                
                <div className="p-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading payslips...</p>
                    </div>
                  ) : filteredPayrollHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <FaHistory className="text-4xl text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        {payrollHistory.length === 0 
                          ? "No payslips found. Please contact HR to generate your payslip."
                          : "No payslips found for the selected period"
                        }
                      </p>
                      {selectedMonth || selectedYear !== new Date().getFullYear() ? (
                        <button
                          onClick={() => {
                            setSelectedMonth('');
                            setSelectedYear(new Date().getFullYear());
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          Show all payslips
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredPayrollHistory.map((payroll, index) => (
                        <div
                          key={payroll._id || index}
                          onClick={() => setSelectedPayroll(payroll)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedPayroll?._id === payroll._id
                              ? 'bg-blue-50 border-blue-500 shadow-md'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">
                                {formatPayrollDate(payroll)}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <FaRupeeSign className="text-xs" />
                                  Net (Monthly): {formatCurrency(payroll.net_take_home / 12)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Gross (Monthly): {formatCurrency(payroll.gross_salary / 12)}
                                </p>
                              </div>
                              {payroll.month && payroll.year && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Generated: {formatDate(payroll.createdAt)}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              payroll.recommendation === 'Old Regime is better' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payroll.recommendation === 'Old Regime is better' ? 'Old Regime' : 'New Regime'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payroll Details */}
            <div className="lg:col-span-8">
              {selectedPayroll ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">Pay Slip</h2>
                        <p className="text-blue-100">{formatPayrollDate(selectedPayroll)}</p>
                        {selectedPayroll.month && selectedPayroll.year && (
                          <p className="text-blue-200 text-sm mt-1">
                            Generated on: {formatDate(selectedPayroll.createdAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadPayslip('pdf')}
                          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaFilePdf /> PDF
                        </button>
                        <button
                          onClick={() => downloadPayslip('excel')}
                          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <FaFileExcel /> Excel
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Employee Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-800 mb-3">Employee Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-gray-800">{getEmployeeName()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="font-medium text-gray-800">{getEmployeeId()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium text-gray-800">{getDepartment()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pay Period</p>
                          <p className="font-medium text-gray-800">{formatPayrollDate(selectedPayroll)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div className="space-y-6">
                      <h3 className="font-semibold text-gray-800 text-xl">Salary Breakdown</h3>
                      
                      {/* Earnings */}
                      <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <FaRupeeSign />
                          Earnings (Monthly)
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Basic Salary</span>
                            <span className="font-medium">{formatCurrency((selectedPayroll.input_snapshot?.basic_salary || 0) / 12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Dearness Allowance (DA)</span>
                            <span className="font-medium">{formatCurrency((selectedPayroll.input_snapshot?.da || 0) / 12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">House Rent Allowance (HRA)</span>
                            <span className="font-medium">{formatCurrency((selectedPayroll.input_snapshot?.hra_received || 0) / 12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Other Allowances</span>
                            <span className="font-medium">{formatCurrency((selectedPayroll.input_snapshot?.other_allowances || 0) / 12)}</span>
                          </div>
                          <div className="flex justify-between border-t border-green-200 pt-2 font-semibold text-lg">
                            <span>Gross Salary (Monthly)</span>
                            <span className="text-green-700">{formatCurrency(selectedPayroll.gross_salary / 12)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Gross Salary (Annual)</span>
                            <span>{formatCurrency(selectedPayroll.gross_salary)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                        <h4 className="font-semibold text-red-800 mb-3">Deductions (Monthly)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Provident Fund (PF)</span>
                            <span className="font-medium">{formatCurrency(selectedPayroll.pf_employee / 12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Employee State Insurance (ESI)</span>
                            <span className="font-medium">{formatCurrency((selectedPayroll.esic?.employee || 0) / 12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Income Tax (Old Regime)</span>
                            <span className="font-medium">{formatCurrency(selectedPayroll.total_tax_old / 12)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Income Tax (New Regime)</span>
                            <span className="font-medium">{formatCurrency(selectedPayroll.total_tax_new / 12)}</span>
                          </div>
                          <div className="flex justify-between border-t border-red-200 pt-2 font-semibold text-lg">
                            <span>Total Deductions (Monthly)</span>
                            <span className="text-red-700">
                              {formatCurrency(
                                (selectedPayroll.pf_employee + 
                                (selectedPayroll.esic?.employee || 0) + 
                                Math.min(selectedPayroll.total_tax_old, selectedPayroll.total_tax_new)) / 12
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Total Deductions (Annual)</span>
                            <span>
                              {formatCurrency(
                                selectedPayroll.pf_employee + 
                                (selectedPayroll.esic?.employee || 0) + 
                                Math.min(selectedPayroll.total_tax_old, selectedPayroll.total_tax_new)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tax Regime Recommendation */}
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <h4 className="font-semibold text-blue-800 mb-3">Tax Regime Recommendation</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                            selectedPayroll.recommendation === 'Old Regime is better' 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {selectedPayroll.recommendation}
                          </span>
                          <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded">
                            <div>Tax Difference (Monthly): {formatCurrency(Math.abs(selectedPayroll.total_tax_old - selectedPayroll.total_tax_new) / 12)}</div>
                            <div className="text-xs mt-1">Tax Difference (Annual): {formatCurrency(Math.abs(selectedPayroll.total_tax_old - selectedPayroll.total_tax_new))}</div>
                          </div>
                        </div>
                      </div>

                      {/* Net Salary - MONTHLY PRIORITY */}
                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span className="text-xl font-bold">Net Take Home (Monthly)</span>
                            <span className="text-3xl font-bold">{formatCurrency(selectedPayroll.net_take_home / 12)}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 opacity-80">
                            <span className="text-sm font-medium">Net Take Home (Annual)</span>
                            <span className="text-lg font-semibold">{formatCurrency(selectedPayroll.net_take_home)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Payslip</h3>
                  <p className="text-gray-500">Choose a payslip from the history to view detailed breakdown</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaySlip;
