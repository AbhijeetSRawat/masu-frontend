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

const EmployeeMasterInformation = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      const response = await apiConnector("GET", GET_ALL_SHIFTS + company._id);
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
      const res = await apiConnector("GET", GET_ALL_MANAGER + company._id);
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
      const res = await apiConnector("GET", GET_ALL_DEPARTMENTS + company._id);
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
        `${GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=${page}&limit=${limit}&search=${search}`
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

  
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Updated CSV template headers based on your images
  
  

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




  const removeCustomField = (index) => {
    setEmployeeForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
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
      <AdminSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
       <AdminHeader/>

        {loading ? (
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>

          <div className="text-3xl font-bold text-gray-800 w-full flex justify-center py-4">
            Employee Master Information
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

           
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeMasterInformation;
