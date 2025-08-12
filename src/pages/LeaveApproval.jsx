import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";

import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import Papa from "papaparse";
import { apiConnector } from "../services/apiConnector";

import { useNavigate } from "react-router-dom";
import { leaveEndpoints } from "../services/api";

const { GET_COMPANY_LEAVES, UPDATE_LEAVE_STATUS } = leaveEndpoints;

const LeaveApproval = () => {
  const company = useSelector((state) => state.permissions.company);
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const dispatch = useDispatch();
  

  const loading = useSelector((state) => state.permissions.loading);

  const getCompanyLeaves = async () => {
    try {
      setLoading(true);

      const result = await apiConnector(
        "GET",
        GET_COMPANY_LEAVES + company._id
      );
      setLeaves(result.data.data.leaves || []);
      console.log(result);
      toast.success("All leaves have been fetched successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Unable to fetch leaves!");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = async (leaveId, status) => {
    try {
      dispatch(setLoading(true));
      await apiConnector("PATCH", UPDATE_LEAVE_STATUS + leaveId, {
        status,
        rejectionReason: rejectionReasonInput,
      });
      toast.success(`Leave ${status}`);
      getCompanyLeaves();
      setIsViewModalOpen(false);
      setShowRejectionInput(false);
    } catch (err) {
      toast.error("Action failed");
      console.error(err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    getCompanyLeaves();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <div className="w-full flex justify-center items-center px-6 lg:px-0 py-6 lg:py-0 min-h-[8vh] text-3xl text-white bg-gray-600 font-semibold">
        <img src={company.thumbnail} alt="logo" className="h-[6vh] mr-2"/>  Admin Panel ({company?.name})
        </div>

        {loading ? (
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto px-6 mt-4">
              <div className="flex gap-3 px-6 mt-4">
                {["pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
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

              <table className="min-w-full table-fixed border mt-5 text-sm text-left">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="w-12 px-4 py-2">Sr.</th>
                    <th className="w-24 px-4 py-2">Employee</th>
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
                  {leaves
                    .filter((leave) => leave.status === statusFilter)
                    .map((leave, index) => (
                      <tr key={leave._id} className="border-t">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">
                          {leave.employee?.profile?.firstName +
                            " " +
                            leave.employee?.profile?.lastName || "—"}
                        </td>
                        <td className="px-4 py-2 capitalize">{leave.type}</td>
                        <td className="px-4 py-2 truncate">{leave.reason}</td>
                        <td className="px-4 py-2">{leave.days}</td>
                        <td className="px-4 py-2">
                          {new Date(leave.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td
                          className={`px-4 py-2 capitalize font-medium ${
                            leave.status === "pending"
                              ? "text-yellow-600"
                              : leave.status === "approved"
                              ? "text-green-700"
                              : leave.status === "rejected"
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {leave.status}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleView(leave)}
                            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {isViewModalOpen && selectedLeave && (
              <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Leave Details</h2>
                  <p>
                    <strong>Employee:</strong>{" "}
                    {selectedLeave.employee?.profile?.firstName}{" "}
                    {selectedLeave.employee?.profile?.lastName}
                  </p>

                  <p>
                    <strong>Ph. No.:</strong>{" "}
                    {selectedLeave.employee?.profile?.phone}
                  </p>

                  <p>
                    <strong>Email:</strong> {selectedLeave.employee?.email}
                  </p>

                  <p>
                    <strong className="mr-2">Type:</strong> {selectedLeave.type}
                  </p>
                  <p>
                    <strong className="mr-2">Reason:</strong>{" "}
                    {selectedLeave.reason}
                  </p>
                  <p>
                    <strong className="mr-2">Days:</strong> {selectedLeave.days}
                  </p>
                  <p>
                    <strong className="mr-2">From:</strong>{" "}
                    {new Date(selectedLeave.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong className="mr-2">To:</strong>{" "}
                    {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong className="mr-2">Status:</strong>{" "}
                    {selectedLeave.status}
                  </p>
                  {selectedLeave.rejectionReason && (
                    <p>
                      <strong className="mr-2">Rejection Reason:</strong>{" "}
                      {selectedLeave.rejectionReason}
                    </p>
                  )}
                  <div className="flex justify-end mt-6 gap-3">
                    {!showRejectionInput && (
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Close
                      </button>
                    )}
                    {selectedLeave.status === "pending" && (
                      <>
                        {!showRejectionInput && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(selectedLeave._id, "approved")
                            }
                            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
                          >
                            Approve
                          </button>
                        )}

                        {!showRejectionInput ? (
                          <button
                            onClick={() => setShowRejectionInput(true)}
                            className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                          >
                            Reject
                          </button>
                        ) : (
                          <div className="flex flex-col items-end w-full gap-2">
                            <textarea
                              placeholder="Reason for rejection"
                              value={rejectionReasonInput}
                              onChange={(e) =>
                                setRejectionReasonInput(e.target.value)
                              }
                              className="w-full border px-3 py-2 rounded"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowRejectionInput(false)}
                                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(
                                    selectedLeave._id,
                                    "rejected",
                                    rejectionReasonInput
                                  )
                                }
                                disabled={!rejectionReasonInput.trim()}
                                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50"
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
