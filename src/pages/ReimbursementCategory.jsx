import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";

import toast from "react-hot-toast";
import { reimbursementCategoryEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const {  CREATE_CATEGORY,
  GET_ALL_CATEGORY,
  UPDATE_CATEGORY  } = reimbursementCategoryEndpoints;

const ReimbursementCategory = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [newCategory, setNewCategory] = useState({ name: "", description: "" });

const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [selectedCategory, setSelectedCategory] = useState(null);


  const user = useSelector((state)=>state.auth.signupData);

  const dispatch = useDispatch();

  const [reimbursementcategory,setReimbursementCategory] = useState([]);
 
  const getReimbursementCategory = async () => {
    try {
      dispatch(setLoading(true));
      const result = await apiConnector("GET", `${GET_ALL_CATEGORY}${company._id}`, null, {
        Authorization: `Bearer ${token}`,
      });
      setReimbursementCategory(result.data.data || []);
      console.log(result)
      toast.success("Reimbursement Categories fetched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch reimbursement category!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  

  useEffect(() => {
    getReimbursementCategory();
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
          : (role === 'admin' ? <AdminHeader/> : <SubAdminHeader />)
      }



     

        {loading ? (
          <div className="flex justify-center items-center h-[70vh]">
            <div className="spinner" />
          </div>
        ) : (
         <>

           <>
  {/* Add Category Button */}
  <div className="flex justify-end px-6 mt-4">
    <button
      onClick={() => setIsAddModalOpen(true)}
      className="mb-4 px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
    >
      + Add Category
    </button>
  </div>

  {/* Category Table */}
  <div className="overflow-x-auto px-6">
    <table className="min-w-full border border-gray-300 text-left shadow-md">
      <thead className="bg-blue-800 text-white">
        <tr>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Description</th>
          <th className="px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {reimbursementcategory.map((item, index) => (
          <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-2">{item.name}</td>
            <td className="px-4 py-2">{item.description || "—"}</td>
            <td className="px-4 py-2">
              <button
                className="bg-blue-700 text-white px-3 py-1 rounded"
                onClick={() => {
                  setSelectedCategory(item);
                  setIsEditModalOpen(true);
                }}
              >
                Update
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Add Modal */}
  {isAddModalOpen && (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4">Add Reimbursement Category</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              dispatch(setLoading(true));
              console.log(user);

              console.log("data is : ",newCategory.name,
                newCategory.description,
                 company._id,
                 user.user.id,
              )

              const res = await apiConnector("POST", CREATE_CATEGORY, {
                name: newCategory.name,
                description: newCategory.description,
                companyId: company._id,
                createdBy: user.user.id,
              }, {
                Authorization: `Bearer ${token}`,
              });
              console.log( "response after creating the category is :", res)
              toast.success("Category added successfully!");
              getReimbursementCategory();
              setIsAddModalOpen(false);
              setNewCategory({ name: "", description: "" });
            } catch (error) {
              console.error(error);
              toast.error("Failed to add category");
            } finally {
              dispatch(setLoading(false));
            }
          }}
          className="space-y-4 text-sm"
        >
          <input
            type="text"
            placeholder="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
            className="input-field"
            required
          />
          <textarea
            placeholder="Description"
            value={newCategory.description}
            onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
            className="input-field"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Submit</button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* Edit Modal */}
  {isEditModalOpen && selectedCategory && (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[90vw] max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4">Update Category</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              dispatch(setLoading(true));
              const res = await apiConnector("PUT", `${UPDATE_CATEGORY}${selectedCategory._id}`, {
                name: selectedCategory.name,
                description: selectedCategory.description,
                createdBy: user.user.id,
              },  {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              });
              console.log("response after updating category is ",res);
              toast.success("Category updated successfully!");
              getReimbursementCategory();
              setIsEditModalOpen(false);
              setSelectedCategory(null);
            } catch (error) {
              console.error(error);
              toast.error("Failed to update category");
            } finally {
              dispatch(setLoading(false));
            }
          }}
          className="space-y-4 text-sm"
        >
          <input
            type="text"
            placeholder="Category Name"
            value={selectedCategory.name}
            onChange={(e) => setSelectedCategory((prev) => ({ ...prev, name: e.target.value }))}
            className="input-field"
            required
          />
          <textarea
            placeholder="Description"
            value={selectedCategory.description || ""}
            onChange={(e) => setSelectedCategory((prev) => ({ ...prev, description: e.target.value }))}
            className="input-field"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Update</button>
          </div>
        </form>
      </div>
    </div>
  )}
</>

         </>)}
         </div>
         </div>
  );
};

export default ReimbursementCategory;
