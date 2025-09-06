import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/shiftSlice";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import { subadminEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import { useNavigate } from "react-router-dom";
import { setCompany, setPermissions, setSubAdminPermissions } from "../slices/companyPermission";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { createSubAdmin, getSubAdmins, updateUserPermissions } = subadminEndpoints;

const AddSubAdmin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.shifts.loading);
  const token = useSelector (state => state.auth.token)

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)
  
  // Get available permissions from Redux (company permissions)
  const availablePermissions = useSelector((state) => state.permissions.permissions);

  const [subAdmins, setSubAdmins] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
  const [givenPermissions, setGivenPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Create SubAdmin Form State
  const [subAdminForm, setSubAdminForm] = useState({
    email: "",
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
      
    },
    permissions: [],
  });

  // Get all subadmins for this company
  const getAllSubAdmins = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", `${getSubAdmins}${company._id}`,null,{
        "Authorization" : `Bearer ${token}`
      });
      console.log("SubAdmins response:", response);
      
      // Filter users with role 'subadmin'
      const subadminUsers = response.data?.subadmins;
      setSubAdmins(subadminUsers);
      toast.success("SubAdmins fetched successfully!");
    } catch (err) {
      console.error("Error fetching subadmins:", err);
      toast.error("Failed to fetch subadmins");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Create new subadmin
  const handleCreateSubAdmin = async () => {
    try {
      dispatch(setLoading(true));
      const payload = {
        email: subAdminForm.email,
        companyId: company._id,
        permissions: subAdminForm.permissions,
        profile: subAdminForm.profile,
      };

      const response = await apiConnector("POST", createSubAdmin, payload, {
        "Authorization" : `Bearer ${token}`
      });
      console.log("Create response:", response);
      
      toast.success(`SubAdmin created successfully! Password: ${response.data.generatedPassword}`);
      setIsCreateModalOpen(false);
      resetSubAdminForm();
      getAllSubAdmins();
    } catch (err) {
      console.error("Error creating subadmin:", err);
      toast.error("Failed to create subadmin");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update subadmin permissions
  const handleUpdatePermissions = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("PUT", `${updateUserPermissions}${selectedSubAdmin._id}`, {
        permissions: givenPermissions,
      });
      
      toast.success("Permissions updated successfully!");
      setIsPermissionModalOpen(false);
      setSelectedSubAdmin(null);
      setGivenPermissions([]);
      getAllSubAdmins();
    } catch (err) {
      console.error("Error updating permissions:", err);
      toast.error("Failed to update permissions");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Login as subadmin
  const loginAsSubAdmin = (subadmin) => {
    try {
      // Set subadmin permissions and company data
      dispatch(setSubAdminPermissions(subadmin.permissions || []));
      dispatch(setCompany(company));
      
      // Navigate to admin panel with subadmin context
      navigate("/subadminpanel");
      toast.success(`Logged in as ${subadmin.profile?.firstName} ${subadmin.profile?.lastName}`);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to login as SubAdmin");
    }
  };

  // Reset form
  const resetSubAdminForm = () => {
    setSubAdminForm({
      email: "",
      profile: {
        firstName: "",
        lastName: "",
        phone: "",
        designation: "",
        department: "",
      },
      permissions: [],
    });
  };

  // Filter subadmins based on search
  const filteredSubAdmins = subAdmins?.filter(subadmin =>
    subadmin.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subadmin.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subadmin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (company?._id) {
      getAllSubAdmins();
    }

    dispatch(setSubAdminPermissions(null))

  }, [company]);

  return (
    <div className="flex">
      {
        (role === 'superadmin')
          ? (subAdminPermissions !== null ? <SubAdminSidebar /> : <AdminSidebar />)
          : (role === 'admin' ? <AdminSidebar /> : <SubAdminSidebar />)
      }

      
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        {
        (role === 'superadmin')
          ? (subAdminPermissions !== null ? <SubAdminHeader /> : <AdminHeader />)
          : (role === 'admin' ? <AdminHeader/> : <SubAdminHeader />)
      }

        
        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Header with Add Button */}
            <div className="flex justify-between items-center px-6 mt-4">
              <h2 className="text-3xl font-semibold">Sub Admin Management</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Sub Admin
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 mt-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* SubAdmins Table */}
            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full border border-gray-300 mb-3 text-left text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2">Sr.No.</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                 
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Total Permissions</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubAdmins?.length > 0 ? (
                    filteredSubAdmins.map((subadmin, index) => (
                      <tr key={subadmin._id} className="border-t border-gray-300">
                        <td className="px-4 py-2">{index + 1}</td>
                        <td className="px-4 py-2">
                          {subadmin.profile?.firstName} {subadmin.profile?.lastName}
                        </td>
                        <td className="px-4 py-2">
                          {subadmin.email?.length > 25 
                            ? `${subadmin.email.substr(0, 25)}...` 
                            : subadmin.email
                          }
                        </td>
                       
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            subadmin.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {subadmin.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 mr-[80px] rounded text-xs font-medium">
                            {subadmin.permissions?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                            onClick={() => {
                              setSelectedSubAdmin(subadmin);
                              setGivenPermissions(subadmin.permissions || []);
                              setIsPermissionModalOpen(true);
                            }}
                          >
                            Permissions
                          </button>
                          <button
                            className="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800 text-xs"
                            onClick={() => loginAsSubAdmin(subadmin)}
                          >
                            Login as SubAdmin
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        No sub admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Create SubAdmin Modal */}
            {isCreateModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Add New Sub Admin</h2>

                  <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {/* Basic Information */}
                    <div className="col-span-full">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={subAdminForm.email}
                        onChange={(e) =>
                          setSubAdminForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter first name"
                        value={subAdminForm.profile.firstName}
                        onChange={(e) =>
                          setSubAdminForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              firstName: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter last name"
                        value={subAdminForm.profile.lastName}
                        onChange={(e) =>
                          setSubAdminForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              lastName: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={subAdminForm.profile.phone}
                        onChange={(e) =>
                          setSubAdminForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    

                    {/* Permissions Section */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Assign Permissions
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded p-4">
                        {availablePermissions && availablePermissions.length > 0 ? (
                          availablePermissions.map((permission, index) => (
                            <label key={index} className="flex gap-2 items-center text-sm">
                              <input
                                type="checkbox"
                                value={permission}
                                checked={subAdminForm.permissions.includes(permission)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const value = e.target.value;
                                  if (checked) {
                                    setSubAdminForm((prev) => ({
                                      ...prev,
                                      permissions: [...prev.permissions, value],
                                    }));
                                  } else {
                                    setSubAdminForm((prev) => ({
                                      ...prev,
                                      permissions: prev.permissions.filter((p) => p !== value),
                                    }));
                                  }
                                }}
                                className="accent-blue-700"
                              />
                              {permission}
                            </label>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center col-span-full">
                            No permissions available from company
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {subAdminForm.permissions.length} permissions
                      </p>
                    </div>
                  </form>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        resetSubAdminForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSubAdmin}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
                      disabled={!subAdminForm.email || !subAdminForm.profile.firstName || !subAdminForm.profile.lastName}
                    >
                      {loading ? <div className="loader1"></div> : "Create Sub Admin"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Modal */}
            {isPermissionModalOpen && selectedSubAdmin && (
              <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
                <div className="bg-white w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold mb-4">
                    Manage Permissions for {selectedSubAdmin.profile?.firstName} {selectedSubAdmin.profile?.lastName}
                  </h3>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Company: <span className="font-medium">{company?.name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Available Permissions: <span className="font-medium">{availablePermissions?.length || 0}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Currently Assigned: <span className="font-medium">{givenPermissions.length}</span>
                    </p>
                  </div>

                  <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availablePermissions && availablePermissions.length > 0 ? (
                      availablePermissions.map((perm, index) => (
                        <label key={index} className="flex gap-2 items-center text-sm">
                          <input
                            type="checkbox"
                            value={perm}
                            checked={givenPermissions.includes(perm)}
                           className="accent-blue-700"
                          />
                          {perm}
                        </label>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center col-span-full">
                        No permissions available from company
                      </p>
                    )}
                  </form>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsPermissionModalOpen(false);
                        setSelectedSubAdmin(null);
                        setGivenPermissions([]);
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  
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

export default AddSubAdmin;
