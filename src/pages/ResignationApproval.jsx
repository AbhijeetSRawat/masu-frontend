import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { resignationEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const {
  GET_RESIGNATION_FOR_MANAGER,
  GET_RESIGNATIONS_FOR_HR,
  GET_RESIGNATIONS_FOR_ADMIN,
  MANAGER_APPROVE_RESIGNATION,
  HR_APPROVE_RESIGNATION,
  ADMIN_APPROVAL_RESIGNATION,
  REJECT_RESIGNATION,
  BULK_UPDATE_RESIGNATIONS,
} = resignationEndpoints;

const ResignationApproval = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const role = useSelector((state) => state.auth.role);
  const subAdminPermissions = useSelector(
    (state) => state.permissions.subAdminPermissions
  );
  const employee = useSelector((state) => state.employees.reduxEmployee);

  const [allResignations, setAllResignations] = useState([]);
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
  const [bulkActualLastWorkingDate, setBulkActualLastWorkingDate] = useState("");

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [singleRejectReason, setSingleRejectReason] = useState("");
  const [actualLastWorkingDate, setActualLastWorkingDate] = useState("");
  const [approvalComment, setApprovalComment] = useState("");

  // Role/level helpers
  const getRoleLevel = () => {
    if (role === "hr") return "hr";
    if (role === "manager") return "manager";
    if (role === "admin" || role === "superadmin") return "admin";
    return null;
  };

  // Get the appropriate approval endpoint based on user role
  const getApprovalEndpoint = (resignationId) => {
    if (role === "hr") {
      return HR_APPROVE_RESIGNATION + resignationId;
    } else if (role === "manager") {
      return MANAGER_APPROVE_RESIGNATION + resignationId;
    } else if (role === "admin" || role === "superadmin") {
      return ADMIN_APPROVAL_RESIGNATION + resignationId;
    }
    return null;
  };

  // Get rejection endpoint (same for all roles, but with level parameter)
  const getRejectionEndpoint = (resignationId) => {
    return REJECT_RESIGNATION + resignationId;
  };

  // Helper function to check if current user has already approved this resignation
  const hasCurrentUserApproved = (resignation) => {
    const currentLevel = getRoleLevel();
    if (!currentLevel || !resignation?.approvalFlow) return false;
    
    return resignation.approvalFlow[currentLevel]?.status === "approved";
  };

  // Only show Approve/Reject if status and currentApprovalLevel match this user's role
  const canCurrentUserActOnResignation = (r) => {
    // If resignation is not pending, no actions allowed
    if (r.status !== "pending") return false;
    
    // If current user has already approved, no actions allowed
    if (hasCurrentUserApproved(r)) return false;
    
    // Check if it's the current user's turn to approve
    const currentLevel = getRoleLevel();
    if (!currentLevel) return false;
    
    // Check if this resignation is at the current user's approval level
    return r.currentApprovalLevel === currentLevel;
  };

  // Get display status based on role and resignation state
  const getDisplayStatus = (resignation) => {
    const currentLevel = getRoleLevel();
    
    // If it's withdrawn, always show as withdrawn
    if (resignation.status === "withdrawn") {
      return "withdrawn";
    }
    
    // If it's completed, always show as completed
    if (resignation.status === "completed") {
      return "completed";
    }
    
    // If it's rejected, always show as rejected
    if (resignation.status === "rejected") {
      return "rejected";
    }
    
    // If overall status is approved, show as approved
    if (resignation.status === "approved") {
      return "approved";
    }
    
    // For pending resignations, check if current user's level has approved
    if (resignation.status === "pending") {
      // If current user has approved at their level, show as approved for them
      if (hasCurrentUserApproved(resignation)) {
        return "approved";
      }
      // If it's waiting for current user's approval, show as pending
      if (resignation.currentApprovalLevel === currentLevel) {
        return "pending";
      }
      // If it hasn't reached current user's level yet, it's pending for them too
      return "pending";
    }
    
    return resignation.status;
  };

  // ----- Data fetching -----
  const fetchApprovalData = async (status = selectedStatus, page = 1) => {
    try {
      dispatch(setLoading(true));
      let endpoint = "";
      const empId = employee?.employeeId || employee?.id || employee?._id;
      
      if (role === "manager") {
        endpoint = GET_RESIGNATION_FOR_MANAGER + empId;
      } else if (role === "hr") {
        // Fix HR endpoint
        endpoint = GET_RESIGNATIONS_FOR_HR.replace('hrId', empId);
      } else if (role === "admin" || role === "superadmin") {
        endpoint = GET_RESIGNATIONS_FOR_ADMIN + empId;
      } else {
        toast.error("Role not authorized to fetch resignations");
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

      console.log("Resignation fetch response:", res.data);

      if (res.data.success) {
        setAllResignations(res.data.resignations || []);
        
        // Set pagination info
        setCurrentPage(res.data.page || page);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || res.data.resignations?.length || 0);

        setSelectedIds([]);
        setSelectAll(false);

        toast.success(`Resignations fetched successfully!`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Unable to fetch resignations!");
      setAllResignations([]);
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
  const filteredResignations = useMemo(() => {
    return allResignations.filter((item) => {
      const displayStatus = getDisplayStatus(item);
      if (selectedStatus === "all") return true;
      return displayStatus === selectedStatus;
    });
  }, [selectedStatus, allResignations, role]);

  const paginatedResignations = useMemo(() => {
    if (totalPages > 1) {
      return filteredResignations;
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredResignations.slice(startIndex, endIndex);
    }
  }, [filteredResignations, currentPage, itemsPerPage, totalPages]);

  useEffect(() => {
    if (totalPages <= 1) {
      const newTotalPages = Math.ceil(filteredResignations.length / itemsPerPage) || 1;
      setTotalPages(newTotalPages);
      setTotalCount(filteredResignations.length);
      if (currentPage > newTotalPages) setCurrentPage(1);
    }
    setSelectedIds([]);
    setSelectAll(false);
  }, [filteredResignations, itemsPerPage, currentPage, totalPages]);

  // ----- Bulk selection -----
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const selectableIds = paginatedResignations
        .filter(resignation => canCurrentUserActOnResignation(resignation))
        .map(resignation => resignation._id);
      setSelectedIds(selectableIds);
      setSelectAll(selectableIds.length === paginatedResignations.length && selectableIds.length > 0);
    }
  };

  const toggleSelectOne = (id) => {
    const resignation = paginatedResignations.find(r => r._id === id);
    if (!canCurrentUserActOnResignation(resignation)) {
      toast.error("You cannot act on this resignation at the current time");
      return;
    }

    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      const selectableResignations = paginatedResignations.filter(resignation => canCurrentUserActOnResignation(resignation));
      setSelectAll(newSelection.length === selectableResignations.length && selectableResignations.length > 0);
      return newSelection;
    });
  };

  // ----- Bulk actions -----
  const openBulkModal = (action) => {
    const actionableResignations = paginatedResignations.filter(resignation => canCurrentUserActOnResignation(resignation));
    const actionableSelectedIds = selectedIds.filter(id => 
      actionableResignations.some(resignation => resignation._id === id)
    );

    if (actionableSelectedIds.length === 0) {
      toast.error("Please select at least one resignation that you can act upon");
      return;
    }
    setBulkAction(action);
    setBulkReason("");
    setBulkComment("");
    setBulkActualLastWorkingDate("");
    setIsBulkModalOpen(true);
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one resignation");
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
        ...(bulkAction === 'approve' && bulkComment && { comment: bulkComment }),
        ...(bulkAction === 'approve' && level === 'admin' && bulkActualLastWorkingDate && { actualLastWorkingDate: bulkActualLastWorkingDate })
      };

      console.log("Bulk action payload:", payload);

      const result = await apiConnector(
        "PUT",
        BULK_UPDATE_RESIGNATIONS,
        payload,
        { Authorization: `Bearer ${token}` }
      );

      console.log("Bulk action result:", result.data);

      if (result.data.success) {
        toast.success(`${selectedIds.length} resignations ${bulkAction}d successfully!`);
        setSelectedIds([]);
        setSelectAll(false);
        setIsBulkModalOpen(false);
        setBulkReason("");
        setBulkComment("");
        setBulkActualLastWorkingDate("");
        fetchApprovalData(selectedStatus, currentPage);
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error(error.response?.data?.message || `Failed to ${bulkAction} resignations`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ----- Per-item actions -----
  const handleView = (resignation) => {
    setSelectedResignation(resignation);
    setIsViewModalOpen(true);
    setShowRejectionInput(false);
    setSingleRejectReason("");
    setApprovalComment("");
    setActualLastWorkingDate(resignation.proposedLastWorkingDate?.split('T')[0] || "");
  };

  const approveResignation = async () => {
    if (!selectedResignation) return;

    try {
      dispatch(setLoading(true));
      
      const approvalEndpoint = getApprovalEndpoint(selectedResignation._id);
      if (!approvalEndpoint) {
        toast.error("Approval not allowed for current user role");
        dispatch(setLoading(false));
        return;
      }

      const payload = {
        ...(approvalComment && { comment: approvalComment }),
        ...(getRoleLevel() === 'admin' && actualLastWorkingDate && { actualLastWorkingDate })
      };

      console.log("Single approve payload:", payload);
      console.log("Approve endpoint:", approvalEndpoint);

      const result = await apiConnector(
        "PUT",
        approvalEndpoint,
        payload,
        { Authorization: `Bearer ${token}` }
      );
      
      if (result.data.success) {
        toast.success("Resignation approved successfully!");
        fetchApprovalData(selectedStatus, currentPage);
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(error.response?.data?.message || "Failed to approve resignation");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const rejectResignationAction = async () => {
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
      
      const rejectionEndpoint = getRejectionEndpoint(selectedResignation._id);
      const payload = {
        reason: singleRejectReason,
        level
      };

      console.log("Single reject payload:", payload);
      console.log("Reject endpoint:", rejectionEndpoint);

      const result = await apiConnector(
        "PUT",
        rejectionEndpoint,
        payload,
        { Authorization: `Bearer ${token}` }
      );

      if (result.data.success) {
        toast.success("Resignation rejected successfully!");
        fetchApprovalData(selectedStatus, currentPage);
        setIsViewModalOpen(false);
        setShowRejectionInput(false);
        setSingleRejectReason("");
      }
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(error.response?.data?.message || "Failed to reject resignation");
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
      case "withdrawn":
        return "text-gray-600";
      case "completed":
        return "text-blue-600";
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
                Resignation Approval
              </h1>

              {/* Status Filter Buttons */}
              <div className="flex gap-3 mb-4">
                {["pending", "approved", "rejected", "withdrawn", "completed"].map((status) => (
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

              {/* Bulk Actions Bar - Only show for actionable resignations */}
              {selectedIds.length > 0 && selectedStatus === 'pending' && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
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
                      <th className="w-24 px-4 py-2">Employee ID</th>
                      <th className="w-36 px-4 py-2">Applied Date</th>
                      <th className="w-36 px-4 py-2">Proposed LWD</th>
                      <th className="w-64 px-4 py-2">Reason</th>
                      <th className="w-24 px-4 py-2">Status</th>
                      <th className="w-32 px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResignations.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No {selectedStatus} resignations found
                        </td>
                      </tr>
                    ) : (
                      paginatedResignations.map((item, index) => {
                        const displayStatus = getDisplayStatus(item);
                        const canActOnResignation = canCurrentUserActOnResignation(item);
                        
                        return (
                          <tr key={item._id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={() => toggleSelectOne(item._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={!canActOnResignation}
                              />
                            </td>
                            <td className="px-4 py-2">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-4 py-2">
                              <div>
                                <div className="font-medium">
                                  {item.employee?.personalDetails?.firstName || item.employee?.user?.profile?.firstName} {item.employee?.personalDetails?.lastName || item.employee?.user?.profile?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.employee?.user?.email || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {item.employee?.employmentDetails?.employeeId || "N/A"}
                            </td>
                            <td className="px-4 py-2">
                              {formatDate(item.resignationDate)}
                            </td>
                            <td className="px-4 py-2">
                              {formatDate(item.proposedLastWorkingDate)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="truncate" title={item.reason}>
                                {item.reason}
                              </div>
                            </td>
                            <td className={`px-4 py-2 capitalize font-medium ${getStatusColor(displayStatus)}`}>
                              {displayStatus}
                              {/* Show additional info for already approved resignations */}
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
              <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Resignations
                  </h2>

                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-800">
                      You are about to {bulkAction} {selectedIds.length} resignation{selectedIds.length > 1 ? 's' : ''}
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
                          placeholder="Enter rejection reason for all selected resignations..."
                          required
                        />
                      </div>
                    )}
                    
                    {bulkAction === 'approve' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bulk Approval Comment (Optional)
                          </label>
                          <textarea
                            value={bulkComment}
                            onChange={(e) => setBulkComment(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter approval comment for all selected resignations..."
                          />
                        </div>
                        
                        {getRoleLevel() === 'admin' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Actual Last Working Date (Optional)
                            </label>
                            <input
                              type="date"
                              value={bulkActualLastWorkingDate}
                              onChange={(e) => setBulkActualLastWorkingDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to use each resignation's proposed date
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsBulkModalOpen(false);
                        setBulkReason("");
                        setBulkComment("");
                        setBulkActualLastWorkingDate("");
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
                          {selectedResignation.employee?.personalDetails?.firstName || selectedResignation.employee?.user?.profile?.firstName} {selectedResignation.employee?.personalDetails?.lastName || selectedResignation.employee?.user?.profile?.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{selectedResignation.employee?.user?.email || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <p className="text-gray-900">{selectedResignation.employee?.employmentDetails?.department?.name || "N/A"}</p>
                      </div>
                    </div>

                    {/* Resignation Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Resignation Details</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          selectedResignation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedResignation.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedResignation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          selectedResignation.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedResignation.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Flow Status */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Approval Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="font-medium text-gray-700">HR</div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedResignation?.approvalFlow?.hr?.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedResignation?.approvalFlow?.hr?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedResignation?.approvalFlow?.hr?.status || 'pending'}
                        </span>
                        {selectedResignation?.approvalFlow?.hr?.comment && (
                          <p className="text-xs text-gray-600 mt-1">{selectedResignation.approvalFlow.hr.comment}</p>
                        )}
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="font-medium text-gray-700">Manager</div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedResignation?.approvalFlow?.manager?.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedResignation?.approvalFlow?.manager?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedResignation?.approvalFlow?.manager?.status || 'pending'}
                        </span>
                        {selectedResignation?.approvalFlow?.manager?.comment && (
                          <p className="text-xs text-gray-600 mt-1">{selectedResignation.approvalFlow.manager.comment}</p>
                        )}
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="font-medium text-gray-700">Admin</div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedResignation?.approvalFlow?.admin?.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedResignation?.approvalFlow?.admin?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedResignation?.approvalFlow?.admin?.status || 'pending'}
                        </span>
                        {selectedResignation?.approvalFlow?.admin?.comment && (
                          <p className="text-xs text-gray-600 mt-1">{selectedResignation.approvalFlow.admin.comment}</p>
                        )}
                      </div>
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
                          <p className="text-red-800">{selectedResignation.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin-specific fields for approval */}
                  {canCurrentUserActOnResignation(selectedResignation) && getRoleLevel() === 'admin' && !showRejectionInput && (
                    <div className="space-y-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-medium text-blue-900">Admin Approval Settings</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Actual Last Working Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={actualLastWorkingDate}
                          onChange={(e) => setActualLastWorkingDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to use the proposed date: {formatDate(selectedResignation.proposedLastWorkingDate)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approval Comments (Optional)
                        </label>
                        <textarea
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter any additional comments..."
                        />
                      </div>
                    </div>
                  )}

                  {/* General approval comment for non-admin roles */}
                  {canCurrentUserActOnResignation(selectedResignation) && getRoleLevel() !== 'admin' && !showRejectionInput && (
                    <div className="space-y-4 mb-6 p-4 bg-green-50 border border-green-200 rounded">
                      <h4 className="font-medium text-green-900">{getRoleLevel().toUpperCase()} Approval</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approval Comments (Optional)
                        </label>
                        <textarea
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter any additional comments..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-6 gap-3">
                    {/* Show message if user has already approved */}
                    {hasCurrentUserApproved(selectedResignation) && (
                      <div className="text-green-600 text-sm font-medium mr-auto">
                        ✅ You have already approved this resignation
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

                    {/* Only show Approve/Reject buttons if user can act on this resignation */}
                    {canCurrentUserActOnResignation(selectedResignation) && (
                      <>
                        {!showRejectionInput ? (
                          <>
                            <button
                              onClick={approveResignation}
                              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                              disabled={loading}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setShowRejectionInput(true)}
                              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                            >
                              Reject
                            </button>
                          </>
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
                                onClick={rejectResignationAction}
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

export default ResignationApproval;
