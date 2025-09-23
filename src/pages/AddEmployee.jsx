import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setReduxShifts } from "../slices/shiftSlice";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import Papa from "papaparse";
import { apiConnector } from "../services/apiConnector";
import {
  companyEndpoints,
  departmentEndpoints,
  employeeEndpoints,
  shiftEndpoints,
  tablecustomisationEndpoints,
} from "../services/api";
import { setReduxManagers } from "../slices/manager";
import { setReduxDepartments } from "../slices/departments";
import { setReduxEmployee, setReduxEmployees } from "../slices/employee";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
const { GET_ALL_SHIFTS } = shiftEndpoints;
const { GET_ALL_MANAGER } = companyEndpoints;
const { GET_ALL_DEPARTMENTS } = departmentEndpoints;
const {
  GET_ALL_EMPLOYEE_BY_COMPANY_ID,
  ADD_EMPLOYEE,
  EDIT_EMPLOYEE,
  CSV_EMPLOYEE_ADD,
} = employeeEndpoints;

const { FETCH_TABLE_CUSTOMIZATION } = tablecustomisationEndpoints;

const AddEmployee = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const role = useSelector( state => state.auth.role)
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)



  const loading = useSelector((state) => state.permissions.loading);
  let number = 1;
  const departmentData = useSelector(
    (state) => state.departments.reduxDepartments
  );
  const managerData = useSelector((state) => state.managers.reduxManagers);
  const shiftsData = useSelector((state) => state.shifts.reduxShifts);

  const [tableStructures, setTableStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const getAllShifts = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector("GET", GET_ALL_SHIFTS + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      setShifts(response.data.data);
      dispatch(setReduxShifts(response.data.data));
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
      const res = await apiConnector("GET", GET_ALL_MANAGER + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      setManagers(res.data.data);
      console.log(res.data.data);
      dispatch(setReduxManagers(res.data.data));
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
      const res = await apiConnector("GET", GET_ALL_DEPARTMENTS + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      console.log(res.data.data);
      dispatch(setReduxDepartments(res.data.data));
      setDepartments(res.data.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch departments");
    } finally {
      dispatch(setLoading(false));
    }
  };

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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10; // Items per page

  const getAllEmployees = async (page = 1, search = "") => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector(
        "GET",
        `${GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=${page}&limit=${limit}&search=${search}`,
        null,
        {
          Authorization : `Bearer ${token}`,
        }
      );
      console.log("response after fetching all employees are : ",res);

      dispatch(setReduxEmployees(res.data.employees));
      setEmployees(res.data.employees);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
      setTotalEmployees(res.data.total);

      toast.success("Employees fetched successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch employees");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    getAllEmployees(page, searchQuery);
  };

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
    getAllEmployees(1, query);
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    email: "",
    profile: { firstName: "", lastName: "", phone: "" },
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
      officialEmail: "",
      personalEmail: "",
      officialMobile: "",
      personalMobile: "",
    },
    employmentDetails: {
      employeeId: "",
      designation: "",
      employmentType: "full-time",
      status: "active",
      department: "",
      joiningDate: "",
      resignationDate: "",
      lastWorkingDate: "",
      workLocation: "",
      costCenter: "",
      businessArea: "",
      pfFlag: false,
      esicFlag: false,
      ptFlag: false,
      salary: { base: "", bonus: "", taxDeductions: "" },
      shift: "",
      reportingTo: "",
      skills: [],
    },
    leaveBalance: { casual: "", sick: "", earned: "" },
    customFields: [],
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Updated CSV template headers based on your images
  const csvTemplateHeaders = [
    "Sr.no.",
    "employeeId",
    "fullName",
    "gender",
    "status",
    "dateOfBirth",
    "dateOfJoining",
    "resignationDate",
    "lastWorkingDate",
    "department",
    "designation",
    "employmentType",
    "workLocation",
    "city",
    "state",
    "panNo",
    "aadharNo",
    "uanNo",
    "esicNo",
    "bankAccountNo",
    "ifscCode",
    "officialEmail",
    "personalEmail",
    "officialMobile",
    "personalMobile",
    "costCenter",
    "businessArea",
    "pfFlag",
    "esicFlag",
    "ptFlag",
  ];

  const handleDownloadTemplate = () => {
    const csvHeaderRow = csvTemplateHeaders.join(",") + "\n";

    const sampleRow =
      [
        "1",
        "EMP001",
        "John Doe",
        "male",
        "active",
        "1990-01-15",
        "2023-01-01",
        "",
        "",
        "Engineering",
        "Software Developer",
        "full-time",
        "Office",
        "Mumbai",
        "Maharashtra",
        "ABCPD1234E",
        "123456789012",
        "123456789012",
        "1234567890",
        "1234567890123456",
        "HDFC0001234",
        "john.doe@company.com",
        "john.personal@gmail.com",
        "+919876543210",
        "+919876543211",
        "CC001",
        "IT Services",
        "true",
        "true",
        "false",
      ].join(",") + "\n";

    const csvContent = csvHeaderRow + sampleRow;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "employee-upload-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to reset form
  const resetEmployeeForm = () => {
    setEmployeeForm({
      email: "",
      profile: {
        firstName: "",
        lastName: "",
        phone: "",
        // avatar: "",
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
        employmentType: "full-time",
        status: "active",
        department: "",
        joiningDate: "",
        resignationDate: "",
        lastWorkingDate: "",
        workLocation: "",
        costCenter: "",
        businessArea: "",
        pfFlag: false,
        esicFlag: false,
        ptFlag: false,
        salary: { base: "", bonus: "", taxDeductions: "" },
        shift: "",
        reportingTo: "",
        skills: [],
      },
      leaveBalance: { casual: 0, sick: 0, earned: 0 },
      customFields: [],
    });
  };

  const handleEditEmployee = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeForm({
      email: emp.user?.email || "",
      profile: {
        firstName: emp.user?.profile?.firstName || "",
        lastName: emp.user?.profile?.lastName || "",
        phone: emp.user?.profile?.phone || "",
        // avatar: emp.user?.profile?.avatar || "",
      },
      personalDetails: emp.personalDetails || {
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
        employeeId: emp.employmentDetails?.employeeId || "",
        designation: emp.employmentDetails?.designation || "",
        employmentType: emp.employmentDetails?.employmentType || "full-time",
        status: emp.employmentDetails?.status || "active",
        department: emp.employmentDetails?.department || "",
        joiningDate: emp.employmentDetails?.joiningDate?.slice(0, 10) || "",
        resignationDate:
          emp.employmentDetails?.resignationDate?.slice(0, 10) || "",
        lastWorkingDate:
          emp.employmentDetails?.lastWorkingDate?.slice(0, 10) || "",
        workLocation: emp.employmentDetails?.workLocation || "",
        costCenter: emp.employmentDetails?.costCenter || "",
        businessArea: emp.employmentDetails?.businessArea || "",
        pfFlag: emp.employmentDetails?.pfFlag || false,
        esicFlag: emp.employmentDetails?.esicFlag || false,
        ptFlag: emp.employmentDetails?.ptFlag || false,
        salary: {
          base: emp.employmentDetails?.salary?.base || 0,
          bonus: emp.employmentDetails?.salary?.bonus || 0,
          taxDeductions: emp.employmentDetails?.salary?.taxDeductions || 0,
        },
        shift: emp.employmentDetails?.shift || "",
        reportingTo: emp.employmentDetails?.reportingTo || "",
        skills: emp.employmentDetails?.skills || [],
      },
      leaveBalance: emp.leaveBalance || { casual: 0, sick: 0, earned: 0 },
      // Load existing custom fields from both user and employee
      customFields: [
        ...(emp.user?.customFields || []),
        ...(emp.customFields || []),
      ],
    });
    setIsEditModalOpen(true);
  };

  const loginAsEmployee = (emp) => {
    try {
      dispatch(setReduxEmployee(emp));
      navigate("/employeepanel");
      toast.success(
        `Logged in as ${emp.user.profile.firstName} ${emp.user.profile.lastName}`
      );
    } catch (error) {
      console.log(error);
      toast.error("Unable to LogIn");
    }
  };

  // Custom field handlers
  const addCustomField = () => {
    setEmployeeForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          label: "",
          name: "",
          type: "text",
          required: false,
          defaultValue: "",
        },
      ],
    }));
  };

  const updateCustomField = (index, field, value) => {
    setEmployeeForm((prev) => {
      const newFields = [...prev.customFields];
      newFields[index] = {
        ...newFields[index],
        [field]: value,
      };
      return {
        ...prev,
        customFields: newFields,
      };
    });
  };

  const removeCustomField = (index) => {
    setEmployeeForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const submitHandler = async () => {
    try {
      dispatch(setLoading(true));
      const payload = {
        email: employeeForm.email,
        profile: employeeForm.profile,
        companyId: company._id,
        personalDetails: employeeForm.personalDetails,
        employmentDetails: {
          ...employeeForm.employmentDetails,
        },
        leaveBalance: employeeForm.leaveBalance,
        customFields: employeeForm.customFields, // Fixed typo
      };

      if (isAddModalOpen) {
        await apiConnector("POST", ADD_EMPLOYEE, payload,{
          Authorization : `Bearer ${token}`,
        });
        toast.success("Employee added successfully!");
        setIsAddModalOpen(false);
      } else {
        await apiConnector(
          "PUT",
          `${EDIT_EMPLOYEE}${selectedEmployee.user._id}`,
          payload,{
            Authorization : `Bearer ${token}`,
          }
        );
        toast.success("Employee updated successfully!");
        setIsEditModalOpen(false);
      }

      setSelectedEmployee(null);
      resetEmployeeForm();
      await getAllEmployees();
    } catch (err) {
      console.error(err);
      toast.error("Employee save failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        try {
          dispatch(setLoading(true));
          const rawEmployees = results.data;

          const emailSet = new Set(); // Prevent duplicates

          const formattedEmployees = rawEmployees
            .map((emp, index) => {
              // Parse full name
              const nameParts = (emp.fullName || "").trim().split(" ");
              const firstName = nameParts[0] || "";
              const lastName = nameParts.slice(1).join(" ") || "";

              const departmentMatch = departments.find(
                (d) =>
                  d.name?.toLowerCase().trim() ===
                  emp.department?.toLowerCase().trim()
              );
              const shiftMatch = shifts.find(
                (s) =>
                  s.name?.toLowerCase().trim() ===
                  emp.shiftName?.toLowerCase().trim()
              );
              const managerMatch = managers.find((m) => {
                const fullName = `${m.user?.profile?.firstName || ""} ${
                  m.user?.profile?.lastName || ""
                }`.trim();
                return (
                  fullName.toLowerCase() ===
                  emp.reportingToName?.toLowerCase().trim()
                );
              });

              // Use personalEmail as primary email, fallback to official Email
              const primaryEmail = emp.officialEmail || emp.personalEmail || "";

              // Ensure email is unique in current batch
              if (emailSet.has(primaryEmail) || !primaryEmail) return null;
              emailSet.add(primaryEmail);

              return {
                email: primaryEmail,
                profile: {
                  firstName: firstName,
                  lastName: lastName,
                  phone: emp.officialMobile || emp.personalMobile || "",
                  // avatar: "",
                },
                companyId: company._id,
                personalDetails: {
                  gender: emp.gender?.toLowerCase() || "",
                  dateOfBirth: emp.dateOfBirth || "",
                  city: emp.city || "",
                  state: emp.state || "",
                  panNo: emp.panNo || "",
                  aadharNo: emp.aadharNo || "",
                  uanNo: emp.uanNo || "",
                  esicNo: emp.esicNo || "",
                  bankAccountNo: emp.bankAccountNo || "",
                  ifscCode: emp.ifscCode || "",
                  personalEmail: emp.personalEmail || "",
                  officialMobile: emp.officialMobile || "",
                  personalMobile: emp.personalMobile || "",
                },
                employmentDetails: {
                  employeeId: emp?.employeeId || "",
                  designation: emp.designation || "",
                  employmentType:
                    emp.employmentType?.toLowerCase() || "full-time",
                  status: emp.status?.toLowerCase() || "active",
                  department: departmentMatch?._id || null,
                  joiningDate: emp.dateOfJoining || "",
                  resignationDate: emp.resignationDate || "",
                  lastWorkingDate: emp.lastWorkingDate || "",
                  workLocation: emp.workLocation || "",
                  costCenter: emp.costCenter || "",
                  businessArea: emp.businessArea || "",
                  pfFlag: emp.pfFlag?.toLowerCase() === "true" || false,
                  esicFlag: emp.esicFlag?.toLowerCase() === "true" || false,
                  ptFlag: emp.ptFlag?.toLowerCase() === "true" || false,
                },
              };
            })
            .filter(Boolean); // remove any null entries

          const payload = {
            employees: formattedEmployees,
          };

          console.log("📦 Final CSV Payload:", payload);

          const data = await apiConnector("POST", CSV_EMPLOYEE_ADD, payload,{
            Authorization : `Bearer ${token}`,
          });
          console.log("🧾 Server response:", data);

          if (data.data.failed.length === 0) {
            toast.success(
              `${formattedEmployees.length} employees added via CSV`
            );
            getAllEmployees();
          } else {
            toast.error(
              data.message ||
                "Some data was found not suitable during CSV upload"
            );
          }
        } catch (err) {
          console.error("🚨 CSV upload failed:", err);
          toast.error("Failed to upload CSV");
        } finally {
          dispatch(setLoading(false));
        }
      },
    });
  };

  useEffect(() => {
    if (company?._id) {
      getAllEmployees(1, "");
    }
  }, [company]);

  useEffect(() => {
    if (shiftsData) {
      setShifts(shiftsData);
      dispatch(setReduxShifts(shiftsData));
    } else {
      getAllShifts();
    }

    if (managerData) {
      setManagers(managerData);
      dispatch(setReduxManagers(managerData));
    } else {
      getAllManagers();
    }

    if (departmentData) {
      setDepartments(departmentData);
      dispatch(setReduxDepartments(departmentData));
    } else {
      getAllDepartments();
    }

    fetchStructures();
   
  }, []);

  let filteredEmployees = null;

  if (searchTerm) {
    filteredEmployees = employees.filter(
      (emp) =>
        emp?.employmentDetails?.department?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        emp?.employmentDetails?.shift?.name
          ?.toLowerCase()
          ?.includes(searchTerm.toLowerCase())
    );
  } else {
    filteredEmployees = employees;
  }

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
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-6 mt-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                + Add Employee
              </button>

              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csvUpload"
              />
              <div className="flex gap-3 justify-end items-center px-6 mt-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Download CSV Template
                </button>
                <label
                  htmlFor="csvUpload"
                  className="bg-green-700 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-800"
                >
                  + Add with CSV
                </label>
              </div>
            </div>
            {/* Search Input */}
            {/* <div className="px-6 mb-4">
  <div className="flex justify-between items-center">
    <input
      type="text"
      placeholder="Search employees by name, email, or mobile..."
      value={searchQuery}
      onChange={handleSearch}
      className="px-4 py-2 border border-gray-300 rounded-lg w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <div className="text-sm text-gray-600">
      Showing {employees.length} of {totalEmployees} employees
    </div>
  </div>
</div> */}
            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full border border-gray-300 mb-3 text-left text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2">Sr.No.</th>
                    <th className="px-4 py-2">EmployeeId</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Designation</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Shift</th>
                    <th className="px-4 py-2">Reporting To</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((emp, index) => (
                      <tr key={emp._id} className="border-t border-gray-300">
                        <td className="px-4 py-2">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="px-4 py-2">
                          {emp?.employmentDetails?.employeeId || ""}
                        </td>
                        <td className="px-4 py-2">
                          {emp.user?.profile?.firstName}{" "}
                          {emp.user?.profile?.lastName}
                        </td>
                        <td className="px-4 py-2">
                          {emp.user?.email?.length > 25 ? (
                            <>{emp.user?.email.substr(0, 25)}...</>
                          ) : (
                            <>{emp.user?.email}</>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {emp.employmentDetails?.designation}
                        </td>
                        <td className="px-4 py-2">
                          {emp.user?.profile?.department?.name ||
                            emp.employmentDetails?.department?.name}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              emp.isActive
                                ? "bg-green-100 text-green-800"
                                : emp.isActive 
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {emp.isActive ? "active" :"inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {emp.employmentDetails.shift?.name}
                        </td>
                        <td className="px-4 py-2">
                          {managers.find(
                            (m) =>
                              m._id === emp.employmentDetails?.reportingTo?._id
                          )?.user?.profile?.firstName || "—"}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            onClick={() => handleEditEmployee(emp)}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800"
                            onClick={() => loginAsEmployee(emp)}
                          >
                            Login as Employee
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-300">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded ${
                              page === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 py-1 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {(isAddModalOpen || isEditModalOpen) && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    {isAddModalOpen ? "Add Employee" : "Edit Employee"}
                  </h2>

                  <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {/* Basic Information */}
                    <div className="col-span-full">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Employee ID
                      </label>
                      <input
                        placeholder="Enter employee ID"
                        value={employeeForm.employmentDetails.employeeId}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              employeeId: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                   

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        placeholder="Enter first name"
                        value={employeeForm.profile.firstName}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              firstName: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        placeholder="Enter last name"
                        value={employeeForm.profile.lastName}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              lastName: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                     <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Official Email
                      </label>
                      <input
                        placeholder="Enter email address"
                        type="email"
                        value={employeeForm.email}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={employeeForm.personalDetails.gender}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              gender: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={employeeForm.personalDetails.dateOfBirth}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              dateOfBirth: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Contact Information */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Contact Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Personal Email
                      </label>
                      <input
                        placeholder="Enter personal email"
                        type="email"
                        value={employeeForm.personalDetails.personalEmail}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              personalEmail: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Official Mobile
                      </label>
                      <input
                        placeholder="Enter official mobile number"
                        type="tel"
                        value={employeeForm.personalDetails.officialMobile}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              officialMobile: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Personal Mobile
                      </label>
                      <input
                        placeholder="Enter personal mobile number"
                        type="tel"
                        value={employeeForm.personalDetails.personalMobile}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              personalMobile: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        placeholder="Enter city"
                        value={employeeForm.personalDetails.city}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              city: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        placeholder="Enter state"
                        value={employeeForm.personalDetails.state}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              state: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Employment Details */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Employment Details
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Designation
                      </label>
                      <input
                        placeholder="Enter job designation"
                        value={employeeForm.employmentDetails.designation}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              designation: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={employeeForm.employmentDetails.joiningDate}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              joiningDate: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Employment Type
                      </label>
                      <select
                        value={employeeForm.employmentDetails.employmentType}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              employmentType: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="full-time">Full-Time</option>
                        <option value="part-time">Part-Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Employment Status
                      </label>
                      <select
                        value={employeeForm.employmentDetails.status}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              status: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={employeeForm.employmentDetails.department}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              department: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dep) => (
                          <option key={dep._id} value={dep._id}>
                            {dep.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Shift
                      </label>
                      <select
                        value={employeeForm.employmentDetails.shift}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              shift: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Shift</option>
                        {shifts.map((shift) => (
                          <option key={shift._id} value={shift._id}>
                            {shift.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Reporting Manager
                      </label>
                      <select
                        value={employeeForm.employmentDetails.reportingTo}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              reportingTo: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Manager</option>
                        {managers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.user?.profile?.firstName}{" "}
                            {m.user?.profile?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Work Location
                      </label>
                      <input
                        placeholder="Enter work location"
                        value={employeeForm.employmentDetails.workLocation}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              workLocation: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Cost Center
                      </label>
                      <input
                        placeholder="Enter cost center"
                        value={employeeForm.employmentDetails.costCenter}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              costCenter: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Business Area
                      </label>
                      <input
                        placeholder="Enter business area"
                        value={employeeForm.employmentDetails.businessArea}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              businessArea: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Flags */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Compliance Flags
                      </h3>
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employeeForm.employmentDetails.pfFlag}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              pfFlag: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span className="text-sm font-medium">
                        PF Flag (Provident Fund)
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employeeForm.employmentDetails.esicFlag}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              esicFlag: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span className="text-sm font-medium">
                        ESIC Flag (Employee State Insurance)
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employeeForm.employmentDetails.ptFlag}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              ptFlag: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span className="text-sm font-medium">
                        PT Flag (Professional Tax)
                      </span>
                    </label>

                    {/* Government IDs */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Government IDs & Banking
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        PAN Number
                      </label>
                      <input
                        placeholder="Enter PAN number"
                        value={employeeForm.personalDetails.panNo}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              panNo: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Aadhar Number
                      </label>
                      <input
                        placeholder="Enter Aadhar number"
                        value={employeeForm.personalDetails.aadharNo}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              aadharNo: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        UAN Number
                      </label>
                      <input
                        placeholder="Enter UAN number"
                        value={employeeForm.personalDetails.uanNo}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              uanNo: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        ESIC Number
                      </label>
                      <input
                        placeholder="Enter ESIC number"
                        value={employeeForm.personalDetails.esicNo}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              esicNo: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        placeholder="Enter bank account number"
                        value={employeeForm.personalDetails.bankAccountNo}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              bankAccountNo: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        IFSC Code
                      </label>
                      <input
                        placeholder="Enter IFSC code"
                        value={employeeForm.personalDetails.ifscCode}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              ifscCode: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Salary Information */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Salary Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Base Salary
                      </label>
                      <input
                        placeholder="Enter base salary"
                        type="number"
                        value={employeeForm.employmentDetails.salary.base}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              salary: {
                                ...prev.employmentDetails.salary,
                                base: e.target.value,
                              },
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Bonus
                      </label>
                      <input
                        placeholder="Enter bonus amount"
                        type="number"
                        value={employeeForm.employmentDetails.salary.bonus}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              salary: {
                                ...prev.employmentDetails.salary,
                                bonus: e.target.value,
                              },
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Tax Deductions
                      </label>
                      <input
                        placeholder="Enter tax deductions"
                        type="number"
                        value={
                          employeeForm.employmentDetails.salary.taxDeductions
                        }
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              salary: {
                                ...prev.employmentDetails.salary,
                                taxDeductions: e.target.value,
                              },
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Skills & Leave Balance */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Skills & Leave Balance
                      </h3>
                    </div>

                    <div className="flex flex-col col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Skills (comma separated)
                      </label>
                      <input
                        placeholder="e.g., JavaScript, React, Node.js"
                        value={employeeForm.employmentDetails.skills.join(", ")}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              skills: e.target.value
                                .split(",")
                                .map((s) => s.trim()),
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Casual Leaves
                      </label>
                      <input
                        placeholder="Number of casual leaves"
                        type="number"
                        value={employeeForm.leaveBalance.casual}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            leaveBalance: {
                              ...prev.leaveBalance,
                              casual: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Sick Leaves
                      </label>
                      <input
                        placeholder="Number of sick leaves"
                        type="number"
                        value={employeeForm.leaveBalance.sick}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            leaveBalance: {
                              ...prev.leaveBalance,
                              sick: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Earned Leaves
                      </label>
                      <input
                        placeholder="Number of earned leaves"
                        type="number"
                        value={employeeForm.leaveBalance.earned}
                        onChange={(e) =>
                          setEmployeeForm((prev) => ({
                            ...prev,
                            leaveBalance: {
                              ...prev.leaveBalance,
                              earned: e.target.value,
                            },
                          }))
                        }
                        className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Custom Fields Section */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Custom Fields
                      </h3>
                    </div>

                    <div className="col-span-full">
                      {employeeForm.customFields.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {employeeForm.customFields.map((field, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-gray-700 mb-1">
                                    Field Label
                                  </label>
                                  <input
                                    placeholder="e.g., Emergency Contact"
                                    value={field.label}
                                    onChange={(e) =>
                                      updateCustomField(
                                        index,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>

                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-gray-700 mb-1">
                                    Field Name (ID)
                                  </label>
                                  <input
                                    placeholder="e.g., emergency_contact"
                                    value={field.name}
                                    onChange={(e) =>
                                      updateCustomField(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              <div className="mt-3 flex items-center">
                                <input
                                  type="checkbox"
                                  id={`required-${index}`}
                                  checked={field.required}
                                  onChange={(e) =>
                                    updateCustomField(
                                      index,
                                      "required",
                                      e.target.checked
                                    )
                                  }
                                  className="mr-2"
                                />
                                <label
                                  htmlFor={`required-${index}`}
                                  className="text-sm text-gray-600"
                                >
                                  Required field
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={addCustomField}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        + Add Custom Field
                      </button>
                    </div>

                    {/* Exit Details (if applicable) */}
                    {employeeForm.employmentDetails.status !== "active" && (
                      <>
                        <div className="col-span-full mt-4">
                          <h3 className="text-lg font-semibold mb-2 text-blue-900">
                            Exit Details
                          </h3>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Resignation Date
                            <span className="text-xs text-gray-500 block">
                              Date when employee submitted resignation
                            </span>
                          </label>
                          <input
                            type="date"
                            value={
                              employeeForm.employmentDetails.resignationDate
                            }
                            onChange={(e) =>
                              setEmployeeForm((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  resignationDate: e.target.value,
                                },
                              }))
                            }
                            className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 mb-1">
                            Last Working Date
                            <span className="text-xs text-gray-500 block">
                              Final date of employment
                            </span>
                          </label>
                          <input
                            type="date"
                            value={
                              employeeForm.employmentDetails.lastWorkingDate
                            }
                            onChange={(e) =>
                              setEmployeeForm((prev) => ({
                                ...prev,
                                employmentDetails: {
                                  ...prev.employmentDetails,
                                  lastWorkingDate: e.target.value,
                                },
                              }))
                            }
                            className="input-field px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </form>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                        setSelectedEmployee(null);
                        resetEmployeeForm();
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitHandler}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors"
                    >
                      {isAddModalOpen ? "Add Employee" : "Save Changes"}
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

export default AddEmployee;
