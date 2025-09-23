import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { leaveEndpoints, leavepolicyendpoints } from "../services/api";

const { getRestLeaveofEmployee } = leaveEndpoints;
const { getLeavePolicy } = leavepolicyendpoints;

const LeaveBalance = () => {
  const [leaveData, setLeaveData] = useState(null);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [tableData, setTableData] = useState([]);

  const loading = useSelector((state) => state.permissions.loading);
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const company = useSelector((state) => state.permissions.company);
  const dispatch = useDispatch();

  const fetchRestLeaves = async () => {
    try {
      dispatch(setLoading(true));
      const leaves = await apiConnector("GET", getRestLeaveofEmployee + employee._id + "/summary",null,{
        Authorization : `Bearer ${token}`,
      });
      setLeaveData(leaves.data);
      console.log("Leave data:", leaves.data);
    } catch (error) {
      console.log("Error in fetching the rest leaves:", error);
      toast.error("Failed to fetch leave data");
    }
  };

  const fetchLeavePolicy = async () => {
    try {
      const policy = await apiConnector("GET", getLeavePolicy + company._id,null,{
        Authorization : `Bearer ${token}`,
      });
      setLeavePolicy(policy.data.policy);
      console.log("Leave policy:", policy.data.policy);
    } catch (error) {
      console.log("Error in fetching leave policy:", error);
      toast.error("Failed to fetch leave policy");
    }
  };

  const processLeaveData = () => {
    if (!leaveData || !leavePolicy) return;

    const processedData = leavePolicy.leaveTypes.map((leaveType) => {
      const leaveTypeName = leaveType.name;
      const leaveTypeData = leaveData.summary[leaveTypeName];

      const approvedDays = leaveTypeData?.approved?.days || 0;
      const totalAllocation = leaveType.maxInstancesPerYear || 0;
      const remainingLeaves = Math.max(totalAllocation - approvedDays, 0);

      return {
        leaveType: leaveType.name,
        shortCode: leaveType.shortCode,
        totalAllocated: totalAllocation,
        leavesTaken: approvedDays,
        leavesRemaining: remainingLeaves,
        unpaid: leaveType.unpaid,
      };
    });

    setTableData(processedData);
  };

  useEffect(() => {
    if (employee && company) {
      fetchRestLeaves();
      fetchLeavePolicy();
    }
  }, [employee, company]);

  useEffect(() => {
    if (leaveData && leavePolicy) {
      processLeaveData();
      dispatch(setLoading(false));
    }
  }, [leaveData, leavePolicy]);

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <EmployeeHeader />
        {loading ? (
          <div className="flex w-full h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Leave Balance Summary</h2>
                <p className="text-gray-600 mt-1">Year: {leaveData?.year || new Date().getFullYear()}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Allocated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaves Taken</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaves Remaining</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{row.leaveType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.shortCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{row.totalAllocated}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{row.leavesTaken}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${row.leavesRemaining > 0 ? "text-green-600" : "text-red-600"}`}>
                            {row.leavesRemaining}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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

                {tableData.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No leave data available</p>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Leaves Allocated</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {tableData.reduce((sum, row) => sum + row.totalAllocated, 0)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Leaves Taken</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {tableData.reduce((sum, row) => sum + row.leavesTaken, 0)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Leaves Remaining</div>
                    <div className="text-2xl font-bold text-green-600">
                      {tableData.reduce((sum, row) => sum + row.leavesRemaining, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalance;
