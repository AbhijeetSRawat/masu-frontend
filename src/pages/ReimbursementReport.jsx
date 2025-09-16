import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { reimbursementsEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const {
  getReimbursementsForManager,
  getReimbursementsForHr,
  getReimbursementsForAdmin,
  managerApprove,
  hrApprove,
  adminApprove,
  reject,
  bulkUpdate,
  markAsPaid,
} = reimbursementsEndpoints;

const ReimbursementReport = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const role = useSelector((state) => state.auth.role);
  const subAdminPermissions = useSelector(
    (state) => state.permissions.subAdminPermissions
  );
  const employee = useSelector((state) => state.employees.reduxEmployee);

  const [allReimbursements, setAllReimbursements] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("pending"); // Default to pending
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

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
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
  const getApprovalEndpoint = (reimbursementId) => {
    if (role === "hr") {
      return hrApprove + reimbursementId;
    } else if (role === "manager") {
      return managerApprove + reimbursementId;
    } else if (role === "admin" || role === "superadmin") {
      return adminApprove + reimbursementId;
    }
    return null;
  };

  // Get rejection endpoint (same for all roles, but with level parameter)
  const getRejectionEndpoint = (reimbursementId) => {
    return reject + reimbursementId;
  };

  // Helper function to check if current user has already approved this reimbursement
  const hasCurrentUserApproved = (reimbursement) => {
    const currentLevel = getRoleLevel();
    if (!currentLevel || !reimbursement?.approvalFlow) return false;
    
    return reimbursement.approvalFlow[currentLevel]?.status === "approved";
  };

  // Only show Approve/Reject if status and currentApprovalLevel match this user's role
  const canCurrentUserActOnReimbursement = (r) => {
    // If reimbursement is not pending, no actions allowed
    if (r.status !== "pending") return false;
    
    // If current user has already approved, no actions allowed
    if (hasCurrentUserApproved(r)) return false;
    
    // Check if it's the current user's turn to approve
    const currentLevel = getRoleLevel();
    if (!currentLevel) return false;
    
    // Check if this reimbursement is at the current user's approval level
    return r.currentApprovalLevel === currentLevel;
  };

  // Get display status based on role and reimbursement state
  const getDisplayStatus = (reimbursement) => {
    const currentLevel = getRoleLevel();
    
    // If it's paid, always show as paid
    if (reimbursement.status === "paid") {
      return "paid";
    }
    
    // If it's rejected, always show as rejected
    if (reimbursement.status === "rejected") {
      return "rejected";
    }
    
    // If overall status is approved, show as approved
    if (reimbursement.status === "approved") {
      return "approved";
    }
    
    // For pending reimbursements, check if current user's level has approved
    if (reimbursement.status === "pending") {
      // If current user has approved at their level, show as approved for them
      if (hasCurrentUserApproved(reimbursement)) {
        return "approved";
      }
      // If it's waiting for current user's approval, show as pending
      if (reimbursement.currentApprovalLevel === currentLevel) {
        return "pending";
      }
      // If it hasn't reached current user's level yet, it's pending for them too
      return "pending";
    }
    
    return reimbursement.status;
  };

  // ----- Data fetching -----
  const fetchApprovalData = async (status = selectedStatus, page = 1) => {
    try {
      dispatch(setLoading(true));
      let endpoint = "";
      if (role === "manager") {
        endpoint = getReimbursementsForManager + (employee?.employeeId || employee?.id || employee?._id);
      } else if (role === "hr") {
        endpoint = getReimbursementsForHr + (employee?.employeeId || employee?.id || employee?._id);
      } else if (role === "admin" || role === "superadmin") {
        endpoint = getReimbursementsForAdmin + (employee?.employeeId || employee?.id || employee?._id);
      } else {
        toast.error("Role not authorized to fetch reimbursements");
        dispatch(setLoading(false));
        return;
      }

      // Build query parameters - let backend handle filtering if supported
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

      if (res.data.success) {
        setAllReimbursements(res.data.reimbursements || []);
        
        // Set pagination info if available from API
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.page || page);
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.total || res.data.reimbursements?.length || 0);
        } else if (res.data.page) {
          setCurrentPage(res.data.page || page);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || res.data.reimbursements?.length || 0);
        } else {
          // Fallback for client-side pagination
          setCurrentPage(page);
          setTotalPages(Math.ceil((res.data.reimbursements?.length || 0) / itemsPerPage) || 1);
          setTotalCount(res.data.reimbursements?.length || 0);
        }

        setSelectedIds([]);
        setSelectAll(false);

        toast.success(`${status.charAt(0).toUpperCase() + status.slice(1)} reimbursements fetched successfully!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch reimbursements!");
      setAllReimbursements([]);
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
  const filteredReimbursements = useMemo(() => {
    return allReimbursements.filter((item) => {
      const displayStatus = getDisplayStatus(item);
      if (selectedStatus === "all") return true;
      return displayStatus === selectedStatus;
    });
  }, [selectedStatus, allReimbursements, role]);

  const paginatedReimbursements = useMemo(() => {
    if (totalPages > 1) {
      // Server-side pagination - use all data as it's already paginated
      return filteredReimbursements;
    } else {
      // Client-side pagination fallback
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredReimbursements.slice(startIndex, endIndex);
    }
  }, [filteredReimbursements, currentPage, itemsPerPage, totalPages]);

  useEffect(() => {
    // Update pagination info when filtered data changes (for client-side pagination)
    if (totalPages <= 1) {
      const newTotalPages = Math.ceil(filteredReimbursements.length / itemsPerPage) || 1;
      setTotalPages(newTotalPages);
      setTotalCount(filteredReimbursements.length);
      if (currentPage > newTotalPages) setCurrentPage(1);
    }
    setSelectedIds([]);
    setSelectAll(false);
  }, [filteredReimbursements, itemsPerPage, currentPage, totalPages]);

  // ----- Bulk selection -----
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      // Only select reimbursements that can be acted upon
      const selectableIds = paginatedReimbursements
        .filter(reimbursement => canCurrentUserActOnReimbursement(reimbursement))
        .map(reimbursement => reimbursement._id);
      setSelectedIds(selectableIds);
      setSelectAll(selectableIds.length === paginatedReimbursements.length && selectableIds.length > 0);
    }
  };

  const toggleSelectOne = (id) => {
    const reimbursement = paginatedReimbursements.find(r => r._id === id);
    if (!canCurrentUserActOnReimbursement(reimbursement)) {
      toast.error("You cannot act on this reimbursement at the current time");
      return;
    }

    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      const selectableReimbursements = paginatedReimbursements.filter(reimbursement => canCurrentUserActOnReimbursement(reimbursement));
      setSelectAll(newSelection.length === selectableReimbursements.length && selectableReimbursements.length > 0);
      return newSelection;
    });
  };

  // ----- Bulk actions -----
  const openBulkModal = (action) => {
    const actionableReimbursements = paginatedReimbursements.filter(reimbursement => canCurrentUserActOnReimbursement(reimbursement));
    const actionableSelectedIds = selectedIds.filter(id => 
      actionableReimbursements.some(reimbursement => reimbursement._id === id)
    );

    if (actionableSelectedIds.length === 0) {
      toast.error("Please select at least one reimbursement that you can act upon");
      return;
    }
    setBulkAction(action);
    setBulkReason("");
    setIsBulkModalOpen(true);
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one reimbursement");
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
        ...(bulkAction === 'reject' && { reason: bulkReason })
      };

      const result = await apiConnector(
        "PUT",
        bulkUpdate,
        payload,
        { Authorization: `Bearer ${token}` }
      );

      if (result.data.success) {
        toast.success(`${selectedIds.length} reimbursements ${bulkAction}d successfully!`);
        setSelectedIds([]);
        setSelectAll(false);
        setIsBulkModalOpen(false);
        setBulkReason("");
        fetchApprovalData(selectedStatus, currentPage);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || `Failed to ${bulkAction} reimbursements`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ----- Per-item actions -----
  const handleView = (reimbursement) => {
    setSelectedReimbursement(reimbursement);
    setIsViewModalOpen(true);
    setShowRejectionInput(false);
    setSingleRejectReason("");
  };

  const approveReimbursement = async (reimbursementId) => {
    try {
      dispatch(setLoading(true));
      
      const approvalEndpoint = getApprovalEndpoint(reimbursementId);
      if (!approvalEndpoint) {
        toast.error("Approval not allowed for current user role");
        dispatch(setLoading(false));
        return;
      }

      const result = await apiConnector(
        "PUT",
        approvalEndpoint,
        {},
        { Authorization: `Bearer ${token}` }
      );
      
      if (result.data.success) {
        toast.success("Reimbursement approved successfully!");
        fetchApprovalData(selectedStatus, currentPage);
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve reimbursement");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const rejectReimbursement = async (reimbursementId) => {
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
      
      const rejectionEndpoint = getRejectionEndpoint(reimbursementId);
      const result = await apiConnector(
        "PUT",
        rejectionEndpoint,
        {
          reason: singleRejectReason,
          level
        },
        { Authorization: `Bearer ${token}` }
      );

      if (result.data.success) {
        toast.success("Reimbursement rejected successfully!");
        fetchApprovalData(selectedStatus, currentPage);
        setIsViewModalOpen(false);
        setShowRejectionInput(false);
        setSingleRejectReason("");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject reimbursement");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      dispatch(setLoading(true));
      await apiConnector(
        "PUT",
        markAsPaid + selectedReimbursement._id,
        {},
        { Authorization: `Bearer ${token}` }
      );
      toast.success("Marked as paid!");
      setIsViewModalOpen(false);
      fetchApprovalData(selectedStatus, currentPage);
    } catch (e) {
      toast.error("Failed to mark as paid.");
      console.log(e)
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
      case "paid":
        return "text-blue-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
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
                Reimbursement Report
              </h1>

              {/* Status Filter Buttons */}
              <div className="flex gap-3 mb-4">
                {["pending", "approved", "paid", "rejected"].map((status) => (
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

              {/* Bulk Actions Bar - Only show for actionable reimbursements */}
              {selectedIds.length > 0 && selectedStatus === 'pending' && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-blue-800 font-medium">
                      {selectedIds.length} reimbursement{selectedIds.length > 1 ? 's' : ''} selected
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
                      <th className="w-24 px-4 py-2">Category</th>
                      <th className="w-20 px-4 py-2">Amount</th>
                      <th className="w-36 px-4 py-2">Date</th>
                      <th className="w-64 px-4 py-2">Description</th>
                      <th className="w-24 px-4 py-2">Status</th>
                      <th className="w-32 px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReimbursements.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No {selectedStatus} reimbursements found
                        </td>
                      </tr>
                    ) : (
                      paginatedReimbursements.map((item, index) => {
                        const displayStatus = getDisplayStatus(item);
                        const canActOnReimbursement = canCurrentUserActOnReimbursement(item);
                        
                        return (
                          <tr key={item._id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={() => toggleSelectOne(item._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={!canActOnReimbursement}
                              />
                            </td>
                            <td className="px-4 py-2">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-4 py-2">
                              {item.employee?.user?.profile?.firstName && item.employee?.user?.profile?.lastName
                                ? `${item.employee.user.profile.firstName} ${item.employee.user.profile.lastName || ""}`
                                : "—"}
                            </td>
                            <td className="px-4 py-2">
                              {item.category?.name || "N/A"}
                            </td>
                            <td className="px-4 py-2">
                              ₹{item.amount?.toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              {new Date(item.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2">
                              <div className="truncate" title={item.description}>
                                {item.description}
                              </div>
                            </td>
                            <td className={`px-4 py-2 capitalize font-medium ${getStatusColor(displayStatus)}`}>
                              {displayStatus}
                              {/* Show additional info for already approved reimbursements */}
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
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Reimbursements
                  </h2>

                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-800">
                      You are about to {bulkAction} {selectedIds.length} reimbursement{selectedIds.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This action cannot be undone. Please confirm your decision.
                    </p>
                  </div>

                  {bulkAction === 'reject' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bulk Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={bulkReason}
                          onChange={(e) => setBulkReason(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter rejection reason for all selected reimbursements..."
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsBulkModalOpen(false);
                        setBulkReason("");
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
            {isViewModalOpen && selectedReimbursement && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Reimbursement Details</h2>
                  
                  <div className="space-y-3">
                    <p>
                      <strong>Employee:</strong>{" "}
                      {selectedReimbursement.employee?.user?.profile?.firstName}{" "}
                      {selectedReimbursement.employee?.user?.profile?.lastName}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedReimbursement.employee?.user?.profile?.phone || "—"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedReimbursement.employee?.user?.email || "—"}
                    </p>

                    <p>
                      <strong>Category:</strong> {selectedReimbursement.category?.name || "N/A"}
                    </p>
                    
                    <p>
                      <strong>Amount:</strong> ₹{selectedReimbursement.amount?.toLocaleString()}
                    </p>
                    
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedReimbursement.date).toLocaleDateString()}
                    </p>
                    
                    <p>
                      <strong>Description:</strong> {selectedReimbursement.description}
                    </p>
                    
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`capitalize ${getStatusColor(getDisplayStatus(selectedReimbursement))}`}>
                        {getDisplayStatus(selectedReimbursement)}
                      </span>
                    </p>

                    {/* Show approval flow status */}
                    <div className="border-t pt-3 mt-4">
                      <strong>Approval Status:</strong>
                      <div className="ml-4 mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Manager:</span>
                          <span className={`capitalize ${getStatusColor(selectedReimbursement?.approvalFlow?.manager?.status || 'pending')}`}>
                            {selectedReimbursement?.approvalFlow?.manager?.status || 'pending'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>HR:</span>
                          <span className={`capitalize ${getStatusColor(selectedReimbursement?.approvalFlow?.hr?.status || 'pending')}`}>
                            {selectedReimbursement?.approvalFlow?.hr?.status || 'pending'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Admin:</span>
                          <span className={`capitalize ${getStatusColor(selectedReimbursement?.approvalFlow?.admin?.status || 'pending')}`}>
                            {selectedReimbursement?.approvalFlow?.admin?.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedReimbursement.rejectionReason && (
                      <p>
                        <strong>Rejection Reason:</strong> {selectedReimbursement.rejectionReason}
                      </p>
                    )}

                    {selectedReimbursement.receiptUrl && (
                      <div>
                        <strong>Receipt:</strong>
                        <div className="mt-2">
                          <a
                            href={selectedReimbursement.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Receipt Document
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6 gap-3">
                     {/* Show message if user has already approved */}
                    {hasCurrentUserApproved(selectedReimbursement) && (
                      <div className="text-green-600 text-sm font-medium">
                        ✅ You have already approved this reimbursement
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

                    {/* Only show Approve/Reject buttons if user can act on this reimbursement */}
                    {canCurrentUserActOnReimbursement(selectedReimbursement) && (
                      <>
                        {!showRejectionInput && (
                          <button
                            onClick={() => approveReimbursement(selectedReimbursement._id)}
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
                                onClick={() => rejectReimbursement(selectedReimbursement._id)}
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

                    {/* Mark as Paid button for approved reimbursements (Admin only) */}
                    {selectedReimbursement.status === "approved" &&
                      (role === "admin" || role === "superadmin") && (
                        <button
                          onClick={handleMarkAsPaid}
                          className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 transition-colors"
                          disabled={loading}
                        >
                          Mark as Paid
                        </button>
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

export default ReimbursementReport;
