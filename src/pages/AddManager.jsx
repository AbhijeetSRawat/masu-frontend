import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading, setReduxShifts } from "../slices/shiftSlice";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import { shiftEndpoints, companyEndpoints } from "../services/api";
import { setReduxManagers } from "../slices/manager";

const { GET_ALL_SHIFTS } = shiftEndpoints;
const { GET_ALL_MANAGER, ADD_HR, EDIT_HR } = companyEndpoints;

const AddManager = () => {
  const dispatch = useDispatch();
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.shifts.loading);
  const shiftsData = useSelector((state) => state.shifts.reduxShifts);

  const [shifts, setShifts] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

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
      employeeId : "",
      designation: "",
      joiningDate: "",
      employmentType: "full-time",
      salary: { base: "", bonus: "", taxDeductions: "" },
      skills: [""],
      documents: [],
      shiftId: "",
    });
  };

  const getAllShifts = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", GET_ALL_SHIFTS + company._id);
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
      const res = await apiConnector("GET", GET_ALL_MANAGER + company._id);
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
      employeeId:manager.employmentDetails.employeeId,
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

  const handleSubmit = async (type) => {
    try {
      dispatch(setLoading(true));
      const payload = { ...managerForm, companyId: company._id };
      console.log("payload of add manager is " ,payload)
      if (type === "add") {
        const addData = await apiConnector("POST", ADD_HR, payload);
        console.log(addData);
        toast.success("Manager added successfully");
      } else {
        const editData = await apiConnector(
          "PUT",
          `${EDIT_HR}${selectedManager._id}`,
          payload
        );
        console.log(editData);
        toast.success("Manager updated successfully");
      }

      resetManagerForm();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      getAllManagers();
    } catch (err) {
      toast.error("Submission failed");
      console.log(err);
    } finally {
      dispatch(setLoading(false));
    }
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
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <div className="w-full flex justify-center items-center px-6 lg:px-0 py-6 lg:py-0 min-h-[8vh] text-3xl text-white bg-gray-600 font-semibold">
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
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Manager
              </button>
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

      {/* Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {isAddModalOpen ? "Add Manager" : "Edit Manager"}
            </h3>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {["employeeId","email", "firstName", "lastName", "phone", "designation"].map(
                (key) => (
                  <input
                    key={key}
                    placeholder={key[0].toUpperCase() + key.slice(1)}
                    value={managerForm[key]}
                    onChange={(e) =>
                      setManagerForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="input-field"
                  />
                )
              )}
              <input
                type="date"
                value={managerForm.joiningDate}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    joiningDate: e.target.value,
                  }))
                }
                className="input-field"
              />

              <select
                value={managerForm.employmentType}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    employmentType: e.target.value,
                  }))
                }
                className="input-field"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
              </select>

              {/* Salary */}
              <input
                type="number"
                placeholder="Base Salary"
                value={managerForm.salary.base}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    salary: { ...prev.salary, base: +e.target.value },
                  }))
                }
                className="input-field"
              />
              <input
                type="number"
                placeholder="Bonus"
                value={managerForm.salary.bonus}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    salary: { ...prev.salary, bonus: +e.target.value },
                  }))
                }
                className="input-field"
              />
              <input
                type="number"
                placeholder="Tax Deductions"
                value={managerForm.salary.taxDeductions}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    salary: { ...prev.salary, taxDeductions: +e.target.value },
                  }))
                }
                className="input-field"
              />

              {/* Skills & Shift */}
              <input
                placeholder="Skills (comma separated)"
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
                className="input-field col-span-2"
              />
              <select
                value={managerForm.shiftId}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    shiftId: e.target.value,
                  }))
                }
                className="input-field col-span-2"
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift._id} value={shift._id}>
                    {shift.name}
                  </option>
                ))}
              </select>

              <div className="col-span-2 mt-4">
                <label className="font-semibold mr-3 text-gray-700">
                  Custom Fields
                </label>

                {managerForm?.customFields?.map((field, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...managerForm.customFields];
                        newFields[index].label = e.target.value;
                        setManagerForm((prev) => ({
                          ...prev,
                          customFields: newFields,
                        }));
                      }}
                      className="input-field"
                    />
                    <input
                      placeholder="Name"
                      value={field.name}
                      onChange={(e) => {
                        const newFields = [...managerForm.customFields];
                        newFields[index].name = e.target.value;
                        setManagerForm((prev) => ({
                          ...prev,
                          customFields: newFields,
                        }));
                      }}
                      className="input-field"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setManagerForm((prev) => ({
                      ...prev,
                      customFields: [
                        ...prev?.customFields,
                        { label: "", name: "" },
                      ],
                    }))
                  }
                  className="mt-3 px-3  py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                >
                  + Add Custom Field
                </button>
              </div>
            </form>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setSelectedManager(null);
                  resetManagerForm();
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(isAddModalOpen ? "add" : "edit")}
                className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
              >
                {loading ? (<div className="loader1"></div>) : ( <>  {isAddModalOpen ? "Add Manager" : "Save Changes"} </>) }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddManager;
