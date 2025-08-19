import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { useNavigate } from "react-router-dom";
import { leaveEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";

const { 
  getCompanyLeaves,
  getApprovedLeavesForCompany,
  getPendingLeavesForCompany,
  getCancelledLeavesForCompany,
  getRejectedLeavesForCompany,
  approveLeave,
  rejectLeave
} = leaveEndpoints;

const LeaveApproval = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token); // Added missing token
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
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

      let endpoint;
      switch (status) {
        case 'approved':
          endpoint = getApprovedLeavesForCompany;
          break;
        case 'rejected':
          endpoint = getRejectedLeavesForCompany;
          break;
        case 'cancelled':
          endpoint = getCancelledLeavesForCompany;
          break;
        case 'pending':
        default:
          endpoint = getPendingLeavesForCompany;
          break;
      }

      const result = await apiConnector(
        "GET",
        `${endpoint}${company._id}?page=${page}&limit=${pagination.limit}`,
        null,
        {
          Authorization: `Bearer ${token}`
        }
      );

      console.log(result);

      if (result.data.success) {
        setLeaves(result.data.leaves || []);
        setPagination({
          page: result.data.page,
          totalPages: result.data.totalPages,
          total: result.data.total,
          limit: pagination.limit
        });
        toast.success(`${status.charAt(0).toUpperCase() + status.slice(1)} leaves fetched successfully!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch leaves!");
      setLeaves([]);
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
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLeaves(statusFilter, newPage);
    }
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
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <AdminHeader />

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

              {/* Pagination Info */}
              {/* <div className="mb-4 text-sm text-gray-600">
                Showing {leaves.length} of {pagination.total} {statusFilter} leaves
              </div> */}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border text-sm text-left">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="w-12 px-4 py-2">Sr.</th>
                      <th className="w-32 px-4 py-2">Employee</th>
                      <th className="w-28 px-4 py-2">Type</th>
                      <th className="w-64 px-4 py-2">Reason</th>
                      <th className="w-20 px-4 py-2">Days</th>
                      <th className="w-36 px-4 py-2">Start</th>
                      <th className="w-36 px-4 py-2">End</th>
                      <th className="w-24 px-4 py-2">Status</th>
                      <th className="w-32 px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No {statusFilter} leaves found
                        </td>
                      </tr>
                    ) : (
                      leaves.map((leave, index) => (
                        <tr key={leave._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </td>
                          <td className="px-4 py-2">
                            {leave.employee?.user?.profile?.firstName && leave.employee?.user?.profile?.lastName
                              ? `${leave.employee.user.profile.firstName} ${leave.employee.user.profile.lastName || ""}`
                              : "—"}
                          </td>
                          <td className="px-4 py-2 capitalize">{leave.leaveType}</td>
                          <td className="px-4 py-2">
                            <div className="truncate" title={leave.reason}>
                              {leave.reason}
                            </div>
                          </td>
                          <td className="px-4 py-2">{leave.days}</td>
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

                    <p>
                      <strong>Type:</strong> {selectedLeave.leaveType}
                    </p>
                    
                    <p>
                      <strong>Reason:</strong> {selectedLeave.reason}
                    </p>
                    
                    <p>
                      <strong>Days:</strong> {selectedLeave.days}
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