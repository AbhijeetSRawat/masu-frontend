import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaFileExcel, FaDownload, FaFilter, FaSearch, FaCalendarAlt, FaUsers, FaRupeeSign } from 'react-icons/fa';

const PayrollCalculationReport = () => {
  const [employees, setEmployees] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    month: '',
    year: new Date().getFullYear()
  });
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalTax: 0,
    averageSalary: 0
  });

  const token = useSelector((state) => state.auth.token);
  const company = useSelector((state) => state.permissions.company);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchPayrollData();
    }
  }, [employees]);

  useEffect(() => {
    applyFilters();
  }, [payrollData, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiConnector(
        "GET",
        `${employeeEndpoints.GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=1&limit=1000`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      console.log(response)
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      
      // Fetch real payroll data for all employees
      const allPayrollData = [];
      
      for (const employee of employees) {
        try {
          const response = await apiConnector(
            "GET",
            `${payrollEndpoints.GET_PAYROLL_HISTORY}${employee._id}?page=1&limit=1`,
            null,
            {
              Authorization: `Bearer ${token}`,
            }
          );
          
          if (response.data.payrollHistory && response.data.payrollHistory.length > 0) {
            const latestPayroll = response.data.payrollHistory[0];
            allPayrollData.push({
              _id: latestPayroll._id,
              employee: employee,
              gross_salary: latestPayroll.gross_salary,
              net_take_home: latestPayroll.net_take_home,
              total_tax_old: latestPayroll.total_tax_old,
              total_tax_new: latestPayroll.total_tax_new,
              recommendation: latestPayroll.recommendation,
              createdAt: latestPayroll.createdAt
            });
          } else {
            // If no payroll history exists, calculate from employee salary data
            const calculatedPayroll = calculatePayrollFromEmployeeData(employee);
            if (calculatedPayroll) {
              allPayrollData.push(calculatedPayroll);
            }
          }
        } catch (error) {
          console.error(`Error fetching payroll for employee ${employee._id}:`, error);
          // Calculate from employee data if API fails
          const calculatedPayroll = calculatePayrollFromEmployeeData(employee);
          if (calculatedPayroll) {
            allPayrollData.push(calculatedPayroll);
          }
        }
      }
      
      setPayrollData(allPayrollData);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast.error('Failed to fetch payroll data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePayrollFromEmployeeData = (employee) => {
    if (!employee?.employmentDetails) return null;

    const salary = employee.employmentDetails.salary || {};
    const basicSalary = salary.base || 0;
    const da = employee.employmentDetails.da || 0;
    const hra = employee.employmentDetails.hra_received || 0;
    const otherAllowances = employee.employmentDetails.other_allowances || 0;
    const grossSalary = basicSalary + da + hra + otherAllowances;
    
    if (grossSalary === 0) return null; // Skip employees with no salary data
    
    const pfEmployee = Math.round(grossSalary * 0.12);
    const esicEmployee = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
    const hraExemption = Math.round(Math.min(hra, Math.max(0, (employee.employmentDetails.rent_paid || 0) - basicSalary * 0.1), basicSalary * 0.5));
    
    const taxableIncomeOld = grossSalary - 50000 - pfEmployee - esicEmployee;
    const taxableIncomeNew = grossSalary - 75000 - pfEmployee - esicEmployee;
    
    const taxOld = calculateTax(taxableIncomeOld);
    const taxNew = calculateTax(taxableIncomeNew);
    
    const netTakeHome = grossSalary - pfEmployee - esicEmployee - Math.min(taxOld, taxNew);
    
    return {
      _id: `calculated_${employee._id}`,
      employee: employee,
      gross_salary: grossSalary,
      net_take_home: netTakeHome,
      total_tax_old: taxOld,
      total_tax_new: taxNew,
      recommendation: taxOld <= taxNew ? 'Old Regime is better' : 'New Regime is better',
      createdAt: new Date()
    };
  };

  const calculateTax = (income) => {
    if (income <= 400000) return 0;
    if (income <= 800000) return (income - 400000) * 0.05;
    if (income <= 1200000) return 20000 + (income - 800000) * 0.10;
    if (income <= 1600000) return 60000 + (income - 1200000) * 0.15;
    if (income <= 2000000) return 120000 + (income - 1600000) * 0.20;
    return 200000 + (income - 2000000) * 0.30;
  };

  const applyFilters = () => {
    let filtered = [...payrollData];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(item => {
        const employeeName = item.employee.user?.profile?.firstName && item.employee.user?.profile?.lastName 
          ? `${item.employee.user.profile.firstName} ${item.employee.user.profile.lastName}`
          : item.employee.user?.profile?.firstName || 'N/A';
        const employeeId = item.employee.employmentDetails?.employeeId || 'N/A';
        
        return employeeName.toLowerCase().includes(filters.search.toLowerCase()) ||
               employeeId.toLowerCase().includes(filters.search.toLowerCase());
      });
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(item =>
        item.employee.employmentDetails?.department?.name === filters.department
      );
    }

    // Month filter
    if (filters.month) {
      filtered = filtered.filter(item => {
        const itemMonth = new Date(item.createdAt).getMonth() + 1;
        return itemMonth === parseInt(filters.month);
      });
    }

    // Year filter
    if (filters.year) {
      filtered = filtered.filter(item => {
        const itemYear = new Date(item.createdAt).getFullYear();
        return itemYear === parseInt(filters.year);
      });
    }

    setFilteredData(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (data) => {
    const totalEmployees = data.length;
    const totalGrossSalary = data.reduce((sum, item) => sum + (item.gross_salary || 0), 0);
    const totalNetSalary = data.reduce((sum, item) => sum + (item.net_take_home || 0), 0);
    const totalTax = data.reduce((sum, item) => sum + Math.min(item.total_tax_old || 0, item.total_tax_new || 0), 0);
    const averageSalary = totalEmployees > 0 ? totalNetSalary / totalEmployees : 0;

    setStats({
      totalEmployees,
      totalGrossSalary,
      totalNetSalary,
      totalTax,
      averageSalary
    });
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`${payrollEndpoints.GET_PAYROLL_REPORT}${company._id}?month=${filters.month}&year=${filters.year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-report-${filters.month || 'all'}-${filters.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Payroll report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getDepartments = () => {
    const departments = [...new Set(employees.map(emp => emp.employmentDetails?.department?.name).filter(Boolean))];
    return departments;
  };

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
                  <FaFileExcel className="text-green-600" />
                  Payroll Calculation Report
                </h1>
                <p className="text-gray-600">Comprehensive payroll analysis and reporting</p>
              </div>
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mt-4 lg:mt-0"
              >
                <FaDownload /> Download Excel Report
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <FaRupeeSign className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Gross Salary</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalGrossSalary)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <FaRupeeSign className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Net Salary</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalNetSalary)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <FaRupeeSign className="text-red-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tax</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalTax)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FaRupeeSign className="text-yellow-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Salary</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageSalary)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaFilter className="text-blue-600" />
              Filters
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Employee</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {getDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({...filters, month: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getMonthOptions().map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getYearOptions().map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Payroll Data</h2>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payroll data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax (Old)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax (New)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommendation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.employee.user?.profile?.firstName && item.employee.user?.profile?.lastName 
                                ? `${item.employee.user.profile.firstName} ${item.employee.user.profile.lastName}`
                                : item.employee.user?.profile?.firstName || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.employee.employmentDetails?.employeeId || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.employee.employmentDetails?.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.gross_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.net_take_home)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total_tax_old)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.total_tax_new)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.recommendation === 'Old Regime is better' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.recommendation === 'Old Regime is better' ? 'Old' : 'New'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredData.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No payroll data found for the selected filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollCalculationReport;
