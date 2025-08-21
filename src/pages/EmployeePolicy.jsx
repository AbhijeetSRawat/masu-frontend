import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { policiesEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";

const { ADD_POLICY, GET_POLICIES, UPDATE_POLICY } = policiesEndpoints;

const EmployeePolicy = () => {
  const company = useSelector((state) => state.permissions.company);
  const loading = useSelector((state) => state.permissions.loading);
  const token = useSelector(state => state.auth.token)
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
      const res = await apiConnector("GET", GET_POLICIES + company._id,null,{
        "Authorization" : `Bearer ${token}`
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

 

  

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    getAllPolicy();
  }, []);

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <EmployeeHeader/>


        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="w-full flex justify-center text-3xl font-bold text-gray-800 py-4">
                Policies
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
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

export default EmployeePolicy;
