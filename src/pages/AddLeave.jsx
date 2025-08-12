import React, { useEffect, useState } from "react";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { useDispatch, useSelector } from "react-redux";
import { leaveEndpoints } from "../services/api";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";

const { APPLY_LEAVE,UPDATE_LEAVE, GET_LEAVE, GET_EMPLOYEE_LEAVES } = leaveEndpoints;

const AddLeave = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const employee = useSelector((state) => state.employees.reduxEmployee);

   const company = useSelector((state) => state.permissions.company);

  const [leaves, setLeaves] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();

  const getEmployeeLeaves = async () => {
    try {
      setLoading(true);
      console.log("this is employee id : ", employee);
      const result = await apiConnector(
        "GET",
        GET_EMPLOYEE_LEAVES + employee.user._id
      );
      setLeaves(result.data.data.leaves);
      console.log(result);
      toast.success("Leaves fetched successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Unable to fetch leaves!");
    } finally {
      setLoading(false);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    type: "casual",
    startDate: "",
    endDate: "",
    days: "",
    reason: "",
  });

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setIsViewModalOpen(true);
  };

  const handleAddLeave = async () => {
    try {
      dispatch(setLoading(true));
      const payload = {
        employeeId: employee.user._id,
        companyId: employee.company,
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        days: leaveForm.days,
        reason: leaveForm.reason,
      };

      if (isEditMode && leaveForm.id) {
        await apiConnector("PUT", `${UPDATE_LEAVE}${leaveForm.id}`, payload); //here need to be changed afte i get a proper api from backend for this.
        toast.success("Leave updated successfully!");
      } else {
        await apiConnector("POST", APPLY_LEAVE, payload);
        toast.success("Leave applied successfully!");
      }

      getEmployeeLeaves();
      setLeaveForm({
        type: "casual",
        startDate: "",
        endDate: "",
        days: "",
        reason: "",
      });
      setIsAddModalOpen(false);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit leave");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getEmployeeLeaves();
  }, []);

  return (
    <div className="relative">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw] pr-4 pb-10">
        <div className="w-[100vw] flex justify-center  z-0 top-0 left-9 items-center px-6 lg:px-0 py-6 lg:py-0 min-h-[8vh] text-3xl text-white bg-gray-600 font-semibold lg:w-[80vw]">
          <img src={company.thumbnail} alt="logo" className="h-[6vh] mr-2"/> Employee Panel ({employee.user.profile.firstName})
        </div>
        <h2 className="text-3xl mt-4 font-semibold mb-6 text-center">
          Leave List
        </h2>

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="overflow-x-auto pl-4">
            <div className="flex justify-between items-center px-4 mb-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Leave
              </button>
            </div>

            <table className="min-w-full table-fixed border text-sm text-left">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="w-12 px-4 py-2">Sr.</th>
                  <th className="w-24 px-4 py-2">Type</th>
                  <th className="w-64 px-4 py-2">Reason</th>
                  <th className="w-24 px-4 py-2">Days</th>
                  <th className="w-36 px-4 py-2">Start Date</th>
                  <th className="w-36 px-4 py-2">End Date</th>
                  <th className="w-28 px-4 py-2">Status</th>
                  <th className="w-32 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave, index) => (
                  <tr key={leave._id} className="border-t">
                    <td className="px-4 py-2">{index + 1}</td>
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
                    <td className="px-4 py-2 ">
                      <button
                        onClick={() => handleView(leave)}
                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                      >
                        View Details
                      </button>

                      {leave.status === "pending" && (
                        <button
                          onClick={() => {
                            setLeaveForm({
                              type: leave.type,
                              startDate: leave.startDate.split("T")[0],
                              endDate: leave.endDate.split("T")[0],
                              days: leave.days,
                              reason: leave.reason,
                              id: leave._id,
                            });
                            setIsEditMode(true);
                            setIsAddModalOpen(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 mt-2 rounded hover:bg-blue-700"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isAddModalOpen && (
              <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
                  <h2 className="text-xl font-semibold mb-4">
                    {isEditMode ? "Update Leave" : "Apply for Leave"}
                  </h2>

                  <select
                    value={leaveForm.type}
                    onChange={(e) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="input-field mb-3"
                  >
                    {[
                      "casual",
                      "sick",
                      "earned",
                      "maternity",
                      "paternity",
                      "unpaid",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="input-field mb-3"
                  />
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="input-field mb-3"
                  />
                  <input
                    type="number"
                    placeholder="No. of days"
                    value={leaveForm.days}
                    onChange={(e) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        days: +e.target.value,
                      }))
                    }
                    className="input-field mb-3"
                  />
                  <textarea
                    placeholder="Reason for leave"
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="input-field mb-4"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditMode(false);
                        setLeaveForm({
                          type: "casual",
                          startDate: "",
                          endDate: "",
                          days: "",
                          reason: "",
                        });
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddLeave}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      {isEditMode ? "Update" : "Apply"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isViewModalOpen && selectedLeave && (
              <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Leave Details</h2>
                  <p>
                    <strong>Type:</strong> {selectedLeave.type}
                  </p>
                  <p>
                    <strong>Reason:</strong> {selectedLeave.reason}
                  </p>
                  <p>
                    <strong>Days:</strong> {selectedLeave.days}
                  </p>
                  <p>
                    <strong>Start:</strong>{" "}
                    {new Date(selectedLeave.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>End:</strong>{" "}
                    {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedLeave.status}
                  </p>
                  {selectedLeave.rejectionReason && (
                    <p>
                      <strong>Rejection Reason:</strong>{" "}
                      {selectedLeave.rejectionReason}
                    </p>
                  )}
                  {selectedLeave.approvedAt && (
                    <p>
                      <strong>Approved At:</strong>{" "}
                      {new Date(selectedLeave.approvedAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddLeave;
