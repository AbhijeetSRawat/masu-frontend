import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading, setReduxShifts } from "../slices/shiftSlice";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import { shiftEndpoints, companyEndpoints } from "../services/api";
import { setReduxManagers } from "../slices/manager";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { GET_ALL_SHIFTS } = shiftEndpoints;
const { GET_ALL_MANAGER, EDIT_HR } = companyEndpoints;

const AddManager = () => {
  const dispatch = useDispatch();
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.shifts.loading);
  const shiftsData = useSelector((state) => state.shifts.reduxShifts);

  const [shifts, setShifts] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  const role = useSelector(state => state.auth.role);
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions);

  const [managerForm, setManagerForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    employeeId: "",
    designation: "",
    joiningDate: "",
    employmentType: "full-time",
    salary: {
      base: "",
      bonus: "",
      taxDeductions: "",
    },
    skills: [""],
    documents: [],
    shiftId: "",
    customFields: [], // Each item: { label: "", name: "" }
  });

  const resetManagerForm = () => {
    setManagerForm({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      employeeId: "",
      designation: "",
      joiningDate: "",
      employmentType: "full-time",
      salary: { base: "", bonus: "", taxDeductions: "" },
      skills: [""],
      documents: [],
      shiftId: "",
      customFields: [],
    });
  };

  const getAllShifts = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", GET_ALL_SHIFTS + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      setShifts(response.data.data);
      dispatch(setReduxShifts(response.data.data));
      toast.success("Shifts fetched successfully");
    } catch (err) {
      toast.error("Failed to fetch shifts");
      console.log(err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getAllManagers = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_ALL_MANAGER + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      setManagers(res.data.data);
      console.log(res.data.data);
      dispatch(setReduxManagers(res.data.data));
      toast.success("Managers fetched successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch managers");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEditOpen = (manager) => {
    setSelectedManager(manager);
    setManagerForm({
      email: manager.user.email,
      firstName: manager.user.profile.firstName,
      lastName: manager.user.profile.lastName,
      phone: manager.user.profile.phone,
      employeeId: manager.employmentDetails.employeeId,
      designation: manager.employmentDetails.designation,
      joiningDate: manager.employmentDetails.joiningDate.slice(0, 10),
      employmentType: manager.employmentDetails.employmentType,
      salary: {
        base: manager.employmentDetails.salary.base,
        bonus: manager.employmentDetails.salary.bonus,
        taxDeductions: manager.employmentDetails.salary.taxDeductions,
      },
      skills: manager.employmentDetails?.skills,
      documents: manager.documents || [],
      shiftId: manager.employmentDetails?.shift?._id,
      customFields: manager.user.customFields || []
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      dispatch(setLoading(true));
      const payload = { ...managerForm, companyId: company._id };
      console.log("payload of edit manager is ", payload);
      
      const editData = await apiConnector(
        "PUT",
        `${EDIT_HR}${selectedManager._id}`,
        payload,
        {
          Authorization : `Bearer ${token}`,
        }
      );
      console.log(editData);
      toast.success("Manager updated successfully");

      resetManagerForm();
      setIsEditModalOpen(false);
      getAllManagers();
    } catch (err) {
      toast.error("Update failed");
      console.log(err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const removeCustomField = (index) => {
    const newFields = managerForm.customFields.filter((_, i) => i !== index);
    setManagerForm((prev) => ({
      ...prev,
      customFields: newFields,
    }));
  };

  useEffect(() => {
    if (shiftsData) {
      setShifts(shiftsData);
      dispatch(setReduxShifts(shiftsData));
    } else {
      getAllShifts();
    }

    getAllManagers();
  }, []);

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
            : (role === 'admin' ? <AdminHeader /> : <SubAdminHeader />)
        }

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Page Title */}
            <div className="ml-[31vw] text-3xl font-semibold px-6 my-4">
              Managers
            </div>

            {/* Manager Table */}
            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full border border-gray-300 text-left mb-4">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2">Employee Id</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Company</th>
                    <th className="px-4 py-2">Shift</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Designation</th>
                    <th className="px-4 py-2">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m._id} className="border-t border-gray-300">
                      <td className="px-4 py-2">
                        {m?.employmentDetails?.employeeId}
                      </td>
                      <td className="px-4 py-2">
                        {m.user?.profile?.firstName} {m.user?.profile?.lastName}
                      </td>
                      <td className="px-4 py-2">{m.user?.email}</td>
                      <td className="px-4 py-2">{company?.name}</td>
                      <td className="px-4 py-2">
                        {m.employmentDetails?.shift?.name}
                      </td>
                      <td className="px-4 py-2">{m.user?.role}</td>
                      <td className="px-4 py-2">
                        {m.employmentDetails?.department?.name || "Not Given"}
                      </td>
                      <td className="px-4 py-2">
                        {m.employmentDetails?.designation}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEditOpen(m)}
                          className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">
              Edit Manager
            </h3>
            
            <form className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Employee ID"
                      value={managerForm.employeeId}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          employeeId: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter First Name"
                      value={managerForm.firstName}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Last Name"
                      value={managerForm.lastName}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter Email Address"
                      value={managerForm.email}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter Phone Number"
                      value={managerForm.phone}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Designation"
                      value={managerForm.designation}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          designation: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  Employment Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={managerForm.joiningDate}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          joiningDate: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={managerForm.employmentType}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          employmentType: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Shift
                    </label>
                    <select
                      value={managerForm.shiftId}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          shiftId: e.target.value,
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Shift</option>
                      {shifts.map((shift) => (
                        <option key={shift._id} value={shift._id}>
                          {shift.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary Information Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  Salary Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Salary
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Base Salary"
                      value={managerForm.salary.base}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, base: +e.target.value },
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bonus
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Bonus Amount"
                      value={managerForm.salary.bonus}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, bonus: +e.target.value },
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Deductions
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Tax Deductions"
                      value={managerForm.salary.taxDeductions}
                      onChange={(e) =>
                        setManagerForm((prev) => ({
                          ...prev,
                          salary: { ...prev.salary, taxDeductions: +e.target.value },
                        }))
                      }
                      className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  Skills & Expertise
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Project Management, Leadership, Excel"
                    value={
                      Array.isArray(managerForm.skills)
                        ? managerForm.skills.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setManagerForm((prev) => ({
                        ...prev,
                        skills: e.target.value.split(",").map((s) => s.trim()),
                      }))
                    }
                    className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Custom Fields Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  Custom Fields
                </h4>
                <div className="space-y-3">
                  {managerForm?.customFields?.map((field, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Label
                        </label>
                        <input
                          type="text"
                          placeholder="Enter field label"
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [...managerForm.customFields];
                            newFields[index].label = e.target.value;
                            setManagerForm((prev) => ({
                              ...prev,
                              customFields: newFields,
                            }));
                          }}
                          className="input-field w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Value
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter field value"
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...managerForm.customFields];
                              newFields[index].name = e.target.value;
                              setManagerForm((prev) => ({
                                ...prev,
                                customFields: newFields,
                              }));
                            }}
                            className="input-field flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() =>
                      setManagerForm((prev) => ({
                        ...prev,
                        customFields: [
                          ...(prev?.customFields || []),
                          { label: "", name: "" },
                        ],
                      }))
                    }
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Add Custom Field
                  </button>
                </div>
              </div>
            </form>

            {/* Modal Actions */}
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedManager(null);
                  resetManagerForm();
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="loader1"></div>
                ) : (
                  <>Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddManager;