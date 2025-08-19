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

const { GET_ALL_MANAGER } = companyEndpoints;
const { ADD_DEPARTMENT, UPDATE_DEPARTMENT, GET_ALL_DEPARTMENTS } =
  departmentEndpoints;

const AddDepartment = () => {
  const dispatch = useDispatch();

  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.permissions.loading);

  const reduxManagers = useSelector((state) => state.managers.reduxManagers);

  

  const [managers, setManagers] = useState([]);

  const [departments, setDepartments] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    description: "",
    manager: "",
  });

  const resetDeptForm = () => {
    setDeptForm({
      name: "",
      description: "",
      manager: "",
    });
    setSelectedDepartment(null);
  };

  const getAllManagers = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_ALL_MANAGER + company._id);
      console.log("managers",res.data.data);
      dispatch(setReduxManagers(res.data.data));
      setManagers(res.data.data);
      toast.success("Managers fetched successfully");
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch managers");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getAllDepartments = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_ALL_DEPARTMENTS + company._id);
      console.log(res.data.data);
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
    if (reduxManagers === null) {
      getAllManagers();
    } else {
      setManagers(reduxManagers);
      toast.success("Managers fetched successfully");
    }
    getAllDepartments();
  }, []);

  const submitHandler = async () => {
    try {
      dispatch(setLoading(true));
      const payload = {
        name: deptForm.name,
        description: deptForm.description,
        manager: deptForm.manager,
        companyId: company._id,
      };

      if (isAddModalOpen) {
        const addData = await apiConnector("POST", ADD_DEPARTMENT, payload);
        console.log(addData);
        toast.success("Department added!");
      } else {

        console.log("edit content : ",payload);

        const editData = await apiConnector(
          "PUT",
          `${UPDATE_DEPARTMENT}${selectedDepartment._id}`,
          payload
        );
        console.log(editData)
        toast.success("Department updated!");
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetDeptForm();
      getAllDepartments();
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-[100vw] lg:w-[80vw] lg:ml-[20vw]">
       <AdminHeader/>


        {loading ? (
          <div className="w-[80vw] h-[92vh] flex justify-center items-center">
            {" "}
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <>
              <div className="flex justify-end px-6 mt-4">
                <button
                  onClick={() => {
                    resetDeptForm();
                    setIsAddModalOpen(true);
                  }}
                  className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  + Add Department
                </button>
              </div>

              <div className="overflow-x-auto px-6 mt-4">
                <table className="min-w-full border border-gray-300 text-left">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="px-4 py-2">Department</th>
                      <th className="px-4 py-2">Company</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Manager</th>
                      <th className="px-4 py-2">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments?.map((dept) => (
                      <tr key={dept._id} className="border-t border-gray-300">
                        <td className="px-4 py-2">{dept.name}</td>
                        <td className="px-4 py-2">{company?.name}</td>
                        <td className="px-4 py-2">{dept.description || "—"}</td>
                        <td className="px-4 py-2">
                          {managers?.find((m) => m._id === dept.manager?._id)?.user
                            ?.profile?.firstName || "Unassigned"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              setSelectedDepartment(dept);
                              setDeptForm({
                                name: dept.name,
                                description: dept.description.substr(0,30)+"..." || "",
                                manager: dept.manager?._id || "",
                              });
                              setIsEditModalOpen(true);
                            }}
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

            {(isAddModalOpen || isEditModalOpen) && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
                  <h2 className="text-xl font-bold mb-4">
                    {isAddModalOpen ? "Add Department" : "Edit Department"}
                  </h2>

                  <form className="space-y-4">
                    <input
                      type="text"
                      placeholder="Department Name"
                      value={deptForm.name}
                      onChange={(e) =>
                        setDeptForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                    />
                    <textarea
                      placeholder="Description"
                      value={deptForm.description}
                      onChange={(e) =>
                        setDeptForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                    ></textarea>
                    <select
                      value={deptForm.manager}
                      onChange={(e) =>
                        setDeptForm((prev) => ({
                          ...prev,
                          manager: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                    >
                      <option value="">Select Manager</option>
                      {managers?.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.user?.profile?.firstName}{" "}
                          {m.user?.profile?.lastName}
                        </option>
                      ))}
                    </select>
                  </form>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                        resetDeptForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitHandler}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      
                      {isAddModalOpen ? "Add Department" : "Save Changes"}
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
