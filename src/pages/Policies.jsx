import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { policiesEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";

const { ADD_POLICY, GET_POLICIES, UPDATE_POLICY, DELETE_POLICY } = policiesEndpoints;

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

  const token = useSelector(state => state.auth.token)

  const getAllPolicy = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_POLICIES + company._id, null, {
        "Authorization": `Bearer ${token}`
      });
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
      // Validate required fields
      if (!policyForm.name.trim()) {
        toast.error("Policy name is required!");
        return;
      }
      if (!policyForm.description.trim()) {
        toast.error("Policy description is required!");
        return;
      }
      if (isAddModalOpen && !policyForm.file) {
        toast.error("Policy file is required!");
        return;
      }

      dispatch(setLoading(true));
      const formData = new FormData();
      formData.append("companyId", company._id);
      formData.append("title", policyForm.name);
      formData.append("description", policyForm.description);
      if (policyForm.file) formData.append("policyFile", policyForm.file);

      if (isAddModalOpen) {
        await apiConnector("POST", ADD_POLICY, formData, {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        });
        toast.success("Policy added successfully!");
      } else {
        await apiConnector(
          "PUT",
          UPDATE_POLICY + selectedPolicy._id,
          formData,
          {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
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

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
      return;
    }

    try {
      dispatch(setLoading(true));
      await apiConnector("DELETE", DELETE_POLICY + policyId, null, {
        "Authorization": `Bearer ${token}`
      });
      toast.success("Policy deleted successfully!");
      getAllPolicy();
    } catch (error) {
      toast.error("Failed to delete policy!");
      console.log(error);
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

  const getFileName = (url) => {
    if (!url) return "No file";
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0] || "Policy Document";
  };

  const resetForm = () => {
    setPolicyForm({ name: "", description: "", file: null });
    setSelectedPolicy(null);
  };

  useEffect(() => {
    if (company?._id) {
      getAllPolicy();
    }
  }, [company]);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <AdminHeader />

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Company Policies</h2>
                  <p className="text-gray-600 mt-1">Manage your company policies and documents</p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">+</span>
                  Add Policy
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="px-6 mt-6">
              {policies?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-lg mb-2">No policies found</div>
                  <p className="text-gray-400 mb-4">Start by adding your first company policy</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setIsAddModalOpen(true);
                    }}
                    className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                  >
                    Add First Policy
                  </button>
                </div>
              ) : (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <table className="min-w-full table-fixed text-sm">
                    <thead className="bg-blue-900 text-white">
                      <tr>
                        <th className="w-1/4 px-6 py-4 text-left font-semibold">Policy Name</th>
                        <th className="w-1/2 px-6 py-4 text-left font-semibold">Description</th>
                        <th className="w-1/6 px-6 py-4 text-center font-semibold">Document</th>
                        <th className="w-1/4 px-6 py-4 text-center font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {policies?.map((policy, index) => (
                        <tr key={policy._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{policy.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Created: {new Date(policy.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-600">
                              {policy.description?.length > 100 
                                ? `${policy.description.substring(0, 100)}...` 
                                : policy.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {policy.documentUrl ? (
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold
                                  ${policy.mimeType === 'application/pdf' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                  {policy.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Available</div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">No file</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleViewPolicy(policy)}
                                className="bg-gray-600 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700 transition-colors"
                                title="View Policy"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditPolicy(policy)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors"
                                title="Edit Policy"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(policy._id)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 transition-colors"
                                title="Delete Policy"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Shared Modal: Add/Edit */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-800">
                  {isAddModalOpen ? "Add New Policy" : "Edit Policy"}
                </h2>
                
                {/* Policy Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter policy name"
                    value={policyForm.name}
                    onChange={(e) =>
                      setPolicyForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Enter policy description"
                    value={policyForm.description}
                    onChange={(e) =>
                      setPolicyForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Current File (only in edit mode) */}
                {isEditModalOpen && selectedPolicy?.documentUrl && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Document
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold
                            ${selectedPolicy.mimeType === 'application/pdf' ? 'bg-red-500' : 'bg-blue-500'}`}>
                            {selectedPolicy.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {getFileName(selectedPolicy.documentUrl)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {selectedPolicy.mimeType === 'application/pdf' ? 'PDF Document' : 'Image File'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(selectedPolicy.documentUrl, '_blank')}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEditModalOpen ? 'Update Document (Optional)' : 'Policy Document'} 
                    {isAddModalOpen && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          file: e.target.files[0],
                        }))
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, JPG, PNG, GIF. Max size: 10MB
                    {isEditModalOpen && <br />}
                    {isEditModalOpen && "Leave empty to keep current document"}
                  </p>
                  
                  {/* Selected File Preview */}
                  {policyForm.file && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-semibold">
                          NEW
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-800">
                            {policyForm.file.name}
                          </div>
                          <div className="text-xs text-green-600">
                            {(policyForm.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOrUpdate}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Saving...' : (isAddModalOpen ? "Add Policy" : "Save Changes")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedPolicy && (
          <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      {selectedPolicy.title}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Created: {new Date(selectedPolicy.createdAt).toLocaleDateString()} | 
                      Last Updated: {new Date(selectedPolicy.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedPolicy.description}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Policy Document</h3>
                  {selectedPolicy.documentUrl ? (
                    selectedPolicy.mimeType === "application/pdf" ? (
                      <div className="border rounded-lg overflow-hidden">
                        <embed
                          src={selectedPolicy.documentUrl}
                          type="application/pdf"
                          width="100%"
                          height="600px"
                          className="rounded"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <img
                          src={selectedPolicy.documentUrl}
                          alt="Policy Document"
                          className="max-h-[600px] max-w-full mx-auto object-contain rounded-lg border shadow-lg"
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-lg">No document available</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleEditPolicy(selectedPolicy);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Policy
                    </button>
                    {selectedPolicy.documentUrl && (
                      <button
                        onClick={() => window.open(selectedPolicy.documentUrl, '_blank')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Open Document
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Policies;