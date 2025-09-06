import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { shiftEndpoints } from "../services/api";
import toast from "react-hot-toast";
import { setReduxShifts } from "../slices/shiftSlice";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { ADD_SHIFT, UPDATE_SHIFT, GET_ALL_SHIFTS } = shiftEndpoints;

const ShiftManagement = () => {
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.permissions.loading);

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // ✅ Enhanced newShift state with all new fields
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    gracePeriod: 15,
    halfDayThreshold: 4,
    isNightShift: false,
    breakDuration: 60,
    isActive: true
  });

  const dispatch = useDispatch();
  const [shifts, setShifts] = useState([]);

  // ✅ Enhanced addShift function
  const addShift = async () => {
    try {
      dispatch(setLoading(true));
      const obj = { ...newShift, companyId: company._id };
      const addData = await apiConnector("POST", ADD_SHIFT, obj);

      console.log(addData);
      toast.success("New Shift Added!");
      
      // Reset form with all fields
      setNewShift({
        name: "",
        startTime: "",
        endTime: "",
        gracePeriod: 15,
        halfDayThreshold: 4,
        isNightShift: false,
        breakDuration: 60,
        isActive: true
      });
      
      setIsAddModalOpen(false);
      getAllShifts();
    } catch (error) {
      console.log(error);
      toast.error("Unable to create new shift");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✅ Enhanced editShift function
  const editShift = async () => {
    try {
      dispatch(setLoading(true));
      const editData = await apiConnector("PUT", UPDATE_SHIFT + selectedShift._id, selectedShift);

      console.log(editData);
      toast.success("Shift edited successfully!");
      setIsEditModalOpen(false);
      getAllShifts();
    } catch (error) {
      console.log(error);
      toast.error("Unable to edit Shift!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getAllShifts = async () => {
    try {
      dispatch(setLoading(true));
      const shift = await apiConnector("GET", GET_ALL_SHIFTS + company._id);
      console.log(shift);
      setShifts(shift.data.data);
      dispatch(setReduxShifts(shift.data.data));
      toast.success("All shifts have been fetched successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Shifts can't be fetched!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (company?._id) {
      getAllShifts();
    }
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


        <div className="text-2xl w-full flex justify-center font-bold mt-8">
          Shift Management
        </div>

        {loading ? (
          <div className="w-[80vw] h-[92vh] flex justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-end px-4 mt-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Shift
              </button>
            </div>

            {/* ✅ Enhanced Table with new columns */}
            <div className="overflow-x-auto px-4 mt-6">
              <table className="min-w-full border border-gray-300 text-left text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-3 py-2">Sr.No.</th>
                    <th className="px-3 py-2">Shift Name</th>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Timing</th>
                    <th className="px-3 py-2">Grace Period</th>
                    <th className="px-3 py-2">Half Day (hrs)</th>
                    <th className="px-3 py-2">Break (min)</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                        No shifts found. Create your first shift!
                      </td>
                    </tr>
                  ) : (
                    shifts.map((shift, index) => (
                      <tr key={shift._id} className="border-t border-gray-300 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{shift.name}</td>
                        <td className="px-3 py-2">{shift.company?.name}</td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <span className="font-medium">{shift.startTime}</span> - 
                            <span className="font-medium">{shift.endTime}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">{shift.gracePeriod || 15} min</td>
                        <td className="px-3 py-2 text-center">{shift.halfDayThreshold || 4} hrs</td>
                        <td className="px-3 py-2 text-center">{shift.breakDuration || 60} min</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            shift.isNightShift 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {shift.isNightShift ? 'Night' : 'Day'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            shift.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {shift.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800 text-xs"
                            onClick={() => {
                              setSelectedShift(shift);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ Enhanced Edit Modal */}
            {isEditModalOpen && selectedShift && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">Edit Shift</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shift Name
                      </label>
                      <input
                        type="text"
                        value={selectedShift.name}
                        onChange={(e) =>
                          setSelectedShift({ ...selectedShift, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={selectedShift.startTime}
                        onChange={(e) =>
                          setSelectedShift({ ...selectedShift, startTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={selectedShift.endTime}
                        onChange={(e) =>
                          setSelectedShift({ ...selectedShift, endTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Period (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={selectedShift.gracePeriod || 15}
                        onChange={(e) =>
                          setSelectedShift({ 
                            ...selectedShift, 
                            gracePeriod: parseInt(e.target.value) || 15 
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Half Day Threshold (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={selectedShift.halfDayThreshold || 4}
                        onChange={(e) =>
                          setSelectedShift({ 
                            ...selectedShift, 
                            halfDayThreshold: parseInt(e.target.value) || 4 
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Break Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={selectedShift.breakDuration || 60}
                        onChange={(e) =>
                          setSelectedShift({ 
                            ...selectedShift, 
                            breakDuration: parseInt(e.target.value) || 60 
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedShift.isNightShift || false}
                          onChange={(e) =>
                            setSelectedShift({ 
                              ...selectedShift, 
                              isNightShift: e.target.checked 
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Night Shift</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedShift.isActive !== false}
                          onChange={(e) =>
                            setSelectedShift({ 
                              ...selectedShift, 
                              isActive: e.target.checked 
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setSelectedShift(null);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editShift}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50"
                    >
                      {loading ? <div className="loader1"></div> : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Enhanced Add Modal */}
            {isAddModalOpen && (
              <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">Add New Shift</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shift Name *
                      </label>
                      <input
                        type="text"
                        value={newShift.name}
                        onChange={(e) =>
                          setNewShift((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={newShift.startTime}
                        onChange={(e) =>
                          setNewShift((prev) => ({ ...prev, startTime: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={newShift.endTime}
                        onChange={(e) =>
                          setNewShift((prev) => ({ ...prev, endTime: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Period (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={newShift.gracePeriod}
                        onChange={(e) =>
                          setNewShift((prev) => ({ 
                            ...prev, 
                            gracePeriod: parseInt(e.target.value) || 15 
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Half Day Threshold (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={newShift.halfDayThreshold}
                        onChange={(e) =>
                          setNewShift((prev) => ({ 
                            ...prev, 
                            halfDayThreshold: parseInt(e.target.value) || 4 
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Break Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newShift.breakDuration}
                        onChange={(e) =>
                          setNewShift((prev) => ({ 
                            ...prev, 
                            breakDuration: parseInt(e.target.value) || 60 
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newShift.isNightShift}
                          onChange={(e) =>
                            setNewShift((prev) => ({ ...prev, isNightShift: e.target.checked }))
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Night Shift</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newShift.isActive}
                          onChange={(e) =>
                            setNewShift((prev) => ({ ...prev, isActive: e.target.checked }))
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setNewShift({
                          name: "",
                          startTime: "",
                          endTime: "",
                          gracePeriod: 15,
                          halfDayThreshold: 4,
                          isNightShift: false,
                          breakDuration: 60,
                          isActive: true
                        });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addShift}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50"
                    >
                      {loading ? <div className="loader1"></div> : "Add Shift"}
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

export default ShiftManagement;
