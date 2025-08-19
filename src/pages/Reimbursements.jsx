import React, { useEffect, useState } from "react";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { useDispatch, useSelector } from "react-redux";
import {
  reimbursementCategoryEndpoints,
  reimbursementsEndpoints,
} from "../services/api";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import EmployeeHeader from "../components/EmployeeHeader";

const { CREATE_REIMBURSEMENT, GET_EMPLOYEE_REIMBURSEMENTS } =
  reimbursementsEndpoints;

const { GET_ALL_CATEGORY } = reimbursementCategoryEndpoints;

const Reimbursements = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReimbursement, setNewReimbursement] = useState({
    category: "",
    amount: "",
    description: "",
    date: "",
    receipt: null,
  });

  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [reimbursementcategory, setReimbursementCategory] = useState([]);

  const [reimbursements, setReimbursements] = useState([]);
  //const [isEditMode, setIsEditMode] = useState(false);

  const dispatch = useDispatch();

  const addReimbursement = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("employeeId", employee._id);
    form.append("companyId", company._id);
    form.append("category", newReimbursement.category);
    form.append("amount", newReimbursement.amount);
    form.append("description", newReimbursement.description);
    form.append("date", newReimbursement.date);
    if (newReimbursement.receipt) {
      form.append("recipt", newReimbursement.receipt);
    }

    try {
      dispatch(setLoading(true));
      console.log("token is => ", token);
      console.log("employee", employee);
      const response = await apiConnector("POST", CREATE_REIMBURSEMENT, form, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      console.log("response from backend is : ", response);
      toast.success("Reimbursement submitted successfully!");
      getEmployeeReimbursements();
      setIsAddModalOpen(false);
      setNewReimbursement({
        category: "",
        amount: "",
        description: "",
        date: "",
        receipt: null,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit reimbursement.");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getEmployeeReimbursements = async () => {
    try {
      setLoading(true);
      console.log("this is employee id : ", employee);
      const result = await apiConnector(
        "GET",
        GET_EMPLOYEE_REIMBURSEMENTS + employee._id,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setReimbursements(result.data.data);
      console.log(result.data.data);
      toast.success("All reimbursements fetched successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Unable to fetch your reimbursements!");
    } finally {
      setLoading(false);
    }
  };

  const getReimbursementCategory = async () => {
    try {
      dispatch(setLoading(true));
      const result = await apiConnector(
        "GET",
        `${GET_ALL_CATEGORY}${company._id}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      setReimbursementCategory(result.data.data || []);
      console.log(result);
      toast.success("Reimbursement Categories fetched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch reimbursement category!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getEmployeeReimbursements();
    getReimbursementCategory();
  }, []);

  return (
    <div className="relative">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw] pr-4 pb-10">
         {/* Employee panel bar */}
      <EmployeeHeader/>
        <h2 className="text-3xl mt-4 font-semibold mb-6 text-center">
          Reimbursements List
        </h2>

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="ml-4 px-4 py-2 mb-4 bg-blue-900 text-white rounded hover:bg-blue-800"
            >
              + Add Reimbursement
            </button>
            <div className="overflow-x-auto pl-2">
              <table className="min-w-full border border-gray-300 text-left ">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursements?.map((item, index) => (
                    <tr key={index} className="border-t border-gray-300">
                      <td className="px-4 py-2">{item?.category?.name}</td>
                      <td className="px-4 py-2">₹{item.amount}</td>
                      <td className="px-4 py-2">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 capitalize">{item.status}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setSelectedReimbursement(item);
                            setIsViewModalOpen(true);
                          }}
                          className="text-sm bg-blue-700 text-white px-3 py-1 rounded"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isViewModalOpen && selectedReimbursement && (
              <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-white rounded p-6 max-w-lg w-full">
                  <h3 className="text-xl font-bold mb-4">
                    Reimbursement Details
                  </h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <strong>Category:</strong>{" "}
                      {selectedReimbursement.category?.name}
                    </li>
                    <li>
                      <strong>Amount:</strong> ₹{selectedReimbursement.amount}
                    </li>
                    <li>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        selectedReimbursement.date
                      ).toLocaleDateString()}
                    </li>
                    <li>
                      <strong>Description:</strong>{" "}
                      {selectedReimbursement.description || "—"}
                    </li>
                    <li>
                      <strong>Status:</strong> {selectedReimbursement.status}
                    </li>
                    {selectedReimbursement.receiptUrl && (
                      <li>
                        <strong>Receipt:</strong>{" "}
                        {selectedReimbursement.receiptUrl.endsWith(".pdf") ? (
                          <iframe
                            src={selectedReimbursement.receiptUrl}
                            width="100%"
                            height="600px"
                            className="mt-2 border rounded"
                            title="Receipt PDF"
                          ></iframe>
                        ) : (
                          <img
                            src={selectedReimbursement.receiptUrl}
                            alt="Receipt"
                            className="mt-2 max-w-full h-auto rounded border"
                          />
                        )}
                      </li>
                    )}
                  </ul>
                  <div className="mt-4 text-right">
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

            {isAddModalOpen && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-[90vw] max-w-md shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Add Reimbursement</h3>

                  <form
                    onSubmit={addReimbursement}
                    className="space-y-4 text-sm"
                  >
                    {/* Category Dropdown */}
                    <div>
                      <label className="font-medium">Category</label>
                      <select
                        value={newReimbursement.category}
                        onChange={(e) =>
                          setNewReimbursement((prev) => ({
                            ...prev,
                            category: e.target.value, // stores the ObjectId
                          }))
                        }
                        className="input-field"
                      >
                        <option value="">Select category</option>
                        {reimbursementcategory.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Other Fields */}
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newReimbursement.amount}
                      onChange={(e) =>
                        setNewReimbursement((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    />

                    <textarea
                      placeholder="Description"
                      value={newReimbursement.description}
                      onChange={(e) =>
                        setNewReimbursement((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="input-field"
                      rows={3}
                    />

                    <input
                      type="date"
                      value={newReimbursement.date}
                      onChange={(e) =>
                        setNewReimbursement((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    />

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        setNewReimbursement((prev) => ({
                          ...prev,
                          receipt: e.target.files[0],
                        }))
                      }
                      className="input-field"
                    />

                    {/* Actions */}
                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reimbursements;
