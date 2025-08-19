import React, { useState } from "react";
// import axios from "axios";
//import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
// import { registerCompany } from "../services/operations/companyAPI";

import { companyEndpoints } from "../services/api";
import { apiConnector } from "../services/apiConnector";
import SuperAdminHeader from "../components/SuperAdminHeader";

const { REGISTER_API } = companyEndpoints;

function RegisterCompany() {
  // const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    registrationNumber: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",

    gstNumber: "",
    panNumber: "",
    tanNumber: "",

    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",

    hrName: "",
    hrEmail: "",
    hrPhone: "",
    hrDesignation: "",

    customFields: [], // Will store custom fields based on user input
  });

  const [optionalFields, setOptionalFields] = useState([]); // Fields that can be optional
  const [removedFields, setRemovedFields] = useState([]); // Fields that are removed
  const [customFields, setCustomFields] = useState([{ label: "", name: "" }]); // Custom fields for additional input
  const [loading, setLoading] = useState(false);

  const staticFields = [
    { label: "Company Name", name: "name" },
    { label: "Email", name: "email" },
    { label: "Registration Number", name: "registrationNumber" },
    { label: "Website", name: "website" },
    { label: "Contact Email", name: "contactEmail" },
    { label: "Contact Phone", name: "contactPhone" },
    { label: "Street", name: "street" },
    { label: "City", name: "city" },
    { label: "State", name: "state" },
    { label: "Pincode", name: "pincode" },
    { label: "GST Number", name: "gstNumber" },
    { label: "PAN Number", name: "panNumber" },
    { label: "TAN Number", name: "tanNumber" },
    { label: "IFSC Code", name: "ifscCode" },
    { label: "Bank Name", name: "bankName" },
    { label: "Account Number", name: "accountNumber" },

    { label: "Account Holder Name", name: "accountHolderName" },
    { label: "HR Name", name: "hrName" },
    { label: "HR Email", name: "hrEmail" },
    { label: "HR Phone", name: "hrPhone" },
    { label: "HR Designation", name: "hrDesignation" },
  ];

  const noOptional = [
    "name",
    "email",
    "registrationNumber",
    "contactEmail",
    "gstNumber",
    "panNumber",
    "tanNumber",
  ];

  const handleFieldChange = (e, path) => {
    const keys = path.split(".");
    const updatedFormData = { ...formData };
    let nested = updatedFormData;
    for (let i = 0; i < keys.length - 1; i++) {
      nested = nested[keys[i]];
    }
    nested[keys[keys.length - 1]] = e.target.value;
    setFormData(updatedFormData);
  };

  const toggleOptional = (field) => {
    setOptionalFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const removeField = (field) => {
    setRemovedFields((prev) => [...prev, field]);
  };

  const handleCustomChange = (index, key, value) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { label: "", name: "" }]);
  };

  const initialState = {
    name: "",
    email: "",
    registrationNumber: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",

    gstNumber: "",
    panNumber: "",
    tanNumber: "",

    ifscCode: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",

    hrName: "",
    hrEmail: "",
    hrPhone: "",
    hrDesignation: "",

    thumbnailFile: null,
    customFields: [],
  };

  const removeCustomField = (index) => {
    const updated = [...customFields];
    updated.splice(index, 1);
    setCustomFields(updated);
  };

  const ifscHandler = async () => {
    try {
      setLoading(true);
      const bankResponse = await apiConnector(
        "GET",
        "https://ifsc.razorpay.com/" + formData.ifscCode
      );
      console.log(bankResponse);
      setFormData((prev) => ({
        ...prev,
        bankName: bankResponse?.data?.BANK,
      }));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();

    // Append static fields
    Object.keys(formData).forEach((key) => {
      if (key === "customFields") return; // skip for now
      form.append(key, formData[key]);
    });

    // Append custom fields
    form.append(
      "customFields",
      JSON.stringify(
        customFields.filter(
          (f) => f.label.trim() !== "" && f.name.trim() !== ""
        )
      )
    );

    form.append("optionalFields", JSON.stringify(optionalFields));
    form.append("removedFields", JSON.stringify(removedFields));

    // Append thumbnail image
    if (formData.thumbnailFile) {
      form.append("thumbnail", formData.thumbnailFile); // file object
    }

    try {
      const response = await apiConnector("POST", REGISTER_API, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response;
      console.log(data);
      Swal.fire({
        icon: "success",
        title: "Success",
        html: `
        <p><strong>${
          data.message || "Company registered successfully!"
        }</strong></p>
        <hr/>
        <p><strong>Company ID:</strong> ${data.data?.companyId}</p>
        <p><strong>Admin Email:</strong> ${data.data.adminEmail}</p>
        <p><strong>Temp Password:</strong> ${data.data.password}</p>
      `,
        confirmButtonText: "Continue",
      });

      // Complete form reset
      setFormData({ ...initialState });
      setCustomFields([{ label: "", name: "" }]);
      setOptionalFields([]); // Reset optional checkboxes
      setRemovedFields([]); // Reset removed fields
      
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err) {
      console.log(err);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err.response?.data?.message || "Failed to register company.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex relative ">
      <Sidebar />
      <div className="max-w-screen mx-auto pb-4 bg-white rounded shadow lg:w-[79vw] lg:ml-[20vw]">
       <SuperAdminHeader/>
        <h2 className="text-3xl font-semibold mt-4 mb-6 text-center text-blue-950">
          Register Company
        </h2>
        <form
          onSubmit={handleSubmit}
          className="lg:flex lg:flex-col lg:items-center"
        >
          {staticFields.map(({ label, name }) => {
            if (removedFields.includes(name)) return null;
            const isOptional = optionalFields.includes(name);
            const value =
              name.split(".").reduce((acc, key) => acc?.[key], formData) || "";

            return (
              <div
                key={name}
                className="flex items-center justify-between border p-2 mb-2 rounded lg:w-[80%]"
              >
                <input
                  className="w-full p-2 border rounded placeholder:to-blue-950"
                  placeholder={label}
                  value={value}
                  required={!isOptional}
                  onChange={
                    
                      (e) => handleFieldChange(e, name)
                  }
                />

                {!noOptional.includes(name) && (
                  <div className="flex items-center gap-2 ml-2">
                    <label className="flex items-center gap-1 text-sm ">
                      <input
                        type="checkbox"
                        checked={isOptional}
                        onChange={() => toggleOptional(name)}
                      />
                      Optional
                    </label>
                  </div>
                )}

                {name === "ifscCode" && (
                  <div
                    className="w-[5vw] h-[5vh] bg-amber-600 text-white ml-2 flex cursor-pointer justify-center items-center rounded-2xl shadow"
                    onClick={ifscHandler}
                  >
                    Find
                  </div>
                )}

                {noOptional.includes(name) && (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="flex items-center gap-1 text-md text-red-500">
                      Required*
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-6 lg:w-[80%]">
            <label className="block font-semibold mb-2">Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setFormData((prev) => ({
                    ...prev,
                    thumbnailFile: file,
                  }));
                }
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Custom Fields</h3>
            {customFields.map((field, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="label"
                  value={field.label}
                  onChange={(e) =>
                    handleCustomChange(index, "label", e.target.value)
                  }
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="name"
                  value={field.name}
                  onChange={(e) =>
                    handleCustomChange(index, "name", e.target.value)
                  }
                  className="flex-1 p-2 border rounded"
                />
                {customFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="text-red-500 text-xl"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCustomField}
              className="text-blue-600 text-sm hover:underline mt-1"
            >
              + Add Custom Field
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-950 text-white px-4 py-2 rounded mt-6"
          >
            {loading ? "Registering..." : "Register Company"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterCompany;