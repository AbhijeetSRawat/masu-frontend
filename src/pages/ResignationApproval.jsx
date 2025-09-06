import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { resignationEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { GET_RESIGNATION, APPROVE_RESIGNATION, REJECT_RESIGNATION, BULK_UPDATE } = resignationEndpoints;

const ResignationApproval = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

  const [selectedStatus, setSelectedStatus] = useState("");
  const [resignations, setResignations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  const [approvalForm, setApprovalForm] = useState({
    actualLastWorkingDate: "",
    notes: "",
    rejectionReason: ""
  });
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'

  // Fetch resignations with pagination
  const fetchResignations = async (page = 1, status = selectedStatus, limit = itemsPerPage) => {
    try {
      dispatch(setLoading(true));
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        companyId: company?._id
      });

      if (status) {
        queryParams.append('status', status);
      }

      const res = await apiConnector(
        "GET", 
        `${GET_RESIGNATION}?${queryParams.toString()}`, 
        null,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      setResignations(res.data.resignations);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.total);
      setCurrentPage(page);
      
      // Reset selection when data changes
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      console.log("Error fetching resignations:", error);
      toast.error("Failed to fetch resignations");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchResignations(page, selectedStatus, itemsPerPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchResignations(1, selectedStatus, newLimit);
  };

  // Handle individual selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      // Update selectAll state based on selection
      setSelectAll(newSelection.length === resignations.length);
      return newSelection;
    });
  };

  // Handle select all for current page
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const currentPageIds = resignations.map(item => item._id);
      setSelectedIds(currentPageIds);
      setSelectAll(true);
    }
  };

  // Handle bulk action
  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one resignation");
      return;
    }

    // Validation for bulk reject
    if (actionType === 'reject' && !approvalForm.rejectionReason.trim()) {
      toast.error("Rejection reason is required for bulk rejection");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        ids: selectedIds,
        action: actionType,
        ...(actionType === 'approve' ? {
          actualLastWorkingDate: approvalForm.actualLastWorkingDate,
          notes: approvalForm.notes
        } : {
          rejectionReason: approvalForm.rejectionReason
        })
      };

      const res = await apiConnector(
        "PATCH", 
        BULK_UPDATE, 
        payload,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      toast.success(`${selectedIds.length} resignations ${actionType}d successfully!`);
      setSelectedIds([]);
      setSelectAll(false);
      setIsBulkModalOpen(false);
      setApprovalForm({ actualLastWorkingDate: "", notes: "", rejectionReason: "" });
      fetchResignations(currentPage, selectedStatus, itemsPerPage);
    } catch (error) {
      console.log("Error bulk updating resignations:", error);
      toast.error(error.response?.data?.message || `Failed to bulk ${actionType} resignations`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle individual approval/rejection
  const handleApprovalAction = async () => {
    if (!selectedResignation) return;

    // Validation for reject action
    if (actionType === 'reject' && !approvalForm.notes.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      let endpoint, requestData;
      
      if (actionType === 'approve') {
        endpoint = APPROVE_RESIGNATION;
        requestData = {
          resignationId: selectedResignation._id,
          actualLastWorkingDate: approvalForm.actualLastWorkingDate || selectedResignation.proposedLastWorkingDate,
          notes: approvalForm.notes
        };
      } else {
        endpoint = REJECT_RESIGNATION;
        requestData = {
          resignationId: selectedResignation._id,
          rejectionReason: approvalForm.notes
        };
      }

      const res = await apiConnector(
        "PATCH", 
        endpoint, 
        requestData,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      toast.success(`Resignation ${actionType}d successfully!`);
      setIsApprovalModalOpen(false);
      setSelectedResignation(null);
      setApprovalForm({ actualLastWorkingDate: "", notes: "", rejectionReason: "" });
      fetchResignations(currentPage, selectedStatus, itemsPerPage);
    } catch (error) {
      console.log("Error processing resignation:", error);
      toast.error(error.response?.data?.message || `Failed to ${actionType} resignation`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle quick action (approve/reject without modal)
  const handleQuickAction = async (resignation, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this resignation?`)) {
      return;
    }

    // For rejection, require reason
    if (action === 'reject') {
      const reason = prompt("Please enter the rejection reason:");
      if (!reason || !reason.trim()) {
        toast.error("Rejection reason is required");
        return;
      }
      
      try {
        dispatch(setLoading(true));
        
        const requestData = {
          resignationId: resignation._id,
          rejectionReason: reason.trim()
        };

        const res = await apiConnector(
          "PATCH", 
          REJECT_RESIGNATION, 
          requestData,
          {
            "Authorization": `Bearer ${token}`
          }
        );

        toast.success("Resignation rejected successfully!");
        fetchResignations(currentPage, selectedStatus, itemsPerPage);
      } catch (error) {
        console.log("Error rejecting resignation:", error);
        toast.error(error.response?.data?.message || "Failed to reject resignation");
      } finally {
        dispatch(setLoading(false));
      }
      return;
    }

    // Handle approval
    try {
      dispatch(setLoading(true));
      
      const requestData = {
        resignationId: resignation._id,
        actualLastWorkingDate: resignation.proposedLastWorkingDate
      };

      const res = await apiConnector(
        "PATCH", 
        APPROVE_RESIGNATION, 
        requestData,
        {
          "Authorization": `Bearer ${token}`
        }
      );

      toast.success("Resignation approved successfully!");
      fetchResignations(currentPage, selectedStatus, itemsPerPage);
    } catch (error) {
      console.log("Error approving resignation:", error);
      toast.error(error.response?.data?.message || "Failed to approve resignation");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const openApprovalModal = (resignation, action) => {
    setSelectedResignation(resignation);
    setActionType(action);
    setApprovalForm({
      actualLastWorkingDate: resignation.proposedLastWorkingDate?.split('T')[0] || "",
      notes: "",
      rejectionReason: ""
    });
    setIsApprovalModalOpen(true);
  };

  const openBulkModal = (action) => {
    setActionType(action);
    setApprovalForm({
      actualLastWorkingDate: "",
      notes: "",
      rejectionReason: ""
    });
    setIsBulkModalOpen(true);
  };

  const openViewModal = (resignation) => {
    setSelectedResignation(resignation);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApprovalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (company?._id) {
      fetchResignations(1, selectedStatus, itemsPerPage);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Resignation Management</h1>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {["All", "Pending", "Approved", "Rejected", "Withdrawn", "Completed"].map((status) => (
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
                  {selectedIds.length} resignation{selectedIds.length > 1 ? 's' : ''} selected
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
              {/* Resignations Table */}
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
                          Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Working Date
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
                      {resignations.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-lg font-medium">No resignations found</p>
                              <p className="text-sm">No resignation applications match your current filters.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        resignations.map((resignation, index) => (
                          <tr key={resignation._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(resignation._id)}
                                onChange={() => toggleSelection(resignation._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {resignation.employee?.employmentDetails?.employeeId || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {resignation.user?.profile?.firstName && resignation.user?.profile?.lastName
                                ? `${resignation.user.profile.firstName} ${resignation.user.profile.lastName}`
                                : resignation.user?.email || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(resignation.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(resignation.actualLastWorkingDate || resignation.proposedLastWorkingDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(resignation.status)}`}>
                                {resignation.status.charAt(0).toUpperCase() + resignation.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openViewModal(resignation)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded transition-colors"
                              >
                                View
                              </button>
                              {resignation.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openApprovalModal(resignation, 'approve')}
                                    className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleQuickAction(resignation, 'reject')}
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
                            Previous
                          </button>
                          
                          {/* Page numbers (simplified for display) */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + Math.max(1, currentPage - 2);
                            if (page > totalPages) return null;
                            
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          
                          {/* Next button */}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
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
        {isViewModalOpen && selectedResignation && (
          <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Resignation Details</h2>
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
                    <p className="text-gray-900">{selectedResignation.employee?.employmentDetails?.employeeId || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">
                      {selectedResignation.user?.profile?.firstName && selectedResignation.user?.profile?.lastName
                        ? `${selectedResignation.user.profile.firstName} ${selectedResignation.user.profile.lastName}`
                        : selectedResignation.user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedResignation.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${getStatusColor(selectedResignation.status)}`}>
                      {selectedResignation.status}
                    </span>
                  </div>
                </div>

                {/* Resignation Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Resignation Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
                    <p className="text-gray-900">{formatDate(selectedResignation.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resignation Date</label>
                    <p className="text-gray-900">{formatDate(selectedResignation.resignationDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Last Working Date</label>
                    <p className="text-gray-900">{formatDate(selectedResignation.proposedLastWorkingDate)}</p>
                  </div>
                  {selectedResignation.actualLastWorkingDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Last Working Date</label>
                      <p className="text-gray-900">{formatDate(selectedResignation.actualLastWorkingDate)}</p>
                    </div>
                  )}
                  {selectedResignation.approvalDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedResignation.status === 'rejected' ? 'Rejection Date' : 'Approval Date'}
                      </label>
                      <p className="text-gray-900">{formatDate(selectedResignation.approvalDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason and Feedback */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Resignation</label>
                  <div className="bg-gray-50 border rounded p-3">
                    <p className="text-gray-900">{selectedResignation.reason}</p>
                  </div>
                </div>
                {selectedResignation.feedback && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Feedback</label>
                    <div className="bg-gray-50 border rounded p-3">
                      <p className="text-gray-900">{selectedResignation.feedback}</p>
                    </div>
                  </div>
                )}
                {selectedResignation.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Rejection Reason</label>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-red-800 font-medium">{selectedResignation.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                {selectedResignation.status === 'pending' && (
                  <div className="space-x-3">
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openApprovalModal(selectedResignation, 'approve');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        openApprovalModal(selectedResignation, 'reject');
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
        {isApprovalModalOpen && selectedResignation && (
          <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Resignation
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold text-gray-800">
                  Employee: {selectedResignation.user?.profile?.firstName} {selectedResignation.user?.profile?.lastName} ({selectedResignation.user?.email})
                </h3>
                <p className="text-sm text-gray-600">
                  Proposed Last Working Date: {formatDate(selectedResignation.proposedLastWorkingDate)}
                </p>
              </div>

              <div className="space-y-4">
                {actionType === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Last Working Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="actualLastWorkingDate"
                      value={approvalForm.actualLastWorkingDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use the proposed date
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'} 
                    {actionType === 'reject' && <span className="text-red-500"> *</span>}
                  </label>
                  <textarea
                    name="notes"
                    value={approvalForm.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter your ${actionType === 'approve' ? 'approval notes' : 'rejection reason'}...`}
                    required={actionType === 'reject'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsApprovalModalOpen(false);
                    setApprovalForm({ actualLastWorkingDate: "", notes: "", rejectionReason: "" });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalAction}
                  disabled={loading || (actionType === 'reject' && !approvalForm.notes.trim())}
                  className={`px-6 py-2 rounded transition-colors disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading ? "Processing..." : `${actionType === 'approve' ? 'Approve' : 'Reject'} Resignation`}
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
                Bulk {actionType === 'approve' ? 'Approve' : 'Reject'} Resignations
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="font-semibold text-gray-800">
                  You are about to {actionType} {selectedIds.length} resignation{selectedIds.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. Please confirm your decision.
                </p>
              </div>

              <div className="space-y-4">
                {actionType === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Last Working Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="actualLastWorkingDate"
                      value={approvalForm.actualLastWorkingDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use each resignation's proposed date
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {actionType === 'approve' ? 'Bulk Approval Notes (Optional)' : 'Bulk Rejection Reason'} 
                    {actionType === 'reject' && <span className="text-red-500"> *</span>}
                  </label>
                  <textarea
                    name={actionType === 'approve' ? 'notes' : 'rejectionReason'}
                    value={actionType === 'approve' ? approvalForm.notes : approvalForm.rejectionReason}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${actionType === 'approve' ? 'approval notes' : 'rejection reason'} for all selected resignations...`}
                    required={actionType === 'reject'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setApprovalForm({ actualLastWorkingDate: "", notes: "", rejectionReason: "" });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={loading || (actionType === 'reject' && !approvalForm.rejectionReason.trim())}
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

export default ResignationApproval;
