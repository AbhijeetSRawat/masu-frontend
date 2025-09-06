import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";
import { regularizationEndpoints, shiftEndpoints } from "../services/api";

const { 
  getRegularizations,
  getRegularization,
  createRegularization,
  updateRegularization,
  deleteRegularization 
} = regularizationEndpoints;

const{GET_ALL_SHIFTS} = shiftEndpoints;

const EmployeeRegularisation = () => {
  const company = useSelector((state) => state.permissions.company);
  const user = useSelector((state) => state.employees.reduxEmployee);
  const loading = useSelector((state) => state.permissions.loading);
  const token = useSelector(state => state.auth.token);
  const dispatch = useDispatch();

  const [regularizations, setRegularizations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRegularization, setSelectedRegularization] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Updated formData to match new schema with 'from' and 'to' dates
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    shift: "",
    requestedInTime: "",
    requestedOutTime: "",
    reason: "",
    regularizationType: "work_from_home"
  });

  // Fetch regularizations for the employee with pagination
  const fetchRegularizations = async (page = 1, limit = itemsPerPage) => {
    try {
      dispatch(setLoading(true));
      const queryParams = new URLSearchParams({
        companyId: company._id,
        employeeId: user._id,
        page: page.toString(),
        limit: limit.toString()
      });
      
      const res = await apiConnector(
        "GET", 
        `${getRegularizations}?${queryParams.toString()}`,
        null,
        { Authorization: `Bearer ${token}` }
      );
      
      console.log(res);
      setRegularizations(res.data.data || []);
      setCurrentPage(res.data.page || 1);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (error) {
      console.log("Error fetching regularizations:", error);
      toast.error("Failed to fetch regularizations");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch available shifts
  const fetchShifts = async () => {
    try {
      const res = await apiConnector(
        "GET", 
        `${GET_ALL_SHIFTS}${company._id}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      setShifts(res.data.data || []);
    } catch (error) {
      console.log("Error fetching shifts:", error);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchRegularizations(page, itemsPerPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchRegularizations(1, newLimit);
  };

  // Generate pagination buttons
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === i
              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  useEffect(() => {
    if (company?._id && user?._id) {
      fetchRegularizations(1, itemsPerPage);
      fetchShifts();
      
      // Set default shift from employee data
      if (user?.shift?._id || user?.employmentDetails?.shift?._id) {
        setFormData(prev => ({
          ...prev,
          shift: user.shift?._id || user.employmentDetails?.shift?._id
        }));
      }
    }
  }, [company, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      from: "",
      to: "",
      shift: user?.shift?._id || user?.employmentDetails?.shift?._id || "",
      requestedInTime: "",
      requestedOutTime: "",
      reason: "",
      regularizationType: "work_from_home"
    });
  };

  // Add new regularization
  const handleAddRegularization = async (e) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to || !formData.shift || !formData.requestedInTime || !formData.requestedOutTime || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      dispatch(setLoading(true));

      const payload = {
        ...formData,
        employee: user._id,
        user: user.user._id,
        company: company._id
      };

      const res = await apiConnector(
        "POST", 
        createRegularization, 
        payload,
        { Authorization: `Bearer ${token}` }
      );

      toast.success("Regularization request submitted successfully!");
      setIsAddModalOpen(false);
      resetForm();
      fetchRegularizations(currentPage, itemsPerPage);
    } catch (error) {
      console.log("Error adding regularization:", error);
      toast.error(error.response?.data?.message || "Failed to submit regularization request");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update regularization
  const handleUpdateRegularization = async (e) => {
    e.preventDefault();
    
    if (!selectedRegularization) return;

    try {
      dispatch(setLoading(true));
      const payload = {
        ...formData,
        employee: user._id,
        company: company._id
      };

      const res = await apiConnector(
        "PUT", 
        `${updateRegularization}${selectedRegularization._id}`, 
        payload,
        { Authorization: `Bearer ${token}` }
      );

      toast.success("Regularization request updated successfully!");
      setIsEditModalOpen(false);
      setSelectedRegularization(null);
      resetForm();
      fetchRegularizations(currentPage, itemsPerPage);
    } catch (error) {
      console.log("Error updating regularization:", error);
      toast.error(error.response?.data?.message || "Failed to update regularization request");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Delete regularization
  const handleDeleteRegularization = async (regularizationId) => {
    if (!window.confirm("Are you sure you want to delete this regularization request?")) {
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const res = await apiConnector(
        "DELETE", 
        `${deleteRegularization}${regularizationId}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      toast.success("Regularization request deleted successfully!");
      fetchRegularizations(currentPage, itemsPerPage);
    } catch (error) {
      console.log("Error deleting regularization:", error);
      toast.error(error.response?.data?.message || "Failed to delete regularization request");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Open edit modal with selected regularization data
  const openEditModal = (regularization) => {
    setSelectedRegularization(regularization);
    
    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toISOString().split('T')[0];
    };

    setFormData({
      from: formatDate(regularization.from),
      to: formatDate(regularization.to),
      shift: regularization.shift?._id || user?.shift?._id || user?.employmentDetails?.shift?._id || "",
      requestedInTime: regularization.requestedInTime || "",
      requestedOutTime: regularization.requestedOutTime || "",
      reason: regularization.reason || "",
      regularizationType: regularization.regularizationType || "work_from_home"
    });
    
    setIsEditModalOpen(true);
  };

  // Open view modal for all regularizations
  const openViewModal = (regularization) => {
    setSelectedRegularization(regularization);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <EmployeeHeader />

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="px-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Attendance Regularization</h1>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  + Add Regularization
                </button>
              </div>

              {/* Items per page selector and count display */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-700">entries</span>
                </div>
                
                <div className="text-sm text-gray-700">
                  Total: <span className="font-medium">{totalCount}</span> entries
                </div>
              </div>

              {/* Regularizations Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sr. No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shift
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested Timing
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {regularizations.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-lg font-medium">No regularization requests found</p>
                              <p className="text-sm">Create your first regularization request.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        regularizations?.map((regularization, index) => (
                          <tr key={regularization._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-xs">
                                <div>From: {formatDate(regularization.from)}</div>
                                <div>To: {formatDate(regularization.to)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {regularization.shift?.name || user?.shift?.name || user?.employmentDetails?.shift?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-xs">
                                <div>In: {formatTime(regularization.requestedInTime)}</div>
                                <div>Out: {formatTime(regularization.requestedOutTime)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {regularization.regularizationType?.replace('_', ' ') || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(regularization.status)}`}>
                                  {regularization.status?.charAt(0).toUpperCase() + regularization.status?.slice(1)}
                                </span>
                                {regularization.status === 'rejected' && regularization.reviewComments && (
                                  <span className="text-xs text-red-600 mt-1 cursor-pointer" title={regularization.reviewComments}>
                                    <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.548-.372l-3.452 3.452A1 1 0 015 22H1a1 1 0 01-1-1v-4a1 1 0 01.293-.707l3.452-3.452A8.955 8.955 0 011 12C1 7.582 4.582 4 9 4s8 3.582 8 8z" />
                                    </svg>
                                    Has comments
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openViewModal(regularization)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded transition-colors"
                              >
                                View
                              </button>
                              
                              {regularization.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openEditModal(regularization)}
                                    className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded transition-colors"
                                  >
                                    Update
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRegularization(regularization._id)}
                                    className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    {/* Mobile pagination */}
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    
                    {/* Desktop pagination */}
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                          <span className="font-medium">{totalCount}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          {/* Previous button */}
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Previous</span>
                          </button>
                          
                          {/* Page numbers */}
                          {getPaginationButtons()}
                          
                          {/* Next button */}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Next</span>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced View Modal for ALL Regularizations */}
            {isViewModalOpen && selectedRegularization && (
              <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Regularization Details</h2>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <p className="text-gray-900">{formatDate(selectedRegularization.from)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <p className="text-gray-900">{formatDate(selectedRegularization.to)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                        <p className="text-gray-900">{selectedRegularization.shift?.name || user?.shift?.name || user?.employmentDetails?.shift?.name || "N/A"}</p>
                        {(selectedRegularization.shift || user?.shift || user?.employmentDetails?.shift) && (
                          <p className="text-sm text-gray-600">
                            ({(selectedRegularization.shift?.startTime || user?.shift?.startTime || user?.employmentDetails?.shift?.startTime)} - {(selectedRegularization.shift?.endTime || user?.shift?.endTime || user?.employmentDetails?.shift?.endTime)})
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Regularization Type</label>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {selectedRegularization.regularizationType?.replace('_', ' ') || "N/A"}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${getStatusColor(selectedRegularization.status)}`}>
                          {selectedRegularization.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                        <p className="text-gray-900">{selectedRegularization.totalHours || 0} hours</p>
                      </div>
                    </div>

                    {/* Created By Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Request Information</h3>
                      
                      {/* Created By Details */}
                      {selectedRegularization.createdBy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-blue-900 font-medium">
                              {selectedRegularization.createdBy.profile?.firstName} {selectedRegularization.createdBy.profile?.lastName}
                            </p>
                            <p className="text-sm text-blue-700">
                              {selectedRegularization.createdBy.email}
                            </p>
                            {selectedRegularization.createdBy.profile?.designation && (
                              <p className="text-xs text-blue-600">
                                {selectedRegularization.createdBy.profile.designation} - {selectedRegularization.createdBy.profile?.department}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                        <p className="text-gray-900">{formatDate(selectedRegularization.createdAt)}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(selectedRegularization.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-gray-900">{formatDate(selectedRegularization.updatedAt)}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(selectedRegularization.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Employee Information */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                        <div className="bg-gray-50 border rounded p-3">
                          <p className="text-gray-900 font-medium">
                            {selectedRegularization.employee?.personalDetails?.firstName || selectedRegularization.user?.profile?.firstName} {selectedRegularization.employee?.personalDetails?.lastName || selectedRegularization.user?.profile?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {selectedRegularization.employee?.employmentDetails?.employeeId || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedRegularization.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timing Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Requested Timing</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested In Time</label>
                        <p className="text-gray-900 font-medium text-lg">{formatTime(selectedRegularization.requestedInTime)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested Out Time</label>
                        <p className="text-gray-900 font-medium text-lg">{formatTime(selectedRegularization.requestedOutTime)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Actual Timing</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual In Time</label>
                        <p className="text-gray-900 text-lg">{formatTime(selectedRegularization.actualInTime)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Out Time</label>
                        <p className="text-gray-900 text-lg">{formatTime(selectedRegularization.actualOutTime)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Regularization</label>
                      <div className="bg-gray-50 border rounded p-3">
                        <p className="text-gray-900">{selectedRegularization.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Information (only for approved/rejected) */}
                  {selectedRegularization.status !== 'pending' && (selectedRegularization.reviewDate || selectedRegularization.reviewComments) && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Review Information</h3>
                      {selectedRegularization.reviewDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {selectedRegularization.status === 'rejected' ? 'Rejection Date' : 'Approval Date'}
                          </label>
                          <p className="text-gray-900">{formatDate(selectedRegularization.reviewDate)}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(selectedRegularization.reviewDate).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {selectedRegularization.reviewedBy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {selectedRegularization.status === 'rejected' ? 'Rejected By' : 'Approved By'}
                          </label>
                          <p className="text-gray-900">
                            {selectedRegularization.reviewedBy.firstName} {selectedRegularization.reviewedBy.lastName}
                          </p>
                        </div>
                      )}
                      {selectedRegularization.reviewComments && (
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            selectedRegularization.status === 'rejected' ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {selectedRegularization.status === 'rejected' ? 'Rejection Reason' : 'Approval Comments'}
                          </label>
                          <div className={`border rounded p-3 ${
                            selectedRegularization.status === 'rejected' 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-green-50 border-green-200'
                          }`}>
                            <p className={`${
                              selectedRegularization.status === 'rejected' ? 'text-red-800' : 'text-green-800'
                            } font-medium`}>
                              {selectedRegularization.reviewComments}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Status Information */}
                  {selectedRegularization.status === 'pending' && (
                    <div className="mb-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <div className="flex items-start">
                          <svg className="flex-shrink-0 h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Pending Approval
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              This regularization request is awaiting approval from HR/Admin. You can still edit or delete this request if needed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Supporting Documents (if any) */}
                  {selectedRegularization.supportingDocuments && selectedRegularization.supportingDocuments.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Supporting Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedRegularization.supportingDocuments.map((doc, index) => (
                          <div key={index} className="border rounded p-3 bg-gray-50">
                            <p className="text-sm font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                            <p className="text-xs text-gray-600">Uploaded: {formatDate(doc.uploadedAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Close Button with conditional edit actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Close
                    </button>
                    
                    {/* Edit/Delete actions in view modal for pending requests */}
                    {selectedRegularization.status === 'pending' && (
                      <div className="space-x-3">
                        <button
                          onClick={() => {
                            setIsViewModalOpen(false);
                            openEditModal(selectedRegularization);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit Request
                        </button>
                        <button
                          onClick={() => {
                            setIsViewModalOpen(false);
                            handleDeleteRegularization(selectedRegularization._id);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add Regularization Modal */}
            {isAddModalOpen && (
              <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Regularization Request</h2>
                  
                  <form onSubmit={handleAddRegularization}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="from"
                          value={formData.from}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="to"
                          value={formData.to}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shift <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="shift"
                          value={formData.shift}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Shift</option>
                          {/* Show employee's default shift first if available */}
                          {(user?.shift || user?.employmentDetails?.shift) && (
                            <option key={(user.shift || user.employmentDetails?.shift)?._id} value={(user.shift || user.employmentDetails?.shift)?._id}>
                              {(user.shift || user.employmentDetails?.shift)?.name} ({(user.shift || user.employmentDetails?.shift)?.startTime} - {(user.shift || user.employmentDetails?.shift)?.endTime}) [Default]
                            </option>
                          )}
                        
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requested In Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          name="requestedInTime"
                          value={formData.requestedInTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requested Out Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          name="requestedOutTime"
                          value={formData.requestedOutTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Regularization Type
                        </label>
                        <select
                          name="regularizationType"
                          value={formData.regularizationType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="work_from_home">Work From Home</option>
                          <option value="outdoor">Outdoor</option>
                          <option value="missing_punch">Missing Punch</option>
                          <option value="short_leave">Short Leave</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please provide a detailed reason for this regularization request..."
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          resetForm();
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : "Add Regularization"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Regularization Modal */}
            {isEditModalOpen && selectedRegularization && (
              <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Update Regularization Request</h2>
                  
                  <form onSubmit={handleUpdateRegularization}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="from"
                          value={formData.from}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="to"
                          value={formData.to}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shift <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="shift"
                          value={formData.shift}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Shift</option>
                          {(user?.shift || user?.employmentDetails?.shift) && (
                            <option key={(user.shift || user.employmentDetails?.shift)?._id} value={(user.shift || user.employmentDetails?.shift)?._id}>
                              {(user.shift || user.employmentDetails?.shift)?.name} ({(user.shift || user.employmentDetails?.shift)?.startTime} - {(user.shift || user.employmentDetails?.shift)?.endTime}) [Default]
                            </option>
                          )}
                         
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requested In Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          name="requestedInTime"
                          value={formData.requestedInTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requested Out Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          name="requestedOutTime"
                          value={formData.requestedOutTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Regularization Type
                        </label>
                        <select
                          name="regularizationType"
                          value={formData.regularizationType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="work_from_home">Work From Home</option>
                          <option value="outdoor">Outdoor</option>
                          <option value="missing_punch">Missing Punch</option>
                          <option value="short_leave">Short Leave</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Please provide a detailed reason for this regularization request..."
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditModalOpen(false);
                          setSelectedRegularization(null);
                          resetForm();
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Update Regularization"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeRegularisation;
