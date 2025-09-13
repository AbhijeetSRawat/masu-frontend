import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { useNavigate } from "react-router-dom";
import { leaveEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const { 
  GET_HR_LEAVES,
  GET_ADMIN_LEAVES,
  GET_MANAGER_LEAVES,
  approveLeave,
  rejectLeave,
  bulkUpdate
} = leaveEndpoints;

const LeaveApproval = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)
  
  const employee = useSelector((state) => state.employees.reduxEmployee);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState(""); // 'approve' or 'reject'
  const [bulkReason, setBulkReason] = useState("");
  const [bulkComment, setBulkComment] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.permissions.loading);

  const fetchLeaves = async (status = statusFilter, page = 1) => {
  try {
    dispatch(setLoading(true));

    let baseEndpoint;
    if (role === "hr") {
      baseEndpoint = GET_HR_LEAVES;
    } else if (role === "manager") {
      baseEndpoint = GET_MANAGER_LEAVES;
    } else if (role === "admin" || role === "superadmin") {
      baseEndpoint = GET_ADMIN_LEAVES;
    } else {
      // fallback or throw error
      toast.error("User role not authorized to fetch leaves");
      dispatch(setLoading(false));
      return;
    }

    console.log(employee)

    const url = `${baseEndpoint}${employee.id}`;

    const result = await apiConnector("GET", url, null, {
      Authorization: `Bearer ${token}`,
    });

    console.log(result);

    if (result.data.success) {
      setLeaves(result.data.leaves || []);
      setPagination({
        page: result.data.page,
        totalPages: result.data.totalPages,
        total: result.data.total,
        limit: pagination.limit,
      });

      // Reset bulk selection when fetching new data
      setSelectedIds([]);
      setSelectAll(false);

      toast.success(
        `${status.charAt(0).toUpperCase() + status.slice(1)} leaves fetched successfully!`
      );
    }
  } catch (error) {
    console.error(error);
    toast.error("Unable to fetch leaves!");
    setLeaves([]);
  } finally {
    dispatch(setLoading(false));
  }
};


  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const currentPageIds = leaves.map(leave => leave._id);
      setSelectedIds(currentPageIds);
      setSelectAll(true);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      // Update selectAll state
      setSelectAll(newSelection.length === leaves.length);
      return newSelection;
    });
  };

  // Bulk action handlers
  const openBulkModal = (action) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one leave");
      return;
    }
    setBulkAction(action);
    setBulkReason("");
    setBulkComment("");
    setIsBulkModalOpen(true);
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one leave");
      return;
    }

    if (bulkAction === 'reject' && !bulkReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        ids: selectedIds,
        action: bulkAction,
        ...(bulkAction === 'approve' ? {
          comment: bulkComment
        } : {
          reason: bulkReason
        })
      };

      const result = await apiConnector(
        "PATCH",
        bulkUpdate,
        payload,
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (result.data.success) {
        toast.success(`${selectedIds.length} leaves ${bulkAction}d successfully!`);
        setSelectedIds([]);
        setSelectAll(false);
        setIsBulkModalOpen(false);
        fetchLeaves(statusFilter, pagination.page);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || `Failed to ${bulkAction} leaves`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setIsViewModalOpen(true);
    setShowRejectionInput(false);
    setRejectionReasonInput("");
  };

  const handleApprove = async (leaveId) => {
    try {
      dispatch(setLoading(true));
      const result = await apiConnector(
        "PATCH", 
        `${approveLeave}${leaveId}/approve`,
        {},
        {
          Authorization: `Bearer ${token}`
        }
      );
      
      if (result.data.success) {
        toast.success("Leave approved successfully!");
        fetchLeaves(statusFilter, pagination.page);
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve leave");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleReject = async (leaveId) => {
    if (!rejectionReasonInput.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      dispatch(setLoading(true));
      const result = await apiConnector(
        "PATCH",
        `${rejectLeave}${leaveId}/reject`,
        {
          reason: rejectionReasonInput
        },
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (result.data.success) {
        toast.success("Leave rejected successfully!");
        fetchLeaves(statusFilter, pagination.page);
        setIsViewModalOpen(false);
        setShowRejectionInput(false);
        setRejectionReasonInput("");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject leave");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedIds([]);
    setSelectAll(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLeaves(statusFilter, newPage);
    }
  };

  // Helper function to format leave types from breakup array
  const formatLeaveTypes = (leaveBreakup) => {
    if (!leaveBreakup || leaveBreakup.length === 0) return "—";
    
    return leaveBreakup
      .map(item => `${item.leaveType} (${item.days})`)
      .join(", ");
  };

  // Helper function to get primary leave type for display
  const getPrimaryLeaveType = (leaveBreakup) => {
    if (!leaveBreakup || leaveBreakup.length === 0) return "—";
    
    // If single leave type, return it
    if (leaveBreakup.length === 1) {
      return leaveBreakup[0].leaveType;
    }
    
    // If multiple, show "Mixed" or first type with count
    return `Mixed (${leaveBreakup.length} types)`;
  };

  useEffect(() => {
    if (company?._id && token) {
      fetchLeaves(statusFilter, 1);
    }
  }, [statusFilter, company?._id, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "approved":
        return "text-green-700";
      case "rejected":
        return "text-red-600";
      case "cancelled":
        return "text-gray-500";
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
              {/* Status Filter Buttons */}
              <div className="flex gap-3 mb-4">
                {["pending", "approved", "rejected", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilterChange(status)}
                    className={`px-4 py-2 rounded font-semibold capitalize ${
                      statusFilter === status
                        ? "bg-blue-900 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Bulk Actions Bar */}
              {selectedIds.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-blue-800 font-medium">
                      {selectedIds.length} leave{selectedIds.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {statusFilter === 'pending' && (
                      <>
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
                      </>
                    )}
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
                      <th className="w-32 px-4 py-2">Leave Types</th>
                      <th className="w-64 px-4 py-2">Reason</th>
                      <th className="w-20 px-4 py-2">Total Days</th>
                      <th className="w-36 px-4 py-2">Start</th>
                      <th className="w-36 px-4 py-2">End</th>
                      <th className="w-24 px-4 py-2">Status</th>
                      <th className="w-32 px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                          No {statusFilter} leaves found
                        </td>
                      </tr>
                    ) : (
                      leaves.map((leave, index) => (
                        <tr key={leave._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(leave._id)}
                              onChange={() => toggleSelectOne(leave._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </td>
                          <td className="px-4 py-2">
                            {leave.employee?.user?.profile?.firstName && leave.employee?.user?.profile?.lastName
                              ? `${leave.employee.user.profile.firstName} ${leave.employee.user.profile.lastName || ""}`
                              : "—"}
                          </td>
                          <td className="px-4 py-2 capitalize">
                            <div className="truncate" title={formatLeaveTypes(leave.leaveBreakup)}>
                              {getPrimaryLeaveType(leave.leaveBreakup)}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="truncate" title={leave.reason}>
                              {leave.reason}
                            </div>
                          </td>
                          <td className="px-4 py-2">{leave.totalDays || "—"}</td>
                          <td className="px-4 py-2">
                            {new Date(leave.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            {new Date(leave.endDate).toLocaleDateString()}
                          </td>
                          <td className={`px-4 py-2 capitalize font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleView(leave)}
                              className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
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
                    Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Leaves
                  </h2>

                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-800">
                      You are about to {bulkAction} {selectedIds.length} leave{selectedIds.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      This action cannot be undone. Please confirm your decision.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {bulkAction === 'approve' ? 'Bulk Approval Comments (Optional)' : 'Bulk Rejection Reason'} 
                        {bulkAction === 'reject' && <span className="text-red-500"> *</span>}
                      </label>
                      <textarea
                        value={bulkAction === 'approve' ? bulkComment : bulkReason}
                        onChange={(e) => bulkAction === 'approve' ? setBulkComment(e.target.value) : setBulkReason(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter ${bulkAction === 'approve' ? 'approval comments' : 'rejection reason'} for all selected leaves...`}
                        required={bulkAction === 'reject'}
                      />
                    </div>
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
            {isViewModalOpen && selectedLeave && (
              <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Leave Details</h2>
                  
                  <div className="space-y-3">
                    <p>
                      <strong>Employee:</strong>{" "}
                      {selectedLeave.employee?.user?.profile?.firstName}{" "}
                      {selectedLeave.employee?.user?.profile?.lastName}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedLeave.employee?.user?.profile?.phone || "—"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedLeave.employee?.user?.email || "—"}
                    </p>

                    {/* Updated Leave Types Display */}
                    <div>
                      <strong>Leave Types:</strong>
                      {selectedLeave.leaveBreakup && selectedLeave.leaveBreakup.length > 0 ? (
                        <ul className="mt-2 ml-4">
                          {selectedLeave.leaveBreakup.map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.leaveType} ({item.shortCode})</span>
                              <span>{item.days} days</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span> —</span>
                      )}
                    </div>
                    
                    <p>
                      <strong>Reason:</strong> {selectedLeave.reason}
                    </p>
                    
                    <p>
                      <strong>Total Days:</strong> {selectedLeave.totalDays || "—"}
                    </p>
                    
                    <p>
                      <strong>From:</strong>{" "}
                      {new Date(selectedLeave.startDate).toLocaleDateString()}
                    </p>
                    
                    <p>
                      <strong>To:</strong>{" "}
                      {new Date(selectedLeave.endDate).toLocaleDateString()}
                    </p>
                    
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`capitalize ${getStatusColor(selectedLeave.status)}`}>
                        {selectedLeave.status}
                      </span>
                    </p>

                    {selectedLeave.isHalfDay && (
                      <p>
                        <strong>Half Day Type:</strong> {selectedLeave.halfDayType}
                      </p>
                    )}

                    {selectedLeave.rejectionReason && (
                      <p>
                        <strong>Rejection Reason:</strong> {selectedLeave.rejectionReason}
                      </p>
                    )}

                    {selectedLeave.documents && selectedLeave.documents.length > 0 && (
                      <div>
                        <strong>Documents:</strong>
                        <ul className="mt-2 space-y-1">
                          {selectedLeave.documents.map((doc, index) => (
                            <li key={index}>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {doc.name || `Document ${index + 1}`}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6 gap-3">
                    {!showRejectionInput && (
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                      >
                        Close
                      </button>
                    )}

                    {selectedLeave.status === "pending" && (
                      <>
                        {!showRejectionInput && (
                          <button
                            onClick={() => handleApprove(selectedLeave._id)}
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
                              value={rejectionReasonInput}
                              onChange={(e) => setRejectionReasonInput(e.target.value)}
                              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowRejectionInput(false);
                                  setRejectionReasonInput("");
                                }}
                                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReject(selectedLeave._id)}
                                disabled={!rejectionReasonInput.trim() || loading}
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

export default LeaveApproval;
