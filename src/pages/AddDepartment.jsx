import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { companyEndpoints, departmentEndpoints } from "../services/api";
import { setReduxManagers } from "../slices/manager";
import toast from "react-hot-toast";
import { setReduxDepartments } from "../slices/departments";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { GET_ALL_MANAGER } = companyEndpoints;
const { 
  ADD_DEPARTMENT, 
  UPDATE_DEPARTMENT, 
  GET_ALL_DEPARTMENTS,
  ASSIGN_HR_MANAGER,
  UPDATE_HR_MANAGER,
  UPDATE_HR_MANAGER_DETAILS,
  GET_HR_AND_MANAGER
} = departmentEndpoints;

const AddDepartment = () => {
  const dispatch = useDispatch();
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.permissions.loading);
  const role = useSelector(state => state.auth.role);
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions);

  const token = useSelector(state => state.auth.token)

  const [departments, setDepartments] = useState([]);
  
  // Modal states
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [isAssignHRModalOpen, setIsAssignHRModalOpen] = useState(false);
  const [isAssignManagerModalOpen, setIsAssignManagerModalOpen] = useState(false);
  const [isUpdateHRModalOpen, setIsUpdateHRModalOpen] = useState(false);
  const [isUpdateManagerModalOpen, setIsUpdateManagerModalOpen] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // Form states
  const [deptForm, setDeptForm] = useState({
    name: "",
    description: "",
  });

  const [hrManagerForm, setHrManagerForm] = useState({
    email: "",
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
    },
    personalDetails: {
      gender: "",
      dateOfBirth: "",
      city: "",
      state: "",
      panNo: "",
      aadharNo: "",
      uanNo: "",
      esicNo: "",
      bankAccountNo: "",
      ifscCode: "",
      personalEmail: "",
      officialMobile: "",
      personalMobile: "",
    },
    employmentDetails: {
      employeeId: "",
      designation: "",
      joiningDate: "",
      workLocation: "",
      employmentType: "full-time",
      salary: {
        base: "",
        bonus: "",
        taxDeductions: "",
      },
    },
    leaveBalance: {
      casual: 0,
      sick: 0,
      earned: 0,
    },
  });

  const resetDeptForm = () => {
    setDeptForm({
      name: "",
      description: "",
    });
    setSelectedDepartment(null);
  };

  const resetHRManagerForm = () => {
    setHrManagerForm({
      email: "",
      profile: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      personalDetails: {
        gender: "",
        dateOfBirth: "",
        city: "",
        state: "",
        panNo: "",
        aadharNo: "",
        uanNo: "",
        esicNo: "",
        bankAccountNo: "",
        ifscCode: "",
        personalEmail: "",
        officialMobile: "",
        personalMobile: "",
      },
      employmentDetails: {
        employeeId: "",
        designation: "",
        joiningDate: "",
        workLocation: "",
        employmentType: "full-time",
        salary: {
          base: "",
          bonus: "",
          taxDeductions: "",
        },
      },
      leaveBalance: {
        casual: 0,
        sick: 0,
        earned: 0,
      },
    });
  };

  const getAllDepartments = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_ALL_DEPARTMENTS + company._id);
      console.log("Departments:", res.data.data);
      dispatch(setReduxDepartments(res.data.data));
      setDepartments(res.data.data);
      toast.success("Departments fetched successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch departments");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (company?._id) {
      getAllDepartments();
    }
  }, [company]);

  // Handle Department CRUD
  const handleDepartmentSubmit = async () => {
    try {
      dispatch(setLoading(true));
      const payload = {
        name: deptForm.name,
        description: deptForm.description,
        companyId: company._id,
      };

      if (isAddDeptModalOpen) {
        await apiConnector("POST", ADD_DEPARTMENT, payload,{
        Authorization : `Bearer ${token}`
        });
        toast.success("Department added successfully!");
        setIsAddDeptModalOpen(false);
      } else {
        await apiConnector("PUT", `${UPDATE_DEPARTMENT}${selectedDepartment._id}`, payload,{
          Authorization : `Bearer ${token}`
        });
        toast.success("Department updated successfully!");
        setIsEditDeptModalOpen(false);
      }

      resetDeptForm();
      getAllDepartments();
    } catch (err) {
      console.log(err);
      toast.error("Failed to save department");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle HR/Manager Assignment
  const handleHRManagerAssignment = async (role) => {
    try {
      dispatch(setLoading(true));
      const payload = {
        ...hrManagerForm,
        role: role,
        companyId: company._id,
        employmentDetails: {
          ...hrManagerForm.employmentDetails,
          department: selectedDepartment._id,
        },
      };

      await apiConnector("POST", ASSIGN_HR_MANAGER, payload,{
        Authorization : `Bearer ${token}`
      });
      toast.success(`${role === 'hr' ? 'HR' : 'Manager'} assigned successfully!`);
      
      if (role === 'hr') {
        setIsAssignHRModalOpen(false);
      } else {
        setIsAssignManagerModalOpen(false);
      }

      resetHRManagerForm();
      getAllDepartments();
    } catch (err) {
      console.log(err);
      toast.error(`Failed to assign ${role === 'hr' ? 'HR' : 'Manager'}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle HR/Manager Update
  const handleHRManagerUpdate = async (role) => {
    try {
      dispatch(setLoading(true));
      const payload = {
        ...hrManagerForm,
        role: role,
        companyId: company._id,
        employmentDetails: {
          ...hrManagerForm.employmentDetails,
          department: selectedDepartment._id,
        },
      };

      await apiConnector("PUT", UPDATE_HR_MANAGER, payload,{
        Authorization : `Bearer ${token}`
      });
      toast.success(`${role === 'hr' ? 'HR' : 'Manager'} updated successfully!`);
      
      if (role === 'hr') {
        setIsUpdateHRModalOpen(false);
      } else {
        setIsUpdateManagerModalOpen(false);
      }

      resetHRManagerForm();
      getAllDepartments();
    } catch (err) {
      console.log(err);
      toast.error(`Failed to update ${role === 'hr' ? 'HR' : 'Manager'}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderHRManagerForm = (isUpdate = false, role = 'hr') => (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Display current person info for updates */}
      {isUpdate && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">
            Currently Assigned {role === 'hr' ? 'HR' : 'Manager'}
          </h4>
          <p className="text-sm text-blue-700">
            <strong>Name:</strong> {role === 'hr' 
              ? `${selectedDepartment?.hr?.user?.profile?.firstName || ''} ${selectedDepartment?.hr?.user?.profile?.lastName || ''}`
              : `${selectedDepartment?.manager?.user?.profile?.firstName || ''} ${selectedDepartment?.manager?.user?.profile?.lastName || ''}`
            }
          </p>
          <p className="text-sm text-blue-700">
            <strong>Email:</strong> {role === 'hr' 
              ? selectedDepartment?.hr?.user?.email || 'N/A'
              : selectedDepartment?.manager?.user?.email || 'N/A'
            }
          </p>
          <p className="text-sm text-blue-700">
            <strong>Employee ID:</strong> {role === 'hr' 
              ? selectedDepartment?.hr?.employmentDetails?.employeeId || 'N/A'
              : selectedDepartment?.manager?.employmentDetails?.employeeId || 'N/A'
            }
          </p>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Updating will replace the current {role === 'hr' ? 'HR' : 'Manager'} with a new person. Enter details for the new {role === 'hr' ? 'HR' : 'Manager'} below.
            </p>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter email address"
              value={hrManagerForm.email}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                email: e.target.value
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter employee ID"
              value={hrManagerForm.employmentDetails.employeeId}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  employeeId: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter first name"
              value={hrManagerForm.profile.firstName}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  firstName: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter last name"
              value={hrManagerForm.profile.lastName}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  lastName: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={hrManagerForm.profile.phone}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  phone: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <input
              type="text"
              placeholder="Enter designation"
              value={hrManagerForm.employmentDetails.designation}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  designation: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Joining <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={hrManagerForm.employmentDetails.joiningDate}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  joiningDate: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Location
            </label>
            <input
              type="text"
              placeholder="Enter work location"
              value={hrManagerForm.employmentDetails.workLocation}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  workLocation: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Personal Details Section */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={hrManagerForm.personalDetails.gender}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                personalDetails: {
                  ...prev.personalDetails,
                  gender: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={hrManagerForm.personalDetails.dateOfBirth}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                personalDetails: {
                  ...prev.personalDetails,
                  dateOfBirth: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="Enter city"
              value={hrManagerForm.personalDetails.city}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                personalDetails: {
                  ...prev.personalDetails,
                  city: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              placeholder="Enter state"
              value={hrManagerForm.personalDetails.state}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                personalDetails: {
                  ...prev.personalDetails,
                  state: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Email
            </label>
            <input
              type="email"
              placeholder="Enter personal email"
              value={hrManagerForm.personalDetails.personalEmail}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                personalDetails: {
                  ...prev.personalDetails,
                  personalEmail: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Official Mobile
            </label>
            <input
              type="tel"
              placeholder="Enter official mobile"
              value={hrManagerForm.personalDetails.officialMobile}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                personalDetails: {
                  ...prev.personalDetails,
                  officialMobile: e.target.value
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Salary Information Section */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Salary Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Salary
            </label>
            <input
              type="number"
              placeholder="Enter base salary"
              value={hrManagerForm.employmentDetails.salary.base}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  salary: {
                    ...prev.employmentDetails.salary,
                    base: e.target.value
                  }
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus Amount
            </label>
            <input
              type="number"
              placeholder="Enter bonus amount"
              value={hrManagerForm.employmentDetails.salary.bonus}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  salary: {
                    ...prev.employmentDetails.salary,
                    bonus: e.target.value
                  }
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Deductions
            </label>
            <input
              type="number"
              placeholder="Enter tax deductions"
              value={hrManagerForm.employmentDetails.salary.taxDeductions}
              onChange={(e) => setHrManagerForm(prev => ({
                ...prev,
                employmentDetails: {
                  ...prev.employmentDetails,
                  salary: {
                    ...prev.employmentDetails.salary,
                    taxDeductions: e.target.value
                  }
                }
              }))}
              className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

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
          <div className="w-full h-[92vh] flex justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Add Department Button */}
            <div className="flex justify-end px-6 mt-4">
              <button
                onClick={() => {
                  resetDeptForm();
                  setIsAddDeptModalOpen(true);
                }}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Department
              </button>
            </div>

            {/* Departments Table */}
            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full border border-gray-300 text-left text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Manager</th>
                    <th className="px-4 py-2">HR</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments?.map((dept) => (
                    <tr key={dept._id} className="border-t border-gray-300">
                      <td className="px-4 py-2 font-medium">{dept.name}</td>
                      <td className="px-4 py-2">
                        {dept.description?.length > 50 
                          ? `${dept.description.substr(0, 50)}...` 
                          : dept.description || "—"
                        }
                      </td>
                      <td className="px-4 py-2">
                        {dept.manager?.user?.profile?.firstName 
                          ? `${dept.manager.user.profile.firstName} ${dept.manager.user.profile.lastName || ""}`
                          : "Not Assigned"
                        }
                      </td>
                      <td className="px-4 py-2">
                        {dept.hr?.user?.profile?.firstName 
                          ? `${dept.hr.user.profile.firstName} ${dept.hr.user.profile.lastName || ""}`
                          : "Not Assigned"
                        }
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 flex-wrap">
                          {/* Department Edit Button */}
                          <button
                            onClick={() => {
                              setSelectedDepartment(dept);
                              setDeptForm({
                                name: dept.name,
                                description: dept.description || "",
                              });
                              setIsEditDeptModalOpen(true);
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Edit Dept
                          </button>

                          {/* Manager Actions */}
                          {dept.manager ? (
                            <button
                              onClick={() => {
                                setSelectedDepartment(dept);
                                resetHRManagerForm(); // Changed: Reset form instead of loading data
                                setIsUpdateManagerModalOpen(true);
                              }}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Update Manager
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDepartment(dept);
                                resetHRManagerForm();
                                setIsAssignManagerModalOpen(true);
                              }}
                              className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                            >
                              Assign Manager
                            </button>
                          )}

                          {/* HR Actions */}
                          {dept.hr ? (
                            <button
                              onClick={() => {
                                setSelectedDepartment(dept);
                                resetHRManagerForm(); // Changed: Reset form instead of loading data
                                setIsUpdateHRModalOpen(true);
                              }}
                              className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                            >
                              Update HR
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDepartment(dept);
                                resetHRManagerForm();
                                setIsAssignHRModalOpen(true);
                              }}
                              className="bg-pink-600 text-white px-2 py-1 rounded text-xs hover:bg-pink-700"
                            >
                              Assign HR
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Department Modal */}
            {isAddDeptModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
                  <h2 className="text-xl font-bold mb-4">Add Department</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter department name"
                        value={deptForm.name}
                        onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        placeholder="Enter department description"
                        value={deptForm.description}
                        onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                        className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddDeptModalOpen(false);
                        resetDeptForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDepartmentSubmit}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                      disabled={!deptForm.name.trim()}
                    >
                      Add Department
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Department Modal */}
            {isEditDeptModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
                  <h2 className="text-xl font-bold mb-4">Edit Department</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter department name"
                        value={deptForm.name}
                        onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        placeholder="Enter department description"
                        value={deptForm.description}
                        onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                        className="input-field w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditDeptModalOpen(false);
                        resetDeptForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDepartmentSubmit}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                      disabled={!deptForm.name.trim()}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Assign Manager Modal */}
            {isAssignManagerModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    Assign Manager to {selectedDepartment?.name}
                  </h2>
                  {renderHRManagerForm(false, 'manager')}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAssignManagerModalOpen(false);
                        resetHRManagerForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleHRManagerAssignment('manager')}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      Assign Manager
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Assign HR Modal */}
            {isAssignHRModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    Assign HR to {selectedDepartment?.name}
                  </h2>
                  {renderHRManagerForm(false, 'hr')}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAssignHRModalOpen(false);
                        resetHRManagerForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleHRManagerAssignment('hr')}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      Assign HR
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Update Manager Modal */}
            {isUpdateManagerModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    Assign New Manager to {selectedDepartment?.name}
                  </h2>
                  {renderHRManagerForm(true, 'manager')}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsUpdateManagerModalOpen(false);
                        resetHRManagerForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleHRManagerUpdate('manager')}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      Assign New Manager
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Update HR Modal */}
            {isUpdateHRModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    Assign New HR to {selectedDepartment?.name}
                  </h2>
                  {renderHRManagerForm(true, 'hr')}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsUpdateHRModalOpen(false);
                        resetHRManagerForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleHRManagerUpdate('hr')}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      Assign New HR
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

export default AddDepartment;
