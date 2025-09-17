import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { regularizationEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const {
  getPendingRegularizationsForManager,
  getPendingRegularizationsForHr,
  getPendingRegularizationsForAdmin,
  managerApproveRegularization,
  hrApproveRegularization,
  adminApproveRegularization,
  rejectRegularization,
  bulkUpdateRegularizations,
} = regularizationEndpoints;

const RegularizationApproval = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const role = useSelector((state) => state.auth.role);
  const subAdminPermissions = useSelector(
    (state) => state.permissions.subAdminPermissions
  );
  const employee = useSelector((state) => state.employees.reduxEmployee);

  const [allRegularizations, setAllRegularizations] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkComment, setBulkComment] = useState("");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRegularization, setSelectedRegularization] = useState(null);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [singleRejectReason, setSingleRejectReason] = useState("");

  // Role/level helpers
  const getRoleLevel = () => {
    if (role === "hr") return "hr";
    if (role === "manager") return "manager";
    if (role === "admin" || role === "superadmin") return "admin";
    return null;
  };

  // Get the appropriate approval endpoint based on user role
  const getApprovalEndpoint = (regularizationId) => {
    if (role === "hr") {
      return hrApproveRegularization + regularizationId + "/approve/hr";
    } else if (role === "manager") {
      return managerApproveRegularization + regularizationId + "/approve/manager";
    } else if (role === "admin" || role === "superadmin") {
      return adminApproveRegularization + regularizationId + "/approve/admin";
    }
    return null;
  };

  // Get rejection endpoint (same for all roles, but with level parameter)
  const getRejectionEndpoint = (regularizationId) => {
    return rejectRegularization + regularizationId + "/reject";
  };

  // Helper function to check if current user has already approved this regularization
  const hasCurrentUserApproved = (regularization) => {
    const currentLevel = getRoleLevel();
    if (!currentLevel || !regularization?.approvalFlow) return false;
    
    return regularization.approvalFlow[currentLevel]?.status === "approved";
  };

  // Only show Approve/Reject if status and currentApprovalLevel match this user's role
  const canCurrentUserActOnRegularization = (r) => {
    // If regularization is not pending, no actions allowed
    if (r.status !== "pending") return false;
    
    // If current user has already approved, no actions allowed
    if (hasCurrentUserApproved(r)) return false;
    
    // Check if it's the current user's turn to approve
    const currentLevel = getRoleLevel();
    if (!currentLevel) return false;
    
    // Check if this regularization is at the current user's approval level
    return r.currentApprovalLevel === currentLevel;
  };

  // Get display status based on role and regularization state
  const getDisplayStatus = (regularization) => {
    const currentLevel = getRoleLevel();
    
    // If it's rejected, always show as rejected
    if (regularization.status === "rejected") {
      return "rejected";
    }
    
    // If overall status is approved, show as approved
    if (regularization.status === "approved") {
      return "approved";
    }
    
    // For pending regularizations, check if current user's level has approved
    if (regularization.status === "pending") {
      // If current user has approved at their level, show as approved for them
      if (hasCurrentUserApproved(regularization)) {
        return "approved";
      }
      // If it's waiting for current user's approval, show as pending
      if (regularization.currentApprovalLevel === currentLevel) {
        return "pending";
      }
      // If it hasn't reached current user's level yet, it's pending for them too
      return "pending";
    }
    
    return regularization.status;
  };

  // ----- Data fetching -----
  const fetchApprovalData = async (status = selectedStatus, page = 1) => {
    try {
      dispatch(setLoading(true));
      let endpoint = "";
      if (role === "manager") {
        endpoint = getPendingRegularizationsForManager + (employee?.employeeId || employee?.id || employee?._id);
      } else if (role === "hr") {
        endpoint = getPendingRegularizationsForHr + (employee?.employeeId || employee?.id || employee?._id);
      } else if (role === "admin" || role === "superadmin") {
        endpoint = getPendingRegularizationsForAdmin + (employee?.employeeId || employee?.id || employee?._id);
      } else {
        toast.error("Role not authorized to fetch regularizations");
        dispatch(setLoading(false));
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        status: status === "all" ? "" : status,
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      const url = `${endpoint}?${queryParams}`;
      
      const res = await apiConnector(
        "GET",
        url,
        null,
        { Authorization: `Bearer ${token}` }
      );

      console.log(res)

      if (res.data.success) {
        setAllRegularizations(res.data.regularizations || []);
        
        // Set pagination info
        setCurrentPage(res.data.page || page);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || res.data.regularizations?.length || 0);

        setSelectedIds([]);
        setSelectAll(false);

        toast.success(`${status.charAt(0).toUpperCase() + status.slice(1)} regularizations fetched successfully!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch regularizations!");
      setAllRegularizations([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (company?._id && token && employee) {
      fetchApprovalData(selectedStatus, 1);
    }
  }, [selectedStatus, company?._id, token, employee]);

  // ----- Filtering based on display status -----
  const filteredRegularizations = useMemo(() => {
    return allRegularizations.filter((item) => {
      const displayStatus = getDisplayStatus(item);
      if (selectedStatus === "all") return true;
      return displayStatus === selectedStatus;
    });
  }, [selectedStatus, allRegularizations, role]);

  const paginatedRegularizations = useMemo(() => {
    if (totalPages > 1) {
      return filteredRegularizations;
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredRegularizations.slice(startIndex, endIndex);
    }
  }, [filteredRegularizations, currentPage, itemsPerPage, totalPages]);

  useEffect(() => {
    if (totalPages <= 1) {
      const newTotalPages = Math.ceil(filteredRegularizations.length / itemsPerPage) || 1;
      setTotalPages(newTotalPages);
      setTotalCount(filteredRegularizations.length);
      if (currentPage > newTotalPages) setCurrentPage(1);
    }
    setSelectedIds([]);
    setSelectAll(false);
  }, [filteredRegularizations, itemsPerPage, currentPage, totalPages]);

  // ----- Bulk selection -----
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const selectableIds = paginatedRegularizations
        .filter(regularization => canCurrentUserActOnRegularization(regularization))
        .map(regularization => regularization._id);
      setSelectedIds(selectableIds);
      setSelectAll(selectableIds.length === paginatedRegularizations.length && selectableIds.length > 0);
    }
  };

  const toggleSelectOne = (id) => {
    const regularization = paginatedRegularizations.find(r => r._id === id);
    if (!canCurrentUserActOnRegularization(regularization)) {
      toast.error("You cannot act on this regularization at the current time");
      return;
    }

    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      const selectableRegularizations = paginatedRegularizations.filter(regularization => canCurrentUserActOnRegularization(regularization));
      setSelectAll(newSelection.length === selectableRegularizations.length && selectableRegularizations.length > 0);
      return newSelection;
    });
  };

  // ----- Bulk actions -----
  const openBulkModal = (action) => {
    const actionableRegularizations = paginatedRegularizations.filter(regularization => canCurrentUserActOnRegularization(regularization));
    const actionableSelectedIds = selectedIds.filter(id => 
      actionableRegularizations.some(regularization => regularization._id === id)
    );

    if (actionableSelectedIds.length === 0) {
      toast.error("Please select at least one regularization that you can act upon");
      return;
    }
    setBulkAction(action);
    setBulkReason("");
    setBulkComment("");
    setIsBulkModalOpen(true);
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one regularization");
      return;
    }

    if (bulkAction === 'reject' && !bulkReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    const level = getRoleLevel();
    if (!level) {
      toast.error("Invalid user role for bulk action");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        ids: selectedIds,
        action: bulkAction,
        level,
        ...(bulkAction === 'reject' && { reason: bulkReason }),
        ...(bulkAction === 'approve' && bulkComment && { comment: bulkComment })
      };

      const result = await apiConnector(
        "PATCH",
        bulkUpdateRegularizations,
        payload,
        { Authorization: `Bearer ${token}` }
      );

      if (result.data.success) {
        toast.success(`${selectedIds.length} regularizations ${bulkAction}d successfully!`);
        setSelectedIds([]);
        setSelectAll(false);
        setIsBulkModalOpen(false);
        setBulkReason("");
        setBulkComment("");
        fetchApprovalData(selectedStatus, currentPage);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || `Failed to ${bulkAction} regularizations`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ----- Per-item actions -----
  const handleView = (regularization) => {
    setSelectedRegularization(regularization);
    setIsViewModalOpen(true);
    setShowRejectionInput(false);
    setSingleRejectReason("");
  };

  const approveRegularization = async (regularizationId) => {
    try {
      dispatch(setLoading(true));
      
      const approvalEndpoint = getApprovalEndpoint(regularizationId);
      if (!approvalEndpoint) {
        toast.error("Approval not allowed for current user role");
        dispatch(setLoading(false));
        return;
      }

      const result = await apiConnector(
        "PATCH",
        approvalEndpoint,
        {},
        { Authorization: `Bearer ${token}` }
      );
      
      if (result.data.success) {
        toast.success("Regularization approved successfully!");
        fetchApprovalData(selectedStatus, currentPage);
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve regularization");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const rejectRegularizationAction = async (regularizationId) => {
    if (!singleRejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    const level = getRoleLevel();
    if (!level) {
      toast.error("Invalid user role for rejection");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const rejectionEndpoint = getRejectionEndpoint(regularizationId);
      const result = await apiConnector(
        "PATCH",
        rejectionEndpoint,
        {
          reason: singleRejectReason,
          level
        },
        { Authorization: `Bearer ${token}` }
      );

      if (result.data.success) {
        toast.success("Regularization rejected successfully!");
        fetchApprovalData(selectedStatus, currentPage);
        setIsViewModalOpen(false);
        setShowRejectionInput(false);
        setSingleRejectReason("");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject regularization");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchApprovalData(selectedStatus, newPage);
    }
  };

  // ----- Status helper -----
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "approved":
        return "text-green-700";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-500";
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
      {
        role === 'superadmin' 
          ? (subAdminPermissions !== null ? <SubAdminSidebar /> : <AdminSidebar />)
          : role === 'admin' 
            ? <AdminSidebar /> 
            : role === 'manager'
              ? <ManagerSidebar />
              : role === 'hr'
                ? <HRSidebar />
                : <SubAdminSidebar />
      }

      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        {
          (role === 'superadmin')
            ? (subAdminPermissions !== null ? <SubAdminHeader /> : <AdminHeader />)
            : role === 'admin' ? <AdminHeader/> :
              role === 'manager' ? <ManagerHeader/>:
              role === 'hr'?<HRHeader/>:
               <SubAdminHeader />
        }

        {loading ? (
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="px-6 mt-4">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Regularization Approval
              </h1>

              {/* Status Filter Buttons */}
              <div className="flex gap-3 mb-4">
                {["pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilterChange(status)}
                    className={`px-4 py-2 rounded font-semibold capitalize ${
                      selectedStatus === status
                        ? "bg-blue-900 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Bulk Actions Bar - Only show for actionable regularizations */}
              {selectedIds.length > 0 && selectedStatus === 'pending' && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border text-sm text-left">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="w-12 px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="w-12 px-4 py-2">Sr.</th>
                      <th className="w-32 px-4 py-2">Employee</th>
                      <th className="w-24 px-4 py-2">Period</th>
                      <th className="w-20 px-4 py-2">Shift</th>
                      <th className="w-36 px-4 py-2">Requested Timing</th>
                      <th className="w-24 px-4 py-2">Type</th>
                      <th className="w-24 px-4 py-2">Status</th>
                      <th className="w-32 px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRegularizations.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No {selectedStatus} regularizations found
                        </td>
                      </tr>
                    ) : (
                      paginatedRegularizations.map((item, index) => {
                        const displayStatus = getDisplayStatus(item);
                        const canActOnRegularization = canCurrentUserActOnRegularization(item);
                        
                        return (
                          <tr key={item._id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={() => toggleSelectOne(item._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={!canActOnRegularization}
                              />
                            </td>
                            <td className="px-4 py-2">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-4 py-2">
                              <div>
                                <div className="font-medium">
                                  {item.employee?.personalDetails?.firstName} {item.employee?.personalDetails?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.employee?.employmentDetails?.employeeId || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-xs">
                                <div>From: {formatDate(item.from)}</div>
                                <div>To: {formatDate(item.to)}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-xs">
                                <div className="font-medium">{item.shift?.name || "N/A"}</div>
                                <div className="text-gray-500">
                                  {item.shift?.startTime} - {item.shift?.endTime}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-xs">
                                <div>In: {formatTime(item.requestedInTime)}</div>
                                <div>Out: {formatTime(item.requestedOutTime)}</div>
                                <div className="text-gray-500">
                                  {item.totalHours || 0}h total
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {item.regularizationType?.replace('_', ' ') || "N/A"}
                              </span>
                            </td>
                            <td className={`px-4 py-2 capitalize font-medium ${getStatusColor(displayStatus)}`}>
                              {displayStatus}
                              {/* Show additional info for already approved regularizations */}
                              {hasCurrentUserApproved(item) && displayStatus === "approved" && (
                                <div className="text-xs text-green-600 mt-1">
                                  (You approved)
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => handleView(item)}
                                className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Action Modal */}
            {isBulkModalOpen && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Regularizations
                  </h2>

                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-800">
                      You are about to {bulkAction} {selectedIds.length} regularization{selectedIds.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This action cannot be undone. Please confirm your decision.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {bulkAction === 'reject' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bulk Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={bulkReason}
                          onChange={(e) => setBulkReason(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter rejection reason for all selected regularizations..."
                          required
                        />
                      </div>
                    )}
                    
                    {bulkAction === 'approve' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bulk Approval Comment (Optional)
                        </label>
                        <textarea
                          value={bulkComment}
                          onChange={(e) => setBulkComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter approval comment for all selected regularizations..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsBulkModalOpen(false);
                        setBulkReason("");
                        setBulkComment("");
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkAction}
                      disabled={loading || (bulkAction === 'reject' && !bulkReason.trim())}
                      className={`px-6 py-2 rounded transition-colors disabled:opacity-50 ${
                        bulkAction === 'approve'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {loading ? "Processing..." : `Bulk ${bulkAction === 'approve' ? 'Approve' : 'Reject'}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View/Action Modal */}
            {isViewModalOpen && selectedRegularization && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
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

                  {/* Timing and Status Details */}
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
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Status Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          selectedRegularization.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedRegularization.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedRegularization.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedRegularization.status}
                        </span>
                      </div>

                      {/* Show approval flow status */}
                      <div className="border-t pt-3 mt-4">
                        <strong>Approval Status:</strong>
                        <div className="ml-4 mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>HR:</span>
                            <span className={`capitalize ${getStatusColor(selectedRegularization?.approvalFlow?.hr?.status || 'pending')}`}>
                              {selectedRegularization?.approvalFlow?.hr?.status || 'pending'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Manager:</span>
                            <span className={`capitalize ${getStatusColor(selectedRegularization?.approvalFlow?.manager?.status || 'pending')}`}>
                              {selectedRegularization?.approvalFlow?.manager?.status || 'pending'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Admin:</span>
                            <span className={`capitalize ${getStatusColor(selectedRegularization?.approvalFlow?.admin?.status || 'pending')}`}>
                              {selectedRegularization?.approvalFlow?.admin?.status || 'pending'}
                            </span>
                          </div>
                        </div>
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
                    
                    {selectedRegularization.rejectionReason && (
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">Rejection Reason</label>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-red-800">{selectedRegularization.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6 gap-3">
                    {/* Show message if user has already approved */}
                    {hasCurrentUserApproved(selectedRegularization) && (
                      <div className="text-green-600 text-sm font-medium">
                        ✅ You have already approved this regularization
                      </div>
                    )}

                    {!showRejectionInput && (
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                      >
                        Close
                      </button>
                    )}

                    {/* Only show Approve/Reject buttons if user can act on this regularization */}
                    {canCurrentUserActOnRegularization(selectedRegularization) && (
                      <>
                        {!showRejectionInput && (
                          <button
                            onClick={() => approveRegularization(selectedRegularization._id)}
                            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                            disabled={loading}
                          >
                            Approve
                          </button>
                        )}

                        {!showRejectionInput ? (
                          <button
                            onClick={() => setShowRejectionInput(true)}
                            className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                          >
                            Reject
                          </button>
                        ) : (
                          <div className="flex flex-col items-end w-full gap-2">
                            <textarea
                              placeholder="Reason for rejection (required)"
                              value={singleRejectReason}
                              onChange={(e) => setSingleRejectReason(e.target.value)}
                              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowRejectionInput(false);
                                  setSingleRejectReason("");
                                }}
                                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => rejectRegularizationAction(selectedRegularization._id)}
                                disabled={!singleRejectReason.trim() || loading}
                                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Confirm Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RegularizationApproval;
