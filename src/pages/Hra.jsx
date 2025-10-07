import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { employeeEndpoints, ctcEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";
import { setReduxEmployees } from "../slices/employee";
import { FaCalculator, FaHome, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaEye } from 'react-icons/fa';

const { GET_ALL_EMPLOYEE_BY_COMPANY_ID } = employeeEndpoints;

const HRACalculator = () => {
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
  const [employeeHRAStatus, setEmployeeHRAStatus] = useState({});

  const [isCalculateModalOpen, setIsCalculateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalMode, setModalMode] = useState('calculate'); // 'calculate' or 'view'
  const [hraForm, setHRAForm] = useState({
    monthlyRent: 0,
    isMetroCity: true,
    financialYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  });
  const [hraResult, setHRAResult] = useState(null);
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
        
        // Check HRA status for all employees
        checkHRAStatusForEmployees(res.data.employees);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch employees");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Check HRA calculation status for employees
  const checkHRAStatusForEmployees = async (employeesList) => {
    const statusMap = {};
    
    for (const emp of employeesList) {
      try {
        const url = ctcEndpoints.getCTCByEmployee
          .replace(':employeeId', emp._id)
          .replace(':companyId', company._id) + `?financialYear=${selectedFinancialYear}`;
        
        const result = await apiConnector("GET", url, null, {
          Authorization: `Bearer ${token}`,
        });

        if (result.data.success && result.data.data) {
          const ctcData = result.data.data;
          statusMap[emp._id] = {
            hasHRA: ctcData.hraExemption > 0,
            hraExemption: ctcData.hraExemption,
            ctcData: ctcData
          };
        } else {
          statusMap[emp._id] = { hasHRA: false, hraExemption: 0 };
        }
      } catch (error) {
        statusMap[emp._id] = { hasHRA: false, hraExemption: 0 };
      }
    }
    
    setEmployeeHRAStatus(statusMap);
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
    setHRAForm({
      monthlyRent: 0,
      isMetroCity: true,
      financialYear: selectedFinancialYear
    });
    setHRAResult(null);
    setIsCalculateModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = async (emp) => {
    setSelectedEmployee(emp);
    setModalMode('view');
    setHRAResult(null);
    setIsCalculateModalOpen(true);

    try {
      dispatch(setLoading(true));
      const url = ctcEndpoints.getCTCByEmployee
        .replace(':employeeId', emp._id)
        .replace(':companyId', company._id) + `?financialYear=${selectedFinancialYear}`;
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      if (result.data.success && result.data.data) {
        const ctcData = result.data.data;
        
        // Get basic salary
        const basicSalaryComponent = ctcData.monthlyBreakup.find(
          item => item.salaryHead === 'Basic'
        );
        const basicSalary = basicSalaryComponent ? basicSalaryComponent.annualAmount : 0;

        // Get HRA
        let declaredHRA = 0;
        if (ctcData.flexiDetails) {
          const hraDeclaration = ctcData.flexiDetails.declarations?.find(
            decl => decl.headCode === 'HRA'
          );
          declaredHRA = hraDeclaration ? hraDeclaration.declaredAmount : 0;
        }
        
        if (!declaredHRA) {
          const hraComponent = ctcData.monthlyBreakup.find(
            item => item.salaryHead === 'HRA'
          );
          declaredHRA = hraComponent ? hraComponent.annualAmount : 0;
        }

        // Construct view result from saved data
        const viewResult = {
          employee: {
            id: emp._id,
            name: `${emp.user?.profile?.firstName} ${emp.user?.profile?.lastName}`,
            employeeId: emp.employmentDetails?.employeeId
          },
          ctcDetails: {
            annualCTC: ctcData.annualCTC,
            basicSalary: basicSalary,
            declaredHRA: declaredHRA,
            financialYear: ctcData.financialYear
          },
          exemptionCalculation: {
            exemptionAmount: ctcData.hraExemption || 0,
            actualHRA: declaredHRA,
            statutoryLimit: basicSalary * 0.5,
            rentMinusTenPercent: 0, // Will be calculated from saved data
            taxableAmount: declaredHRA - (ctcData.hraExemption || 0)
          }
        };

        setHRAResult(viewResult);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch HRA details");
      setIsCalculateModalOpen(false);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Calculate HRA
  const handleCalculateHRA = async () => {
    if (!hraForm.monthlyRent || hraForm.monthlyRent <= 0) {
      toast.error("Please enter valid monthly rent amount");
      return;
    }

    try {
      setCalculating(true);
      const url = ctcEndpoints.calculateHRAExemptionAPI.replace(':employeeId', selectedEmployee._id);
      
      const result = await apiConnector("POST", url, hraForm, {
        Authorization: `Bearer ${token}`,
      });

      if (result.data.success) {
        setHRAResult(result.data.data);
        toast.success("HRA exemption calculated successfully!");
        
        // Update employee HRA status
        setEmployeeHRAStatus(prev => ({
          ...prev,
          [selectedEmployee._id]: {
            hasHRA: true,
            hraExemption: result.data.data.exemptionCalculation.exemptionAmount
          }
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to calculate HRA exemption");
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
                  <FaHome className="text-3xl text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">HRA Exemption Calculator</h1>
                    <p className="text-gray-600 text-sm mt-1">Calculate House Rent Allowance tax exemption for employees</p>
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
                    <p className="font-semibold text-gray-800 mb-2">About HRA Exemption:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>HRA exemption is calculated as the minimum of three values</li>
                      <li>Actual HRA received, 50% of basic salary (metro) or 40% (non-metro), or Rent - 10% of basic salary</li>
                      <li>Metro cities include Delhi, Mumbai, Kolkata, and Chennai</li>
                      <li>Rent receipts are mandatory for claims above ₹3,000/month</li>
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
                      <th className="px-4 py-2 text-center">HRA Status</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees && filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const hasHRA = employeeHRAStatus[emp._id]?.hasHRA || false;
                        const hraAmount = employeeHRAStatus[emp._id]?.hraExemption || 0;
                        
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
                              {hasHRA ? (
                                <div className="flex flex-col items-center">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                    Calculated
                                  </span>
                                  <span className="text-xs text-gray-600 mt-1">
                                    {formatCurrency(hraAmount)}
                                  </span>
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                  Not Calculated
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {hasHRA ? (
                                <button
                                  onClick={() => handleOpenViewModal(emp)}
                                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition-colors text-xs flex items-center gap-2 mx-auto"
                                >
                                  <FaEye />
                                  View HRA
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenCalculateModal(emp)}
                                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors text-xs flex items-center gap-2 mx-auto"
                                >
                                  <FaCalculator />
                                  Calculate HRA
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

      {/* HRA Calculate/View Modal */}
      {isCalculateModalOpen && selectedEmployee && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    {modalMode === 'view' ? 'HRA Exemption Details' : 'HRA Exemption Calculator'}
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
              {modalMode === 'calculate' && !hraResult ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={hraForm.monthlyRent}
                      onChange={(e) => setHRAForm({...hraForm, monthlyRent: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      placeholder="Enter monthly rent amount"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City Type *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={hraForm.isMetroCity === true}
                          onChange={() => setHRAForm({...hraForm, isMetroCity: true})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Metro City (Delhi, Mumbai, Kolkata, Chennai)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={hraForm.isMetroCity === false}
                          onChange={() => setHRAForm({...hraForm, isMetroCity: false})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Non-Metro City</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Financial Year
                    </label>
                    <input
                      type="text"
                      value={hraForm.financialYear}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              ) : hraResult ? (
                <div className="space-y-6">
                  {/* CTC Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3">CTC Details</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Annual CTC</p>
                        <p className="font-semibold text-lg">{formatCurrency(hraResult.ctcDetails.annualCTC)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Basic Salary</p>
                        <p className="font-semibold text-lg">{formatCurrency(hraResult.ctcDetails.basicSalary)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Declared HRA</p>
                        <p className="font-semibold text-lg">{formatCurrency(hraResult.ctcDetails.declaredHRA)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rent Details - Only show if in calculate mode */}
                  {modalMode === 'calculate' && hraResult.rentDetails && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-bold text-lg mb-3">Rent Details</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Monthly Rent</p>
                          <p className="font-semibold text-lg">{formatCurrency(hraResult.rentDetails.monthlyRent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Annual Rent</p>
                          <p className="font-semibold text-lg">{formatCurrency(hraResult.rentDetails.annualRent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">City Type</p>
                          <p className="font-semibold text-lg">{hraResult.rentDetails.cityType}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exemption Calculation */}
                  <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                    <h4 className="font-bold text-lg mb-3 text-green-800">HRA Exemption Calculation</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Actual HRA Received</span>
                        <span className="font-semibold">{formatCurrency(hraResult.exemptionCalculation.actualHRA)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">50% of Basic Salary (Metro) / 40% (Non-Metro)</span>
                        <span className="font-semibold">{formatCurrency(hraResult.exemptionCalculation.statutoryLimit)}</span>
                      </div>
                      {hraResult.exemptionCalculation.rentMinusTenPercent > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Rent - 10% of Basic</span>
                          <span className="font-semibold">{formatCurrency(hraResult.exemptionCalculation.rentMinusTenPercent)}</span>
                        </div>
                      )}
                      <hr className="border-gray-300" />
                      <div className="flex justify-between items-center bg-green-600 text-white p-3 rounded">
                        <span className="font-bold text-lg">HRA Exemption Amount</span>
                        <span className="font-bold text-2xl">{formatCurrency(hraResult.exemptionCalculation.exemptionAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Taxable HRA</span>
                        <span className="font-semibold text-red-600">{formatCurrency(hraResult.exemptionCalculation.taxableAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations - Only in calculate mode */}
                  {modalMode === 'calculate' && hraResult.recommendations && hraResult.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg">Recommendations</h4>
                      {hraResult.recommendations.map((rec, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg flex gap-3 ${
                            rec.type === 'INCREASE_HRA' ? 'bg-green-50 border border-green-200' :
                            rec.type === 'DECREASE_HRA' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-orange-50 border border-orange-200'
                          }`}
                        >
                          {rec.type === 'INCREASE_HRA' && <FaCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-1" />}
                          {rec.type === 'DECREASE_HRA' && <FaExclamationTriangle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />}
                          {rec.type === 'RENT_TOO_LOW' && <FaInfoCircle className="text-orange-600 text-xl flex-shrink-0 mt-1" />}
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{rec.message}</p>
                            {rec.current && (
                              <div className="mt-2 text-xs text-gray-600">
                                <span>Current: {formatCurrency(rec.current)}</span>
                                {rec.suggested && <span className="ml-3">Suggested: {formatCurrency(rec.suggested)}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
              <button
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                onClick={() => {
                  if (hraResult && modalMode === 'calculate') {
                    setHRAResult(null);
                  } else {
                    setIsCalculateModalOpen(false);
                  }
                }}
              >
                {hraResult && modalMode === 'calculate' ? "Back" : "Close"}
              </button>
              {modalMode === 'calculate' && !hraResult && (
                <button
                  className={`px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 ${
                    calculating ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  onClick={handleCalculateHRA}
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
                      Calculate
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

export default HRACalculator;
