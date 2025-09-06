import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { regularizationEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { 
  getRegularizations,
  updateRegularization,
  bulkUpdateRegularizations,
} = regularizationEndpoints;

const RegularizationApproval = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

  const [selectedStatus, setSelectedStatus] = useState("");
  const [regularizations, setRegularizations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRegularization, setSelectedRegularization] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [approvalForm, setApprovalForm] = useState({
    reviewComments: ""
  });
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'

  // Fetch regularizations with pagination
  const fetchRegularizations = async (page = 1, status = selectedStatus, limit = itemsPerPage) => {
    try {
      dispatch(setLoading(true));
      const queryParams = new URLSearchParams({
        companyId: company?._id,
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) {
        queryParams.append('status', status);
      }

      const res = await apiConnector(
        "GET", 
        `${getRegularizations}?${queryParams.toString()}`, 
        null,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      setRegularizations(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
      setCurrentPage(page);
      
      // Reset selection when data changes
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      console.log("Error fetching regularizations:", error);
      toast.error("Failed to fetch regularizations");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchRegularizations(page, selectedStatus, itemsPerPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page
    fetchRegularizations(1, selectedStatus, newLimit);
  };

  // Generate pagination buttons
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    // Adjust start page if we're near the end
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

  // Handle individual selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      // Update selectAll state based on selection
      setSelectAll(newSelection.length === regularizations.length);
      return newSelection;
    });
  };

  // Handle select all for current page
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const currentPageIds = regularizations.map(item => item._id);
      setSelectedIds(currentPageIds);
      setSelectAll(true);
    }
  };

  // Handle bulk approval
  const handleBulkAction = async (bulkStatus, comments = "") => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one request");
      return;
    }

    // Validation for bulk reject
    if (bulkStatus === 'rejected' && !comments.trim()) {
      toast.error("Review comments are required for bulk rejection");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        ids: selectedIds,
        status: bulkStatus,
        reviewComments: comments || `Bulk ${bulkStatus} via admin panel`
      };

      const res = await apiConnector(
        "PATCH", 
        bulkUpdateRegularizations, 
        payload,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      toast.success(`${selectedIds.length} regularizations ${bulkStatus} successfully!`);
      setSelectedIds([]);
      setSelectAll(false);
      setIsBulkModalOpen(false);
      setApprovalForm({ reviewComments: "" });
      fetchRegularizations(currentPage, selectedStatus, itemsPerPage);
    } catch (error) {
      console.log("Error bulk updating regularizations:", error);
      toast.error(error.response?.data?.message || `Failed to bulk ${bulkStatus} regularizations`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle individual approval/rejection
  const handleApprovalAction = async () => {
    if (!selectedRegularization) return;

    if (actionType === 'reject' && !approvalForm.reviewComments.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const requestData = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        reviewComments: approvalForm.reviewComments
      };

      const res = await apiConnector(
        "PUT", 
        `${updateRegularization}${selectedRegularization._id}`, 
        requestData,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      toast.success(`Regularization ${actionType}d successfully!`);
      setIsApprovalModalOpen(false);
      setSelectedRegularization(null);
      setApprovalForm({ reviewComments: "" });
      fetchRegularizations(currentPage, selectedStatus, itemsPerPage);
    } catch (error) {
      console.log("Error processing regularization:", error);
      toast.error(error.response?.data?.message || `Failed to ${actionType} regularization`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const openApprovalModal = (regularization, action) => {
    setSelectedRegularization(regularization);
    setActionType(action);
    setApprovalForm({
      reviewComments: ""
    });
    setIsApprovalModalOpen(true);
  };

  const openBulkModal = (action) => {
    setActionType(action);
    setApprovalForm({
      reviewComments: ""
    });
    setIsBulkModalOpen(true);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApprovalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (company?._id) {
      fetchRegularizations(1, selectedStatus, itemsPerPage);
    }
  }, [company, selectedStatus]);

  return (
    <div className="flex">
      {
        (role === 'superadmin')
          ? (subAdminPermissions !== null ? <SubAdminSidebar /> : <AdminSidebar />)
          : (role === 'admin' ? <AdminSidebar /> : <SubAdminSidebar />)
      }

      
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        {
        (role === 'superadmin')
          ? (subAdminPermissions !== null ? <SubAdminHeader /> : <AdminHeader />)
          : (role === 'admin' ? <AdminHeader/> : <SubAdminHeader />)
      }


        <div className="px-6 mt-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Regularization Management</h1>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {["All", "Pending", "Approved", "Rejected", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status === "All" ? "" : status.toLowerCase())}
                className={`px-4 py-2 rounded border ${
                  selectedStatus === (status === "All" ? "" : status.toLowerCase())
                    ? "bg-blue-900 text-white"
                    : "bg-white text-blue-900 border-blue-900"
                } hover:opacity-90 transition`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Items per page selector */}
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

          {/* Bulk Action Buttons */}
          {selectedIds.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-800 font-medium">
                  {selectedIds.length} regularization{selectedIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openBulkModal('approve')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => openBulkModal('reject')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedIds([]);
                    setSelectAll(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-[70vh]">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Regularizations Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sr. No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
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
                          <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-lg font-medium">No regularizations found</p>
                              <p className="text-sm">No regularization requests match your current filters.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        regularizations.map((regularization, index) => (
                          <tr key={regularization._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(regularization._id)}
                                onChange={() => toggleSelection(regularization._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">
                                  {regularization.employee?.personalDetails?.firstName} {regularization.employee?.personalDetails?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {regularization.employee?.employmentDetails?.employeeId || "N/A"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {regularization.user?.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-xs">
                                <div>From: {formatDate(regularization.from)}</div>
                                <div>To: {formatDate(regularization.to)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-xs">
                                <div className="font-medium">{regularization.shift?.name || "N/A"}</div>
                                <div className="text-gray-500">
                                  {regularization.shift?.startTime} - {regularization.shift?.endTime}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-xs">
                                <div>In: {formatTime(regularization.requestedInTime)}</div>
                                <div>Out: {formatTime(regularization.requestedOutTime)}</div>
                                <div className="text-gray-500">
                                  {regularization.totalHours || 0}h total
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {regularization.regularizationType?.replace('_', ' ') || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(regularization.status)}`}>
                                {regularization.status?.charAt(0).toUpperCase() + regularization.status?.slice(1)}
                              </span>
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
                                    onClick={() => openApprovalModal(regularization, 'approve')}
                                    className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openApprovalModal(regularization, 'reject')}
                                    className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
                                  >
                                    Reject
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
            </>
          )}
        </div>

        {/* View Modal */}
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
                {/* Employee Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Employee Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <p className="text-gray-900">{selectedRegularization.employee?.employmentDetails?.employeeId || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">
                      {selectedRegularization.employee?.personalDetails?.firstName} {selectedRegularization.employee?.personalDetails?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedRegularization.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${getStatusColor(selectedRegularization.status)}`}>
                      {selectedRegularization.status}
                    </span>
                  </div>
                </div>

                {/* Regularization Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Regularization Details</h3>
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
                    <p className="text-gray-900">{selectedRegularization.shift?.name || "N/A"}</p>
                    <p className="text-sm text-gray-600">
                      ({selectedRegularization.shift?.startTime} - {selectedRegularization.shift?.endTime})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {selectedRegularization.regularizationType?.replace('_', ' ') || "N/A"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
                    <p className="text-gray-900">{selectedRegularization.totalHours || 0} hours</p>
                  </div>
                </div>
              </div>

              {/* Timing and Review Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Requested Timing</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">In Time</label>
                    <p className="text-gray-900 font-medium text-lg">{formatTime(selectedRegularization.requestedInTime)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Out Time</label>
                    <p className="text-gray-900 font-medium text-lg">{formatTime(selectedRegularization.requestedOutTime)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Review Information</h3>
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
                      </div>
                    </div>
                  )}
                  
                  {selectedRegularization.reviewComments && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review Comments</label>
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

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                {selectedRegularization.status === 'pending' && (
                  <div className="space-x-3">
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openApprovalModal(selectedRegularization, 'approve');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openApprovalModal(selectedRegularization, 'reject');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Individual Approval Modal */}
        {isApprovalModalOpen && selectedRegularization && (
          <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Regularization
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold text-gray-800">
                  Employee: {selectedRegularization.employee?.personalDetails?.firstName} {selectedRegularization.employee?.personalDetails?.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  Period: {formatDate(selectedRegularization.from)} - {formatDate(selectedRegularization.to)}
                </p>
                <p className="text-sm text-gray-600">
                  Timing: {formatTime(selectedRegularization.requestedInTime)} - {formatTime(selectedRegularization.requestedOutTime)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {actionType === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason'} 
                    {actionType === 'reject' && <span className="text-red-500"> *</span>}
                  </label>
                  <textarea
                    name="reviewComments"
                    value={approvalForm.reviewComments}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter your ${actionType === 'approve' ? 'approval comments' : 'rejection reason'}...`}
                    required={actionType === 'reject'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsApprovalModalOpen(false);
                    setApprovalForm({ reviewComments: "" });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalAction}
                  disabled={loading || (actionType === 'reject' && !approvalForm.reviewComments.trim())}
                  className={`px-6 py-2 rounded transition-colors disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading ? "Processing..." : `${actionType === 'approve' ? 'Approve' : 'Reject'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Modal */}
        {isBulkModalOpen && (
          <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Bulk {actionType === 'approve' ? 'Approve' : 'Reject'} Regularizations
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="font-semibold text-gray-800">
                  You are about to {actionType} {selectedIds.length} regularization{selectedIds.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. Please confirm your decision.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {actionType === 'approve' ? 'Bulk Approval Comments (Optional)' : 'Bulk Rejection Reason'} 
                    {actionType === 'reject' && <span className="text-red-500"> *</span>}
                  </label>
                  <textarea
                    name="reviewComments"
                    value={approvalForm.reviewComments}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${actionType === 'approve' ? 'approval comments' : 'rejection reason'} for all selected regularizations...`}
                    required={actionType === 'reject'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setApprovalForm({ reviewComments: "" });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBulkAction(actionType === 'approve' ? 'approved' : 'rejected', approvalForm.reviewComments)}
                  disabled={loading || (actionType === 'reject' && !approvalForm.reviewComments.trim())}
                  className={`px-6 py-2 rounded transition-colors disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading ? "Processing..." : `Bulk ${actionType === 'approve' ? 'Approve' : 'Reject'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegularizationApproval;
