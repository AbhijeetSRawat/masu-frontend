import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { employeeEndpoints, leaveEndpoints, leavepolicyendpoints } from "../services/api";
import { setReduxEmployees } from "../slices/employee";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { GET_ALL_EMPLOYEE_BY_COMPANY_ID } = employeeEndpoints;
const { getRestLeaveofEmployee } = leaveEndpoints;
const { getLeavePolicy } = leavepolicyendpoints;

const AdminLeaveBalance = () => {
  const company = useSelector((state) => state.permissions.company);
  const employees = useSelector((state) => state.employees.reduxEmployees);
  const loading = useSelector((state) => state.permissions.loading);
  const dispatch = useDispatch();

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [leaveData, setLeaveData] = useState(null);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [tableData, setTableData] = useState([]);
  const limit = 10;

  const getAllEmployees = async (page = 1) => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector(
        "GET",
        `${GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=${page}&limit=${limit}`,
        null,
        {
          Authorization : `Bearer ${token}`,
        }
      );
      dispatch(setReduxEmployees(res.data.employees));
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch employees");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchRestLeaves = async (employeeId) => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", getRestLeaveofEmployee + employeeId + "/summary",null,{
        Authorization : `Bearer ${token}`,
      });
      setLeaveData(res.data);
    } catch (error) {
      console.log("Error fetching leave data:", error);
      toast.error("Failed to fetch leave data");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchLeavePolicy = async () => {
    try {
      const res = await apiConnector("GET", getLeavePolicy + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      setLeavePolicy(res.data.policy);
    } catch (error) {
      console.log("Error fetching leave policy:", error);
      toast.error("Failed to fetch leave policy");
    }
  };

  const processLeaveData = () => {
    if (!leaveData?.summary || !leavePolicy?.leaveTypes) return;

    const processed = leavePolicy.leaveTypes.map((type) => {
      const summary = leaveData.summary[type.name] || {};
      const approvedDays = summary.approved?.days || 0;
      const totalAllocated = type.maxInstancesPerYear || 0;
      const remaining = Math.max(totalAllocated - approvedDays, 0);

      return {
        leaveType: type.name,
        shortCode: type.shortCode,
        totalAllocated,
        leavesTaken: approvedDays,
        leavesRemaining: remaining,
        unpaid: type.unpaid,
      };
    });

    setTableData(processed);
  };

  const handleEmployeeClick = async (employee) => {

   
    setSelectedEmployee(employee);
    await fetchLeavePolicy();
    await fetchRestLeaves(employee._id);
    setShowModal(true);
  };

  useEffect(() => {
    if (company) {
      getAllEmployees();
    }
  }, [company]);

  useEffect(() => {
    if (leaveData && leavePolicy) {
      processLeaveData();
    }
  }, [leaveData, leavePolicy]);

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

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Employee Leave Balance</h2>

          {/* Employee Table */}
          <table className="w-full border rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-800">{emp?.employmentDetails?.employeeId}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {emp.user?.profile?.firstName} {emp.user?.profile?.lastName}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEmployeeClick(emp)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                      View Leave Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-6 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => getAllEmployees(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedEmployee && (
          <div className="fixed inset-0 backdrop-blur-2xl bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-2 text-blue-800">
                Leave Summary for {selectedEmployee.user?.profile?.firstName} {selectedEmployee.user?.profile?.lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{selectedEmployee.user?.email}</p>

              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Type</th>
                    <th className="px-4 py-2 text-left text-sm">Code</th>
                    <th className="px-4 py-2 text-left text-sm">Allocated</th>
                    <th className="px-4 py-2 text-left text-sm">Taken</th>
                    <th className="px-4 py-2 text-left text-sm">Remaining</th>
                    <th className="px-4 py-2 text-left text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 text-sm">{row.leaveType}</td>
                      <td className="px-4 py-2 text-sm">{row.shortCode}</td>
                      <td className="px-4 py-2 text-sm">{row.totalAllocated}</td>
                      <td className="px-4 py-2 text-sm">{row.leavesTaken}</td>
                      <td className="px-4 py-2 text-sm text-green-700 font-semibold">{row.leavesRemaining}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.unpaid ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {row.unpaid ? "Unpaid" : "Paid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaveBalance