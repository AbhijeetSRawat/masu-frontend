import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { reimbursementsEndpoints } from "../services/api";
import toast from "react-hot-toast";

const { GET_COMPANY_REIMBURSEMENTS, UPDATE_REIMBURSEMENTS_STATUS } = reimbursementsEndpoints;

const ReimbursementReport = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const [reimbursements, setReimbursements] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);

  const getCompanyReimbursements = async () => {
    try {
      dispatch(setLoading(true));

      console.log("reimbursement token is : ",token)

      const result = await apiConnector("GET", `${GET_COMPANY_REIMBURSEMENTS}${company._id}`, null, {
        Authorization: `Bearer ${token}`,
      });
      setReimbursements(result.data.data || []);
      console.log(result)
      toast.success("Reimbursements fetched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch reimbursements!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const response = await apiConnector(
        "PUT",
        `${UPDATE_REIMBURSEMENTS_STATUS}${selectedReimbursement._id}/status`,
        { status: newStatus },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      console.log(response)
      toast.success(`Status updated to ${newStatus}`);
      getCompanyReimbursements();
      setIsViewModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    getCompanyReimbursements();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw] pb-10">
        <div className="w-full flex justify-center items-center px-6 py-6 text-3xl text-white bg-gray-600 font-semibold">
        <img src={company.thumbnail} alt="logo" className="h-[6vh] mr-2"/>  Admin Panel ({company?.name})
        </div>

        <div className="flex flex-wrap gap-3 px-6 mt-6">
          {["All", "Pending", "Approved", "Paid", "Rejected"].map((status) => (
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

        {loading ? (
          <div className="flex justify-center items-center h-[70vh]">
            <div className="spinner" />
          </div>
        ) : (
          <div className="overflow-x-auto px-6 mt-6">
            <table className="min-w-full border border-gray-300 text-left shadow-md">
              <thead className="bg-blue-800 text-white">
                <tr>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {reimbursements
                  .filter((item) => (selectedStatus ? item.status === selectedStatus : true))
                  .map((item, index) => (
                    <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">{item.category?.name}</td>
                      <td className="px-4 py-2">
                        {item.employee?.user?.profile?.firstName} {item.employee?.user?.profile?.lastName}
                      </td>
                      <td className="px-4 py-2">₹{item.amount}</td>
                      <td className="px-4 py-2 capitalize">{item.status}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-700 text-white px-3 py-1 rounded"
                          onClick={() => {
                            setSelectedReimbursement(item);
                            setIsViewModalOpen(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {isViewModalOpen && selectedReimbursement && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md shadow-lg">
              <h2 className="text-xl font-bold mb-4">Reimbursement Details</h2>
              <ul className="text-sm space-y-2 mb-4">
                <li><strong>Category:</strong> {selectedReimbursement.category?.name}</li>
                <li><strong>Employee:</strong> {selectedReimbursement.employee?.user?.profile?.firstName} {selectedReimbursement.employee?.user?.lastName}</li>
                <li><strong>Amount:</strong> ₹{selectedReimbursement.amount}</li>
                <li><strong>Status:</strong> {selectedReimbursement.status}</li>
                <li><strong>Description:</strong> {selectedReimbursement.description}</li>
                {selectedReimbursement.receiptUrl && (
                  <li>
                    <strong>Receipt:</strong>{" "}
                    <a href={selectedReimbursement.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      View Receipt
                    </a>
                  </li>
                )}
              </ul>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>

                {selectedReimbursement.status === "pending" && (
                  <>
                    <button
                      className="px-4 py-2 bg-green-700 text-white rounded"
                      onClick={() => updateStatus("approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-4 py-2 bg-red-700 text-white rounded"
                      onClick={() => updateStatus("rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedReimbursement.status === "approved" && (
                  <button
                    className="px-4 py-2 bg-indigo-800 text-white rounded"
                    onClick={() => updateStatus("paid")}
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReimbursementReport;
