import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/shiftSlice";
import { tablecustomisationEndpoints } from "../services/api";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";

const {
  CREATE_TABLE_CUSTOMIZATION,
  FETCH_TABLE_CUSTOMIZATION,
  UPDATE_TABLE_CUSTOMIZATION,
} = tablecustomisationEndpoints;

const CustomizeTableSequence = () => {
  const dispatch = useDispatch();
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.shifts.loading);
  const [tableStructures, setTableStructures] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newStructure, setNewStructure] = useState({
    name: "",
    columnNames: [""],
  });
  const [selectedStructure, setSelectedStructure] = useState(null);
  const token = useSelector((state) => state.auth.token);

  const Options = [
    "Employees",
    "Managers",
    "Shifts",
    "Attendance",
    "Leaves",
    "Overtime",
    "Resignation",
    "Self Evaluation",
    "New Joiners",
    "Payroll Management",
    "Tax & Declarations",
    "Reimbursement Reports",
    "Leave & Attendance Reports",
    "Policies",
    "Individual Reports",
  ];

   const fetchStructures = async () => {
      try {
        dispatch(setLoading(true));
        const res = await apiConnector(
          "GET",
          FETCH_TABLE_CUSTOMIZATION + company._id,
          null,
          {
            Authorization: `Bearer ${token}`,
          }
        );
        setTableStructures(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        dispatch(setLoading(false));
      }
    };

  useEffect(() => {
   

    fetchStructures();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <AdminHeader/>


        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          //   here you need to change
          <>
            <div className="flex justify-end px-6 mt-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
              >
                + Add Table Structure
              </button>
            </div>

            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full border border-gray-300 text-left shadow-sm">
                <thead className="bg-blue-800 text-white text-sm">
                  <tr>
                    <th className="px-4 py-2">Sr. No.</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableStructures.map((structure, index) => (
                    <tr
                      key={structure._id}
                      className="border-t border-gray-200 hover:bg-gray-50 text-sm"
                    >
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{structure.name}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            setSelectedStructure(structure);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(isAddModalOpen || isEditModalOpen) && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md shadow-lg">
                  <h2 className="text-xl font-bold mb-4">
                    {isAddModalOpen
                      ? "Add Table Structure"
                      : "Edit Table Structure"}
                  </h2>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        dispatch(setLoading(true));

                        const payload = {
                          name: isAddModalOpen
                            ? newStructure.name
                            : selectedStructure.name,
                          columnNames: isAddModalOpen
                            ? newStructure.columnNames.filter(Boolean)
                            : selectedStructure.columnNames.filter(Boolean),
                          company: company._id,
                        };

                        if (isAddModalOpen) {
                          await apiConnector(
                            "POST",
                            CREATE_TABLE_CUSTOMIZATION,
                            payload,
                            {
                              Authorization: `Bearer ${token}`,
                            }
                          );
                        } else {
                          await apiConnector(
                            "PUT",
                            `${UPDATE_TABLE_CUSTOMIZATION}${selectedStructure._id}`,
                            payload,
                            {
                              Authorization: `Bearer ${token}`,
                            }
                          );
                        }

                        toast.success(
                          isAddModalOpen
                            ? "Structure added"
                            : "Structure updated"
                        );
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                        setNewStructure({ name: "", columnNames: [""] });
                        setSelectedStructure(null);
                        const res = await apiConnector(
                          "GET",
                          FETCH_TABLE_CUSTOMIZATION + company._id,
                          null,
                          {
                            Authorization: `Bearer ${token}`,
                          }
                        );
                        setTableStructures(res.data.data || []);
                      } catch (err) {
                        toast.error("Failed to save changes");
                        console.error(err);
                      } finally {
                        dispatch(setLoading(false));
                      }
                    }}
                    className="space-y-3 text-sm"
                  >
                    <select
                      value={
                        isAddModalOpen
                          ? newStructure.name
                          : selectedStructure?.name || ""
                      }
                      onChange={(e) => {
                        const selected = e.target.value;
                        if (isAddModalOpen) {
                          setNewStructure((prev) => ({
                            ...prev,
                            name: selected,
                          }));
                        } else {
                          setSelectedStructure((prev) => ({
                            ...prev,
                            name: selected,
                          }));
                        }
                      }}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Structure Name</option>
                      {Options.map((perm, index) => (
                        <option key={index} value={perm}>
                          {perm}
                        </option>
                      ))}
                    </select>

                    <label className="block font-medium">Column Names:</label>
                    {(isAddModalOpen
                      ? newStructure.columnNames
                      : selectedStructure?.columnNames || []
                    ).map((col, i) => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`Column ${i + 1}`}
                        value={col}
                        onChange={(e) => {
                          if (isAddModalOpen) {
                            const copy = [...newStructure.columnNames];
                            copy[i] = e.target.value;
                            setNewStructure((prev) => ({
                              ...prev,
                              columnNames: copy,
                            }));
                          } else {
                            const copy = [...selectedStructure.columnNames];
                            copy[i] = e.target.value;
                            setSelectedStructure((prev) => ({
                              ...prev,
                              columnNames: copy,
                            }));
                          }
                        }}
                        className="input-field w-full mb-2"
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        if (isAddModalOpen) {
                          setNewStructure((prev) => ({
                            ...prev,
                            columnNames: [...prev.columnNames, ""],
                          }));
                        } else {
                          setSelectedStructure((prev) => ({
                            ...prev,
                            columnNames: [...prev.columnNames, ""],
                          }));
                        }
                      }}
                      className="px-3 py-1 bg-gray-300 rounded text-xs"
                    >
                      + Add Column
                    </button>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          setIsEditModalOpen(false);
                          setNewStructure({ name: "", columnNames: [""] });
                          setSelectedStructure(null);
                        }}
                        className="px-4 py-2 bg-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                      >
                        {isAddModalOpen ? "Create" : "Save"}
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

export default CustomizeTableSequence;
