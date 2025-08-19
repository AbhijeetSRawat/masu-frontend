import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";

import { shiftEndpoints } from "../services/api";
import toast from "react-hot-toast";
import { setReduxShifts } from "../slices/shiftSlice";
import AdminHeader from "../components/AdminHeader";

const { ADD_SHIFT, UPDATE_SHIFT, GET_ALL_SHIFTS } = shiftEndpoints;

const ShiftManagement = () => {
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.permissions.loading);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
  });

  const dispatch = useDispatch()

  const [shifts, setShifts] = useState([]);

  const addShift = async ()=>{
    try{
        dispatch(setLoading(true));
        const obj = {...newShift,companyId:company._id}
        const addData = await apiConnector("POST",ADD_SHIFT,obj);

        console.log(addData);
        toast.success("New Shift Added!");
        setNewShift({ name: "", startTime: "", endTime: "" });
        setIsAddModalOpen(false);
        getAllShifts();
    }
    catch(error){
        console.log(error);
        toast.error("Unable to create new shift");
    }
    finally{
        dispatch(setLoading(false));
    }
  }

  const editShift = async ()=>{
    try{
        dispatch(setLoading(true));

        const editData = await apiConnector("PUT",UPDATE_SHIFT+selectedShift._id,selectedShift,null,{shiftId:selectedShift._id});

        console.log(editData)
        toast.success("Shift edited successfully!");
        setIsEditModalOpen(false);
        getAllShifts();
    }
    catch(error){
        console.log(error)
        toast.error("Unable to edit Shift!")
    }
    finally{
        dispatch(setLoading(false));
    }
  }

  const getAllShifts = async () => {
    try {
      dispatch(setLoading(true));
     
    const shift = await apiConnector("GET", GET_ALL_SHIFTS + company._id);
    console.log(shift);
    setShifts(shift.data.data);
      
        dispatch(setReduxShifts(shift.data.data))

      toast.success("All shifts have been fetched successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Shifts can't be fetched!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getAllShifts();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="w-[100vw] lg:w-[80vw] lg:ml-[20vw]">
        <AdminHeader/>

      <div className="text-2xl w-full flex justify-center font-bold mt-8">
        Shift Management
      </div>

       {
        loading?(
            <div className="w-[80vw] h-[92vh] flex justify-center items-center" > <div className="spinner"></div></div>
        ):(
            <>
                 <div className="flex justify-end px-4 mt-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            + Add Shift
          </button>
        </div>

        <div className="overflow-x-auto px-4 mt-6">
          <table className="min-w-full border border-gray-300 text-left">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-2">Shift Name</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Start Time</th>
                <th className="px-4 py-2">End Time</th>
                <th className="px-4 py-2">Edit</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift._id} className="border-t border-gray-300">
                  <td className="px-4 py-2">{shift.name}</td>
                  <td className="px-4 py-2">{shift.company?.name}</td>
                  <td className="px-4 py-2">{shift.startTime}</td>
                  <td className="px-4 py-2">{shift.endTime}</td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800"
                      onClick={() => {
                        setSelectedShift(shift);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isEditModalOpen && selectedShift && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
              <h3 className="text-xl font-bold mb-4">Edit Shift</h3>

              <form className="space-y-4">
                <div>
                  <label className="block font-medium">Shift Name</label>
                  <input
                    type="text"
                    value={selectedShift.name}
                    onChange={(e) =>
                      setSelectedShift({
                        ...selectedShift,
                        name: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-medium">Start Time</label>
                  <input
                    type="time"
                    value={selectedShift.startTime}
                    onChange={(e) =>
                      setSelectedShift({
                        ...selectedShift,
                        startTime: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-medium">End Time</label>
                  <input
                    type="time"
                    value={selectedShift.endTime}
                    onChange={(e) =>
                      setSelectedShift({
                        ...selectedShift,
                        endTime: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </form>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedShift(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={editShift}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  {loading ? (<div className="loader1"></div>):(<>Save Changes</>)}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New Shift</h3>

              <form className="space-y-4">
                <div>
                  <label className="block font-medium">Shift Name</label>
                  <input
                    type="text"
                    value={newShift.name}
                    onChange={(e) =>
                      setNewShift((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Start Time</label>
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) =>
                      setNewShift((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">End Time</label>
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) =>
                      setNewShift((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="input-field"
                    required
                  />
                </div>
              </form>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewShift({ name: "", startTime: "", endTime: "" });
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={addShift}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  {loading ? (<div className="loader1"></div>):(<>Add Shift</>)}
                </button>
              </div>
            </div>
          </div>
        )}
            </>
        )
       }
      </div>
    </div>
  );
};

export default ShiftManagement;
