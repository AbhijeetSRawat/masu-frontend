import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { companyEndpoints } from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import { setAllCompany, setLoading } from "../slices/allCompanySlice";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import { setCompany, setPermissions } from "../slices/companyPermission";
import { Navigate, useNavigate } from "react-router-dom";
import { setReduxShifts } from "../slices/shiftSlice";
import { setReduxManagers } from "../slices/manager";
import { setReduxDepartments } from "../slices/departments";
import { setReduxEmployee } from "../slices/employee";

const { COMPANY_LIST_API, PERMISSIONS_API, UPDATE_DETAILS_API } =
  companyEndpoints;

const CompanyList = () => {
  const [companyList, setCompanyList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const navigate = useNavigate();

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.allCompany.loading);

  const getCompanyList = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", COMPANY_LIST_API);
      setCompanyList(response.data?.data || []);
      dispatch(setAllCompany(response.data?.data || []));
      console.log(response);
    } catch (error) {
      console.error("Error fetching company list:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getCompanyList();
  }, []);

  const permissions = [
    "Add Employee",
    "Edit Employee",
    "Add Manager",
    "Payroll Manage",
    "Shift Management",
    "Shift Assign",
    "Attendence Assign",
    "Add Leave",
    "Leave Assign",
    "Leave Approval",
    "Leave Balance",
    "Rule",
    "History",
    "Policies",
    "New Joiners Form",
    "Resignation Setup",
    "Resignation Approval",
    "Self Evaluation (KRA)",
    "Employee master information",
    "CTC Structure",
    "Payments & Deductions",
    "Perquisites Investments",
    "Tax Computation",
    "Reimbursement",
    "Flexi",
    "Tax computation sheet",
    "Investments (All sections: BOC,BOD,24b,etc.)",
    "Payroll Calculation",
    "Employee Master Report",
    "CTC Structure Report",
    "Payments & Deductions Report",
    "Declaration",
    "Actuals",
    "Tax Computation Report",
    "Reimbursement Report",
    "Flexi Report",
    "LIC/Credit Society Deductions",
    "Investments Report",
    "Payroll Calculation Report",
    "Attendence Report",
    "Leave Report",
    "Overtime Report",
    "Individual Report",
  ];

  const [givenPermissions, setGivenPermissions] = useState([]);

  const submitPermissionsHandler = async (e) => {
    e.preventDefault();

    try {
      dispatch(setLoading(true));

      console.log(selectedCompany.companyId, givenPermissions);

      const response = await apiConnector("POST", PERMISSIONS_API, {
        companyId: selectedCompany.companyId,
        permissions: givenPermissions,
      });

      console.log("Permission response:", response);
      toast.success("Permissions updated successfully");

      getCompanyList();

      setIsPermissionModalOpen(false);
      setSelectedCompany(null);
      setGivenPermissions([]);
    } catch (error) {
      console.error("Permission update failed:", error);
      toast.error("Unable to update permissions");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const [editedCompany, setEditedCompany] = useState(null);

  useEffect(() => {
    if (selectedCompany) {
      setEditedCompany(JSON.parse(JSON.stringify(selectedCompany)));
    }
  }, [selectedCompany]);

  const handleCustomFieldChange = (index, key, value) => {
    const updated = [...editedCompany.customFields];
    updated[index][key] = value;
    setEditedCompany((prev) => ({ ...prev, customFields: updated }));
  };

  const addCustomField = () => {
    setEditedCompany((prev) => ({
      ...prev,
      customFields: [
        ...(prev.customFields || []),
        { label: "", name: "", type: "text", required: false },
      ],
    }));
  };

  const saveDtailsHandler = async (e) => {
    e.preventDefault();

    const payload = {
      name: editedCompany.name,
      email: editedCompany.email,
      registrationNumber: editedCompany.registrationNumber,
      website: editedCompany.website,
      contactEmail: editedCompany.contactEmail,
      contactPhone: editedCompany.contactPhone,
      street: editedCompany.address?.street,
      city: editedCompany.address?.city,
      state: editedCompany.address?.state,
      pincode: editedCompany.address?.pincode,
      gstNumber: editedCompany.taxDetails?.gstNumber,
      panNumber: editedCompany.taxDetails?.panNumber,
      tanNumber: editedCompany.taxDetails?.tanNumber,
      accountNumber: editedCompany.bankDetails?.accountNumber,
      ifscCode: editedCompany.bankDetails?.ifscCode,
      accountHolderName: editedCompany.bankDetails?.accountHolderName,
      hrName: editedCompany.hrDetails?.name,
      hrEmail: editedCompany.hrDetails?.email,
      hrPhone: editedCompany.hrDetails?.phone,
      hrDesignation: editedCompany.hrDetails?.designation,
      customFields: editedCompany.customFields,
      thumbnail: editedCompany.thumbnail,
    };

    const form = new FormData();

    form.append("name", editedCompany.name);
    form.append("email", editedCompany.email);
    form.append("registrationNumber", editedCompany.registrationNumber);
    form.append("website", editedCompany.website);
    form.append("contactEmail", editedCompany.contactEmail);
    form.append("contactPhone", editedCompany.contactPhone);

    form.append("street", editedCompany.address?.street);
    form.append("city", editedCompany.address?.city);
    form.append("state", editedCompany.address?.state);
    form.append("pincode", editedCompany.address?.pincode);

    form.append("gstNumber", editedCompany.taxDetails?.gstNumber);
    form.append("panNumber", editedCompany.taxDetails?.panNumber);
    form.append("tanNumber", editedCompany.taxDetails?.tanNumber);

    form.append("accountNumber", editedCompany.bankDetails?.accountNumber);
    form.append("ifscCode", editedCompany.bankDetails?.ifscCode);
    form.append(
      "accountHolderName",
      editedCompany.bankDetails?.accountHolderName
    );

    form.append("hrName", editedCompany.hrDetails?.name);
    form.append("hrEmail", editedCompany.hrDetails?.email);
    form.append("hrPhone", editedCompany.hrDetails?.phone);
    form.append("hrDesignation", editedCompany.hrDetails?.designation);

    form.append("customFields", JSON.stringify(editedCompany.customFields));

    form.append("thumbnail", editedCompany.thumbnail);

    console.log("Formatted Payload:", payload);
    console.log("Form Data:", editedCompany);

    try {
      setLoading(true);
      const data = await apiConnector(
        "POST",
        UPDATE_DETAILS_API + editedCompany._id,
        form
      );
      console.log("changes result: ",data);
      toast.success("Company details Updated successfully!");
      getCompanyList();
    } catch (error) {
      console.log(error);
      toast.error("Error in updating company details");
    } finally {
      setLoading(false);
    }
    setIsModalOpen(false);
  };

  const filteredCompanies = companyList.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <Sidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[79vw] pr-4 pb-10">
        <div className="w-[100vw] flex justify-center  z-0 top-0 left-9 items-center px-6 lg:px-0 py-6 lg:py-0 min-h-[8vh] text-3xl text-white bg-gray-600 font-semibold lg:w-[79vw]">
          Super-Admin Panel
        </div>
        <h2 className="text-3xl mt-4 font-semibold mb-6 text-center">
          Company List
        </h2>

        <input
          type="text"
          placeholder="Search by company name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6 px-4 ml-4 py-2 border border-gray-300 rounded w-full lg:w-1/2"
        />

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <div className="overflow-x-auto pl-4">
            <table className="min-w-full border border-gray-300 text-left">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-4 py-2">Company Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Edit</th>
                  <th className="px-4 py-2">Permissions</th>
                  <th className="px-4 py-2">LogIn as Admin</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, index) => (
                  <tr key={index} className="border-t border-gray-300">
                    <td className="px-4 py-2">{company?.name}</td>
                    <td className="px-4 py-2">{company?.email}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setEditedCompany(company);
                          setIsModalOpen(true);
                        }}
                        className="text-white h-[30px] w-[70px] flex justify-center items-center rounded-xl bg-blue-950 hover:underline"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setIsPermissionModalOpen(true);
                          setGivenPermissions(company.permissions || []);
                        }}
                        className="text-white h-[30px] w-[110px] flex justify-center items-center rounded-xl bg-blue-950 hover:underline"
                      >
                        Permissions
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          dispatch(setPermissions(company.permissions || []));
                          dispatch(setCompany(company));
                          dispatch(setReduxShifts(null));
                          dispatch(setReduxManagers(null));
                          dispatch(setReduxEmployee(null));
                          dispatch(setReduxDepartments(null));
                          navigate("/adminpanel");
                        }}
                        className="text-white h-[30px] w-[170px] flex justify-center items-center rounded-xl bg-blue-950 hover:underline"
                      >
                        Login as Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && editedCompany && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-6">Edit Company Details</h3>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                {/* Company Info */}
                {[
                  ["Company Name", "name"],
                  ["Company Email", "email"],
                  ["Registration Number", "registrationNumber"],
                  ["Website", "website"],
                  ["Contact Email", "contactEmail"],
                  ["Contact Phone", "contactPhone"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                ))}

                {/* Address */}
                {[
                  ["Street", "street"],
                  ["City", "city"],
                  ["State", "state"],
                  ["Country", "country"],
                  ["Pincode", "pincode"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.address?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          address: { ...prev.address, [key]: e.target.value },
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                ))}

                {/* Tax Details */}
                {[
                  ["GST Number", "gstNumber"],
                  ["PAN Number", "panNumber"],
                  ["TAN Number", "tanNumber"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.taxDetails?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          taxDetails: {
                            ...prev.taxDetails,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                ))}

                {/* Bank Info */}
                {[
                  ["Account Holder", "accountHolderName"],
                  ["Account Number", "accountNumber"],
                  ["IFSC Code", "ifscCode"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.bankDetails?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          bankDetails: {
                            ...prev.bankDetails,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                ))}

                {/* HR Info */}
                {[
                  ["HR Name", "name"],
                  ["HR Email", "email"],
                  ["HR Phone", "phone"],
                  ["HR Designation", "designation"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="font-medium">{label}</label>
                    <input
                      type="text"
                      value={editedCompany.hrDetails?.[key] || ""}
                      onChange={(e) =>
                        setEditedCompany((prev) => ({
                          ...prev,
                          hrDetails: {
                            ...prev.hrDetails,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                    />
                  </div>
                ))}
              </form>

              <div className="md:col-span-2 mt-4">
                <label className="font-medium block mb-2">
                  Change Thumbnail
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditedCompany((prev) => ({
                        ...prev,
                        thumbnail: file,
                      }));
                    }
                  }}
                  className="input-field"
                />
                {editedCompany.thumbnail && (
                  <img
                    src={
                      editedCompany?.thumbnail instanceof File
                        ? URL.createObjectURL(editedCompany.thumbnail)
                        : editedCompany?.thumbnail
                    }
                    alt="Thumbnail Preview"
                    className="h-24 rounded shadow mt-2"
                  />
                )}
              </div>

              {/* Custom Fields */}
              <div className="md:col-span-2 mt-6">
                <label className="font-medium block mb-2">Custom Fields</label>
                {editedCompany.customFields?.map((field, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-2 mb-2"
                  >
                    <input
                      type="text"
                      placeholder="Label"
                      value={field.label}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "label", e.target.value)
                      }
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Name"
                      value={field.name}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "name", e.target.value)
                      }
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Type"
                      value={field.type}
                      onChange={(e) =>
                        handleCustomFieldChange(index, "type", e.target.value)
                      }
                      className="input-field"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          handleCustomFieldChange(
                            index,
                            "required",
                            e.target.checked
                          )
                        }
                        className="accent-blue-600"
                      />
                      Required
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomField}
                  className="mt-2 px-3 py-1 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  + Add Custom Field
                </button>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditedCompany(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDtailsHandler}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  {loading ? (<div className="loader1"></div>) : (<>Save Changes</>)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Modal */}
        {/* Permissions Modal */}
        {isPermissionModalOpen && selectedCompany && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
            <div className="bg-white w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">
                Manage Permissions for {selectedCompany.name}
              </h3>

              <form className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissions.map((perm, index) => (
                  <label
                    key={index}
                    className="flex gap-2 items-center text-sm"
                  >
                    <input
                      type="checkbox"
                      value={perm}
                      checked={givenPermissions.includes(perm)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const value = e.target.value;
                        if (checked) {
                          setGivenPermissions([...givenPermissions, value]);
                        } else {
                          setGivenPermissions(
                            givenPermissions.filter((p) => p !== value)
                          );
                        }
                      }}
                      className="accent-blue-700"
                    />
                    {perm}
                  </label>
                ))}
              </form>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsPermissionModalOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    submitPermissionsHandler(e);
                  }}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyList;
