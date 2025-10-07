import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { employeeEndpoints, taxCalculationEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";
import { setReduxEmployees } from "../slices/employee";
import { FaCalculator, FaChartBar, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaEye, FaFileInvoiceDollar } from 'react-icons/fa';

const { GET_ALL_EMPLOYEE_BY_COMPANY_ID } = employeeEndpoints;

const TaxComputation = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const role = useSelector(state => state.auth.role);
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions);

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const employeesPerPage = 10;

  const [selectedFinancialYear, setSelectedFinancialYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [employeeTaxStatus, setEmployeeTaxStatus] = useState({});

  const [isCalculateModalOpen, setIsCalculateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalMode, setModalMode] = useState('calculate'); // 'calculate' or 'view'
  
  // Tax calculation form
  const [taxForm, setTaxForm] = useState({
    monthlyRent: 0,
    isMetroCity: true,
    otherIncome: 0
  });
  
  const [taxResult, setTaxResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.permissions.loading);

  // Get financial years
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

  // Fetch all employees with pagination
  const getAllEmployees = async (page = 1, search = "") => {
    try {
      dispatch(setLoading(true));
      const url = `${GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=${page}&limit=${employeesPerPage}${search ? `&search=${search}` : ''}`;
      
      const res = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      if (res.data.employees) {
        setEmployees(res.data.employees);
        setFilteredEmployees(res.data.employees);
        setTotalPages(res.data.totalPages || 1);
        setTotalEmployees(res.data.total || res.data.employees.length);
        setCurrentPage(page);
        
        // Check tax computation status for all employees
        checkTaxStatusForEmployees(res.data.employees);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch employees");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Check tax computation status for employees
  const checkTaxStatusForEmployees = async (employeesList) => {
    const statusMap = {};
    
    for (const emp of employeesList) {
      try {
        const url = taxCalculationEndpoints.getTaxComputation
          .replace(':employeeId', emp._id)
          .replace(':companyId', company._id) + `?financialYear=${selectedFinancialYear}`;
        
        const result = await apiConnector("GET", url, null, {
          Authorization: `Bearer ${token}`,
        });

        if (result.data.success && result.data.data) {
          const taxData = result.data.data;
          statusMap[emp._id] = {
            hasComputation: true,
            finalTaxLiability: taxData.calculationSummary?.finalTaxLiability || 0,
            recommendedRegime: taxData.calculationSummary?.recommendedRegime || 'old',
            taxData: taxData
          };
        } else {
          statusMap[emp._id] = { hasComputation: false, finalTaxLiability: 0 };
        }
      } catch (error) {
        statusMap[emp._id] = { hasComputation: false, finalTaxLiability: 0 };
      }
    }
    
    setEmployeeTaxStatus(statusMap);
  };

  // Handle financial year change
  const handleFinancialYearChange = (year) => {
    setSelectedFinancialYear(year);
    setCurrentPage(1);
  };

  // Handle employee search
  const handleEmployeeSearch = (searchValue) => {
    setEmployeeSearchTerm(searchValue);
    setCurrentPage(1);
    
    if (!searchValue.trim()) {
      getAllEmployees(1, "");
      return;
    }

    const timeoutId = setTimeout(() => {
      getAllEmployees(1, searchValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      getAllEmployees(newPage, employeeSearchTerm);
    }
  };

  // Open Calculate Modal
  const handleOpenCalculateModal = (emp) => {
    setSelectedEmployee(emp);
    setModalMode('calculate');
    setTaxForm({
      monthlyRent: 0,
      isMetroCity: true,
      otherIncome: 0
    });
    setTaxResult(null);
    setIsCalculateModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = async (emp) => {
    setSelectedEmployee(emp);
    setModalMode('view');
    setTaxResult(null);
    setIsCalculateModalOpen(true);

    try {
      dispatch(setLoading(true));
      const url = taxCalculationEndpoints.getTaxComputation
        .replace(':employeeId', emp._id)
        .replace(':companyId', company._id) + `?financialYear=${selectedFinancialYear}`;
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      if (result.data.success && result.data.data) {
        const taxData = result.data.data;
        
        // Format data for display
        const viewResult = {
          employee: {
            id: emp._id,
            name: `${emp.user?.profile?.firstName} ${emp.user?.profile?.lastName}`,
            employeeId: emp.employmentDetails?.employeeId
          },
          incomeSummary: {
            grossSalary: taxData.calculationSummary?.grossSalary || 0,
            totalExemptions: taxData.calculationSummary?.totalExemptions || 0,
            totalDeductions: taxData.calculationSummary?.totalDeductions || 0,
            netTaxableIncome: taxData.calculationSummary?.netTaxableIncome || 0
          },
          taxComparison: {
            oldRegime: {
              tax: taxData.calculationSummary?.oldRegimeTax || 0
            },
            newRegime: {
              tax: taxData.calculationSummary?.newRegimeTax || 0
            },
            recommendedRegime: taxData.calculationSummary?.recommendedRegime || 'old',
            finalTaxLiability: taxData.calculationSummary?.finalTaxLiability || 0
          },
          status: taxData.status
        };

        setTaxResult(viewResult);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch tax computation details");
      setIsCalculateModalOpen(false);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Calculate Tax
  const handleCalculateTax = async () => {
    try {
      setCalculating(true);
      const url = taxCalculationEndpoints.calculateEmployeeTax
        .replace(':employeeId', selectedEmployee._id)
        .replace(':companyId', company._id);
      
      const payload = {
        financialYear: selectedFinancialYear,
        rentDetails: {
          monthlyRent: parseFloat(taxForm.monthlyRent) || 0,
          isMetroCity: taxForm.isMetroCity
        },
        otherIncome: parseFloat(taxForm.otherIncome) || 0
      };
      
      const result = await apiConnector("POST", url, payload, {
        Authorization: `Bearer ${token}`,
      });

      if (result.data.success) {
        setTaxResult(result.data.data);
        toast.success("Tax calculated successfully!");
        
        // Update employee tax status
        setEmployeeTaxStatus(prev => ({
          ...prev,
          [selectedEmployee._id]: {
            hasComputation: true,
            finalTaxLiability: result.data.data.taxComparison.finalTaxLiability,
            recommendedRegime: result.data.data.taxComparison.recommendedRegime
          }
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to calculate tax");
    } finally {
      setCalculating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  useEffect(() => {
    if (company?._id && token) {
      getAllEmployees(1, "");
    }
  }, [company?._id, token, selectedFinancialYear]);

  return (
    <div className="flex">
      {role === 'superadmin' 
        ? (subAdminPermissions !== null ? <SubAdminSidebar /> : <AdminSidebar />)
        : role === 'admin' 
          ? <AdminSidebar /> 
          : role === 'manager'
            ? <ManagerSidebar />
            : role === 'hr'
              ? <HRSidebar />
              : <SubAdminSidebar />}
      
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        {(role === 'superadmin')
          ? (subAdminPermissions !== null ? <SubAdminHeader /> : <AdminHeader />)
          : role === 'admin' ? <AdminHeader/> :
            role === 'manager' ? <ManagerHeader/>:
            role === 'hr'?<HRHeader/>:
             <SubAdminHeader />}

        {loading ? (
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="px-6 mt-4">
            {/* Header with Financial Year Toggle */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FaFileInvoiceDollar className="text-3xl text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">Tax Computation</h1>
                    <p className="text-gray-600 text-sm mt-1">Calculate income tax for employees based on CTC and declarations</p>
                  </div>
                </div>
                
                {/* Financial Year Toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Financial Year:</label>
                  <select
                    value={selectedFinancialYear}
                    onChange={(e) => handleFinancialYearChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {getFinancialYears().map(year => (
                      <option key={year.value} value={year.value}>{year.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-blue-500 text-xl flex-shrink-0 mt-1" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-gray-800 mb-2">About Tax Computation:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Tax is calculated based on employee's CTC, flexi declarations, and tax investments</li>
                      <li>Comparison between Old Tax Regime and New Tax Regime is provided</li>
                      <li>HRA exemption, standard deduction, and Section 80C investments are considered</li>
                      <li>System recommends the most beneficial tax regime for the employee</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Employee List - {selectedFinancialYear}</h2>
                <input
                  type="text"
                  placeholder="Search by Employee ID, Name, or Email"
                  value={employeeSearchTerm}
                  onChange={(e) => handleEmployeeSearch(e.target.value)}
                  className="px-3 py-2 border rounded text-sm w-80"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Employee ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-left">Designation</th>
                      <th className="px-4 py-2 text-center">Tax Status</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees && filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const hasTax = employeeTaxStatus[emp._id]?.hasComputation || false;
                        const taxAmount = employeeTaxStatus[emp._id]?.finalTaxLiability || 0;
                        const regime = employeeTaxStatus[emp._id]?.recommendedRegime || 'old';
                        
                        return (
                          <tr 
                            key={emp._id} 
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="px-4 py-2 font-medium">{emp?.employmentDetails?.employeeId}</td>
                            <td className="px-4 py-2">
                              {emp?.user?.profile?.firstName} {emp?.user?.profile?.lastName}
                            </td>
                            <td className="px-4 py-2">{emp?.user?.email}</td>
                            <td className="px-4 py-2">{emp?.employmentDetails?.department?.name || 'N/A'}</td>
                            <td className="px-4 py-2">{emp?.employmentDetails?.designation || 'N/A'}</td>
                            <td className="px-4 py-2 text-center">
                              {hasTax ? (
                                <div className="flex flex-col items-center">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                    Calculated
                                  </span>
                                  <span className="text-xs text-gray-600 mt-1">
                                    {formatCurrency(taxAmount)}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    ({regime.toUpperCase()} Regime)
                                  </span>
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                  Not Calculated
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {hasTax ? (
                                <button
                                  onClick={() => handleOpenViewModal(emp)}
                                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition-colors text-xs flex items-center gap-2 mx-auto"
                                >
                                  <FaEye />
                                  View Tax
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenCalculateModal(emp)}
                                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors text-xs flex items-center gap-2 mx-auto"
                                >
                                  <FaCalculator />
                                  Calculate Tax
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * employeesPerPage) + 1} to {Math.min(currentPage * employeesPerPage, totalEmployees)} of {totalEmployees} employees
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tax Calculate/View Modal */}
      {isCalculateModalOpen && selectedEmployee && (
        <div className="fixed inset-0   bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    {modalMode === 'view' ? 'Tax Computation Details' : 'Calculate Income Tax'}
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedEmployee?.user?.profile?.firstName} {selectedEmployee?.user?.profile?.lastName} ({selectedEmployee?.employmentDetails?.employeeId}) - {selectedFinancialYear}
                  </p>
                </div>
                <button 
                  onClick={() => setIsCalculateModalOpen(false)} 
                  className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {modalMode === 'calculate' && !taxResult ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Tax will be calculated based on employee's CTC, flexi declarations, and any tax declarations submitted. You can optionally provide HRA details and other income.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent Amount (₹) - Optional
                      </label>
                      <input
                        type="number"
                        value={taxForm.monthlyRent}
                        onChange={(e) => setTaxForm({...taxForm, monthlyRent: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter monthly rent (if any)"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Income (₹) - Optional
                      </label>
                      <input
                        type="number"
                        value={taxForm.otherIncome}
                        onChange={(e) => setTaxForm({...taxForm, otherIncome: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Interest, rental income, etc."
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City Type (for HRA calculation)
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={taxForm.isMetroCity === true}
                          onChange={() => setTaxForm({...taxForm, isMetroCity: true})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Metro City (Delhi, Mumbai, Kolkata, Chennai)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={taxForm.isMetroCity === false}
                          onChange={() => setTaxForm({...taxForm, isMetroCity: false})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Non-Metro City</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : taxResult ? (
                <div className="space-y-6">
                  {/* Income Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3">Income Summary</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Gross Salary</p>
                        <p className="font-semibold text-lg">{formatCurrency(taxResult.incomeSummary.grossSalary)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Exemptions</p>
                        <p className="font-semibold text-lg text-green-600">{formatCurrency(taxResult.incomeSummary.totalExemptions)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Deductions</p>
                        <p className="font-semibold text-lg text-green-600">{formatCurrency(taxResult.incomeSummary.totalDeductions)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Net Taxable Income</p>
                        <p className="font-semibold text-lg text-blue-700">{formatCurrency(taxResult.incomeSummary.netTaxableIncome)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tax Regime Comparison */}
                  <div>
                    <h4 className="font-bold text-lg mb-3">Tax Regime Comparison</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Old Regime */}
                      <div className={`border-2 rounded-lg p-4 ${
                        taxResult.taxComparison.recommendedRegime === 'old' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-gray-800">Old Tax Regime</h5>
                          {taxResult.taxComparison.recommendedRegime === 'old' && (
                            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-bold text-gray-800 mb-2">
                          {formatCurrency(taxResult.taxComparison.oldRegime.tax)}
                        </p>
                        <p className="text-xs text-gray-600">
                          With exemptions & deductions
                        </p>
                      </div>

                      {/* New Regime */}
                      <div className={`border-2 rounded-lg p-4 ${
                        taxResult.taxComparison.recommendedRegime === 'new' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-gray-800">New Tax Regime</h5>
                          {taxResult.taxComparison.recommendedRegime === 'new' && (
                            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-bold text-gray-800 mb-2">
                          {formatCurrency(taxResult.taxComparison.newRegime.tax)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Lower rates, no exemptions
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Final Tax Liability */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm mb-1">Final Tax Liability ({taxResult.taxComparison.recommendedRegime.toUpperCase()} Regime)</p>
                        <p className="text-4xl font-bold">{formatCurrency(taxResult.taxComparison.finalTaxLiability)}</p>
                        <p className="text-blue-100 text-xs mt-2">Including 4% Health & Education Cess</p>
                      </div>
                      <FaCheckCircle className="text-6xl text-blue-300" />
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Tax Optimization Recommendations:</p>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                          <li>The <strong>{taxResult.taxComparison.recommendedRegime.toUpperCase()} Tax Regime</strong> is recommended for this employee</li>
                          <li>Potential savings of <strong>{formatCurrency(Math.abs(taxResult.taxComparison.oldRegime.tax - taxResult.taxComparison.newRegime.tax))}</strong> compared to the other regime</li>
                          <li>Ensure all tax declarations and investment proofs are submitted on time</li>
                          <li>Review and update tax declarations quarterly for accurate TDS deduction</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Exemption & Deduction Breakdown */}
                  {taxResult.exemptionBreakdown && (
                    <div className="bg-white border rounded-lg p-4">
                      <h5 className="font-bold text-gray-800 mb-3">Exemptions & Deductions Applied</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-700">Exemptions:</p>
                          <ul className="space-y-1 text-gray-600">
                            {Object.entries(taxResult.exemptionBreakdown || {}).map(([key, value]) => (
                              <li key={key} className="flex justify-between">
                                <span>{key}:</span>
                                <span className="font-semibold">{formatCurrency(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-700">Deductions:</p>
                          <ul className="space-y-1 text-gray-600">
                            {Object.entries(taxResult.deductionBreakdown || {}).map(([key, value]) => (
                              <li key={key} className="flex justify-between">
                                <span>{key}:</span>
                                <span className="font-semibold">{formatCurrency(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
              <button
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                onClick={() => {
                  if (taxResult && modalMode === 'calculate') {
                    setTaxResult(null);
                  } else {
                    setIsCalculateModalOpen(false);
                  }
                }}
              >
                {taxResult && modalMode === 'calculate' ? "Back" : "Close"}
              </button>
              {modalMode === 'calculate' && !taxResult && (
                <button
                  className={`px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 ${
                    calculating ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  onClick={handleCalculateTax}
                  disabled={calculating}
                >
                  {calculating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <FaCalculator />
                      Calculate Tax
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxComputation;
