import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { policiesEndpoints } from "../services/api";
import toast from "react-hot-toast";

const { ADD_POLICY, GET_POLICIES, UPDATE_POLICY } = policiesEndpoints;

const Policies = () => {
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.permissions.loading);
  const dispatch = useDispatch();

  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    name: "",
    description: "",
    file: null,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const getAllPolicy = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_POLICIES + company._id);
      console.log(res);
      setPolicies(res.data.data);
      toast.success("Policies fetched successfully!");
    } catch (error) {
      toast.error("Unable to fetch policies!");
      console.log(error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAddOrUpdate = async () => {
    try {
      dispatch(setLoading(true));
      const formData = new FormData();
      formData.append("companyId", company._id);
      formData.append("title", policyForm.name);
      formData.append("description", policyForm.description);
      if (policyForm.file) formData.append("policyFile", policyForm.file);

      if (isAddModalOpen) {
        await apiConnector("POST", ADD_POLICY, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Policy added successfully!");
      } else {
        await apiConnector(
          "PUT",
          UPDATE_POLICY + selectedPolicy._id,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        toast.success("Policy updated successfully!");
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setPolicyForm({ name: "", description: "", file: null });
      setSelectedPolicy(null);
      getAllPolicy();
    } catch (err) {
      toast.error("Save failed!");
      console.log(err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEditPolicy = (policy) => {
    setSelectedPolicy(policy);
    setPolicyForm({
      name: policy.title,
      description: policy.description,
      file: null,
    });
    setIsEditModalOpen(true);
  };

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    getAllPolicy();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <div className="w-full flex justify-center items-center px-6 py-6 bg-gray-600 text-3xl text-white font-semibold">
         <img src={company.thumbnail} alt="logo" className="h-[6vh] mr-2"/> Admin Panel ({company?.name})
        </div>

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Add Button */}
            <div className="flex justify-end px-6 mt-4">
              <button
                onClick={() => {
                  setIsAddModalOpen(true);
                  setPolicyForm({ name: "", description: "", file: null });
                  setSelectedPolicy(null);
                  setIsAddModalOpen(true);
                }}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Policy
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full table-fixed border text-sm text-left">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="w-1/4 px-6 py-3">Name</th>
                    <th className="w-1/2 px-6 py-3">Description</th>
                    <th className="w-1/4 px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policies?.map((p) => (
                    <tr key={p._id} className="border-t">
                      <td className="px-6 py-3">{p.title}</td>
                      <td className="px-6 py-3">
                        {p.description?.substring(0, 50)}...
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewPolicy(p)}
                            className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditPolicy(p)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Shared Modal: Add/Edit */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {isAddModalOpen ? "Add Policy" : "Edit Policy"}
              </h2>
              <input
                placeholder="Name"
                value={policyForm.name}
                onChange={(e) =>
                  setPolicyForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="input-field mb-3"
              />
              <textarea
                placeholder="Description"
                value={policyForm.description}
                onChange={(e) =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="input-field mb-3"
              />
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    file: e.target.files[0],
                  }))
                }
                className="mb-4"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedPolicy(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdate}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  {isAddModalOpen ? "Add Policy" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedPolicy && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-3xl">
              <h2 className="text-xl font-semibold mb-2">
                {selectedPolicy.title}
              </h2>
              <p className="mb-4">{selectedPolicy.description}</p>

             {selectedPolicy.documentUrl ? (
  selectedPolicy.mimeType === "application/pdf" ? (
    <embed
      src={selectedPolicy.documentUrl}
      type="application/pdf"
      width="100%"
      height="500px"
      className="border rounded"
    />
  ) : (
    <img
      src={selectedPolicy.documentUrl}
      alt="Policy"
      className="max-h-[500px] w-full object-contain rounded border"
    />
  )
) : (
  <p className="text-center text-gray-500">No document available.</p>
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
    </div>
  );
};

export default Policies;
