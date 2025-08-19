import React, { useEffect, useState } from "react";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { useDispatch, useSelector } from "react-redux";
import { leaveEndpoints, leavepolicyendpoints } from "../services/api";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import EmployeeHeader from "../components/EmployeeHeader";

const { APPLY_LEAVE, GET_EMPLOYEE_LEAVES, cancelLeave } = leaveEndpoints;
const { getLeavePolicy } = leavepolicyendpoints;

const AddLeave = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const company = useSelector((state) => state.permissions.company);

  const token = useSelector((state) => state.auth.token);

  const [leaves, setLeaves] = useState([]);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const dispatch = useDispatch();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "",
    shortCode: "",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
    halfDayType: null,
    documents: [],
  });

  // File validation
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `File ${file.name} has unsupported format. Allowed formats: PDF, JPG, PNG, DOC, DOCX.`
      );
    }

    return true;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    try {
      // Validate each file
      files.forEach(validateFile);

      // Limit to 5 files maximum
      if (files.length > 5) {
        toast.error("Maximum 5 files allowed");
        return;
      }

      setSelectedFiles(files);
      setLeaveForm((prev) => ({ ...prev, documents: files }));

      if (files.length > 0) {
        toast.success(`${files.length} file(s) selected`);
      }
    } catch (error) {
      toast.error(error.message);
      e.target.value = ""; // Reset file input
    }
  };

  // Remove selected file
  const removeFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setLeaveForm((prev) => ({ ...prev, documents: updatedFiles }));

    // Reset file input
    const fileInput = document.getElementById("document-upload");
    if (fileInput) fileInput.value = "";
  };

  // Calculate business days between dates
  const calculateBusinessDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return 0;

    let count = 0;
    const current = new Date(start);

    // Get weekOff days from policy or default to weekend
    const weekOffDays = leavePolicy?.weekOff || [0, 6]; // Sunday and Saturday

    while (current <= end) {
      const day = current.getDay();
      if (!weekOffDays.includes(day)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  // Auto-calculate days when dates change
  useEffect(() => {
    if (leaveForm.startDate && leaveForm.endDate) {
      if (leaveForm.isHalfDay) {
        // For half day, start and end date should be same
        if (leaveForm.startDate === leaveForm.endDate) {
          // Days will be set to 0.5 in backend
        } else {
          toast.error(
            "For half day leave, start and end date must be the same"
          );
          setLeaveForm((prev) => ({ ...prev, endDate: prev.startDate }));
        }
      } else {
        const days = calculateBusinessDays(
          leaveForm.startDate,
          leaveForm.endDate
        );
        if (days <= 0) {
          toast.error("No business days found in the selected date range");
        }
      }
    }
  }, [
    leaveForm.startDate,
    leaveForm.endDate,
    leaveForm.isHalfDay,
    leavePolicy,
  ]);

  const getEmployeeLeaves = async () => {
    try {
      dispatch(setLoading(true));
      console.log("Fetching leaves for employee:", employee._id);

      // Updated API call to match your backend structure
      const result = await apiConnector(
        "GET",
        `${GET_EMPLOYEE_LEAVES}${company._id}/${employee._id}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (result.data.success) {
        setLeaves(result.data.leaves);
        console.log("Leaves fetched successfully:", result.data.leaves);
        toast.success("Leaves fetched successfully!");
      } else {
        toast.error("Failed to fetch leaves");
      }
    } catch (error) {
      console.log("Error fetching leaves:", error);
      toast.error("Unable to fetch leaves!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchLeavePolicy = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", `${getLeavePolicy}${company._id}`);

      if (res.data.success && res.data.policy) {
        setLeavePolicy(res.data.policy);
        console.log("Leave policy fetched:", res.data.policy);

        // Set default leave type if available
        const activeTypes = res.data.policy.leaveTypes.filter(
          (type) => type.isActive !== false
        );
        if (activeTypes.length > 0 && !leaveForm.leaveType) {
          setLeaveForm((prev) => ({
            ...prev,
            leaveType: activeTypes[0].name,
            shortCode: activeTypes[0].shortCode,
          }));
        }
      } else {
        setLeavePolicy(null);
        console.log("No leave policy found");
      }
    } catch (error) {
      console.log("Error fetching leave policy:", error);
      toast.error("Unable to load Leave Policy!");
      setLeavePolicy(null);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Get available leave types for the dropdown
  const getAvailableLeaveTypes = () => {
    if (
      leavePolicy &&
      leavePolicy.leaveTypes &&
      leavePolicy.leaveTypes.length > 0
    ) {
      return leavePolicy.leaveTypes.filter((type) => type.isActive !== false);
    }
    // Fallback to default types if no policy
    return [
      { shortCode: "CL", name: "Casual Leave" },
      { shortCode: "SL", name: "Sick Leave" },
      { shortCode: "EL", name: "Earned Leave" },
    ];
  };

  // Get selected leave type details
  const getSelectedLeaveTypeDetails = () => {
    const availableTypes = getAvailableLeaveTypes();
    return availableTypes.find(
      (type) => type.shortCode === leaveForm.shortCode
    );
  };

  // Get leave balance for selected leave type
  const getLeaveBalance = (shortCode) => {
    if (!shortCode || !leaves.length) return null;

    const selectedType = getAvailableLeaveTypes().find(type => type.shortCode === shortCode);
    if (!selectedType) return null;

    const maxInstances = selectedType.maxPerYear || selectedType.maxInstancesPerYear || 0;
    const usedDays = leaves
      .filter(leave => 
        leave.shortCode === shortCode && 
        (leave.status === 'approved' || leave.status === 'pending')
      )
      .reduce((total, leave) => total + (leave.days || 0), 0);

    return {
      total: maxInstances,
      used: usedDays,
      remaining: maxInstances - usedDays
    };
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setIsViewModalOpen(true);
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave?")) {
      return;
    }

    try {
      dispatch(setLoading(true));
      const result = await apiConnector(
        "PATCH",
        `${cancelLeave}${leaveId}/cancel`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (result.data.success) {
        toast.success("Leave cancelled successfully!");
        getEmployeeLeaves(); // Refresh the list
      } else {
        toast.error(result.data.message || "Failed to cancel leave");
      }
    } catch (error) {
      console.error("Error cancelling leave:", error);
      toast.error("Failed to cancel leave");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const validateForm = () => {
    const selectedType = getSelectedLeaveTypeDetails();

    if (!leaveForm.leaveType) {
      toast.error("Please select a leave type");
      return false;
    }

    if (!leaveForm.shortCode) {
      toast.error("Please select a leave type short code");
      return false;
    }

    if (!leaveForm.startDate) {
      toast.error("Please select start date");
      return false;
    }

    if (!leaveForm.endDate) {
      toast.error("Please select end date");
      return false;
    }

    if (!leaveForm.reason.trim()) {
      toast.error("Please provide a reason for leave");
      return false;
    }

    if (leaveForm.isHalfDay && !leaveForm.halfDayType) {
      toast.error("Please select half day type");
      return false;
    }

    if (leaveForm.isHalfDay && leaveForm.startDate !== leaveForm.endDate) {
      toast.error("For half day leave, start and end date must be the same");
      return false;
    }

    // Check if documents are required
    if (selectedType?.requiresDocs && selectedFiles.length === 0) {
      toast.error(`Documents are required for ${selectedType.name}`);
      return false;
    }

    const days = leaveForm.isHalfDay
      ? 0.5
      : calculateBusinessDays(leaveForm.startDate, leaveForm.endDate);

    if (days <= 0) {
      toast.error("No business days in selected range");
      return false;
    }

    // Validate against leave type constraints
    if (selectedType) {
      if (days > selectedType.maxPerRequest) {
        toast.error(
          `Maximum ${selectedType.maxPerRequest} days allowed per request for ${selectedType.name}`
        );
        return false;
      }

      if (days < selectedType.minPerRequest) {
        toast.error(
          `Minimum ${selectedType.minPerRequest} days required for ${selectedType.name}`
        );
        return false;
      }
    }

    // Check leave balance
    const balance = getLeaveBalance(leaveForm.shortCode);
    if (balance && days > balance.remaining) {
      toast.error(
        `Insufficient leave balance. You have ${balance.remaining} days remaining for ${selectedType?.name}.`
      );
      return false;
    }

    return true;
  };

  const handleAddLeave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      dispatch(setLoading(true));

      // Create FormData for file upload
      const formData = new FormData();

      // Append basic leave data
      formData.append("employeeId", employee._id);
      formData.append("companyId", company._id);
      formData.append("leaveType", leaveForm.leaveType);
      formData.append("shortCode", leaveForm.shortCode);
      formData.append("startDate", leaveForm.startDate);
      formData.append("endDate", leaveForm.endDate);
      formData.append("reason", leaveForm.reason.trim());
      formData.append("isHalfDay", leaveForm.isHalfDay);
      if (leaveForm.isHalfDay) {
        formData.append("halfDayType", leaveForm.halfDayType);
      }

      // Append documents if any
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("documents", file);
        });
      }

      console.log("Submitting leave application with FormData");

      // Make API call with FormData
      const result = await apiConnector("POST", APPLY_LEAVE, formData, {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      });

      if (result.data.success) {
        toast.success(result.data.message || "Leave applied successfully!");
        getEmployeeLeaves(); // Refresh the list
        resetForm();
        setIsAddModalOpen(false);
      } else {
        toast.error(result.data.message || "Failed to apply leave");
      }
    } catch (error) {
      console.error("Error applying leave:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to submit leave application";
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const resetForm = () => {
    const availableTypes = getAvailableLeaveTypes();
    setLeaveForm({
      leaveType: availableTypes.length > 0 ? availableTypes[0].name : "",
      shortCode: availableTypes.length > 0 ? availableTypes[0].shortCode : "",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      halfDayType: "",
      documents: [],
    });
    setSelectedFiles([]);

    // Reset file input
    const fileInput = document.getElementById("document-upload");
    if (fileInput) fileInput.value = "";
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-green-700 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (company?._id) {
      fetchLeavePolicy();
    }
  }, [company]);

  useEffect(() => {
    if (employee?.user?._id && company?._id) {
      getEmployeeLeaves();
    }
  }, [employee, company]);

  // Reset form when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      resetForm();
    }
  }, [isAddModalOpen]);

  return (
    <div className="relative">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw] pr-4 pb-10">
        {/* Employee panel bar */}
        <EmployeeHeader />

        {/* Leave Policy Display Section */}
        <div className="px-4 pt-4">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Company Leave Policy
              </h2>
              <button
                onClick={() => setShowPolicyDetails(!showPolicyDetails)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {showPolicyDetails ? "Hide Details" : "View Details"}
              </button>
            </div>

            {leavePolicy ? (
              <div>
                {/* Basic Policy Info - Always Visible */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Financial Year
                    </h4>
                    <p className="text-blue-700">
                      Starts in{" "}
                      <span className="font-medium">
                        {months[leavePolicy.yearStartMonth - 1]}
                      </span>
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Week Off Days
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {leavePolicy.weekOff.map((dayIndex) => (
                        <span
                          key={dayIndex}
                          className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded"
                        >
                          {weekDays[dayIndex]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leave Types Summary with Balance - Always Visible */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Available Leave Types with Balance (
                    {
                      leavePolicy.leaveTypes.filter((t) => t.isActive !== false)
                        .length
                    }
                    )
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {leavePolicy.leaveTypes
                      .filter((type) => type.isActive !== false)
                      .map((leaveType, index) => {
                        const balance = getLeaveBalance(leaveType.shortCode);
                        return (
                          <div
                            key={index}
                            className="bg-white p-3 rounded border"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-800">
                                {leaveType.name}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {leaveType.shortCode}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">
                                {leaveType.maxPerRequest}
                              </span>{" "}
                              max per request
                            </p>
                            {balance && (
                              <div className="text-sm mt-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Balance:</span>
                                  <span className={`font-medium ${balance.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {balance.remaining}/{balance.total}
                                  </span>
                                </div>
                                {balance.used > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Used: {balance.used} days
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {!leaveType.requiresApproval && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Auto Approve
                                </span>
                              )}
                              {leaveType.unpaid && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  Unpaid
                                </span>
                              )}
                              {leaveType.requiresDocs && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                  Docs Required
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Detailed Policy Information - Toggle Visibility */}
                {showPolicyDetails && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      Detailed Leave Type Information
                    </h4>
                    <div className="space-y-4">
                      {leavePolicy.leaveTypes
                        .filter((type) => type.isActive !== false)
                        .map((leaveType, index) => (
                          <div
                            key={index}
                            className="bg-white border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="text-lg font-semibold text-gray-800">
                                  {leaveType.name}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  Code: {leaveType.shortCode}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-blue-600">
                                  {leaveType.maxPerRequest} days
                                </p>
                                <p className="text-xs text-gray-500">
                                  max per request
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Request Limits */}
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">
                                  Request Limits
                                </h6>
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <span className="font-medium">
                                      Max per request:
                                    </span>{" "}
                                    {leaveType.maxPerRequest} days
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Min per request:
                                    </span>{" "}
                                    {leaveType.minPerRequest} days
                                  </p>
                                  {leaveType.maxInstancesPerYear && (
                                    <p>
                                      <span className="font-medium">
                                        Max instances/year:
                                      </span>{" "}
                                      {leaveType.maxInstancesPerYear}
                                    </p>
                                  )}
                                  {leaveType.coolingPeriod > 0 && (
                                    <p>
                                      <span className="font-medium">
                                        Cooling period:
                                      </span>{" "}
                                      {leaveType.coolingPeriod} days
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Approval & Documents */}
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">
                                  Approval & Documents
                                </h6>
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <span className="font-medium">
                                      Approval:
                                    </span>
                                    {leaveType.requiresApproval
                                      ? " Required"
                                      : " Auto-approved"}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Documents:
                                    </span>
                                    {leaveType.requiresDocs
                                      ? " Required"
                                      : " Not required"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Type:</span>
                                    {leaveType.unpaid ? " Unpaid" : " Paid"}
                                  </p>
                                </div>
                              </div>

                              {/* Eligibility */}
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">
                                  Eligibility
                                </h6>
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <span className="font-medium">
                                      Applicable for:
                                    </span>
                                    {leaveType.applicableFor === "all"
                                      ? " All employees"
                                      : leaveType.applicableFor === "male"
                                      ? " Male employees"
                                      : leaveType.applicableFor === "female"
                                      ? " Female employees"
                                      : " Other employees"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-yellow-50 rounded-lg">
                <div className="text-yellow-800 text-lg font-medium mb-2">
                  No Leave Policy Found
                </div>
                <p className="text-yellow-700">
                  The company hasn't set up a leave policy yet. Please contact
                  HR for more information.
                </p>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-3xl mt-4 font-semibold mb-6 text-center">
          Leave Applications
        </h2>

        {loading ? (
          <div className="h-[50vh] flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto pl-4">
            <div className="flex justify-between items-center px-4 mb-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
              >
                + Apply for Leave
              </button>
              <div className="text-sm text-gray-600">
                Total Applications: {leaves.length}
              </div>
            </div>

            {leaves.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg mx-4">
                <p className="text-gray-500">No leave applications found.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Apply for your first leave
                </button>
              </div>
            ) : (
              <table className="min-w-full table-fixed border text-sm text-left bg-white rounded-lg shadow">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="w-12 px-4 py-3">Sr.</th>
                    <th className="w-24 px-4 py-3">Type</th>
                    <th className="w-64 px-4 py-3">Reason</th>
                    <th className="w-20 px-4 py-3">Days</th>
                    <th className="w-36 px-4 py-3">Start Date</th>
                    <th className="w-36 px-4 py-3">End Date</th>
                    <th className="w-28 px-4 py-3">Status</th>
                    <th className="w-32 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave, index) => (
                    <tr key={leave._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{leave.leaveType}</div>
                          {leave.isHalfDay && (
                            <div className="text-xs text-blue-600">
                              {leave.halfDayType === "first-half"
                                ? "First Half"
                                : "Second Half"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="truncate max-w-48" title={leave.reason}>
                          {leave.reason}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{leave.days}</td>
                      <td className="px-4 py-3">
                        {formatDate(leave.startDate)}
                      </td>
                      <td className="px-4 py-3">{formatDate(leave.endDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(
                            leave.status
                          )}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleView(leave)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                          >
                            View
                          </button>
                          {(leave.status === "pending" ||
                            leave.status === "approved") && (
                            <button
                              onClick={() => handleCancelLeave(leave._id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add Leave Modal */}
            {isAddModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-2xl z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Apply for Leave
                    </h2>

                    {/* Leave Type */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Leave Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={leaveForm.shortCode}
                        onChange={(e) => {
                          const selectedType = getAvailableLeaveTypes().find(
                            type => type.shortCode === e.target.value
                          );
                          setLeaveForm((prev) => ({
                            ...prev,
                            leaveType: selectedType?.name || "",
                            shortCode: e.target.value,
                          }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Leave Type</option>
                        {getAvailableLeaveTypes().map((type) => {
                          const balance = getLeaveBalance(type.shortCode);
                          return (
                            <option key={type.shortCode} value={type.shortCode}>
                              {type.name} ({type.shortCode})
                              {type.maxPerRequest && ` - Max: ${type.maxPerRequest} days`}
                              {balance && ` - Balance: ${balance.remaining}`}
                            </option>
                          );
                        })}
                      </select>
                      {getSelectedLeaveTypeDetails() && (
                        <div className="mt-1 text-xs">
                          {(() => {
                            const balance = getLeaveBalance(leaveForm.shortCode);
                            return (
                              <div className="space-y-1">
                                {balance && (
                                  <p className={`${balance.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    💰 Balance: {balance.remaining}/{balance.total} days
                                  </p>
                                )}
                                {getSelectedLeaveTypeDetails().requiresDocs && (
                                  <p className="text-yellow-600">
                                    📎 Documents required
                                  </p>
                                )}
                                {getSelectedLeaveTypeDetails().unpaid && (
                                  <p className="text-red-600">
                                    💰 This is unpaid leave
                                  </p>
                                )}
                                {!getSelectedLeaveTypeDetails().requiresApproval && (
                                  <p className="text-green-600">✅ Auto-approved</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Half Day Option
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={leaveForm.isHalfDay}
                          onChange={(e) => setLeaveForm(prev => ({ 
                            ...prev, 
                            isHalfDay: e.target.checked,
                            halfDayType: e.target.checked ? "first-half" : null,
                            endDate: e.target.checked ? prev.startDate : prev.endDate
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Half Day Leave</span>
                      </label>
                    </div>

                    {/* Half Day Type */}
                    {/* {leaveForm.isHalfDay && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Half Day Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={leaveForm.halfDayType || ""}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, halfDayType: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Half Day Type</option>
                          <option value="first-half">First Half</option>
                          <option value="second-half">Second Half</option>
                        </select>
                      </div>
                    )}  */}

                    {/* Start Date */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={leaveForm.startDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                            endDate: prev.isHalfDay
                              ? e.target.value
                              : prev.endDate,
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* End Date */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={leaveForm.endDate}
                        min={
                          leaveForm.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        disabled={leaveForm.isHalfDay}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {leaveForm.isHalfDay && (
                        <p className="text-xs text-gray-500 mt-1">
                          End date is same as start date for half day leave
                        </p>
                      )}
                    </div>

                    {/* Days Calculation Display */}
                    {leaveForm.startDate && leaveForm.endDate && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          {leaveForm.isHalfDay
                            ? "Duration: 0.5 days (Half Day)"
                            : `Business Days: ${calculateBusinessDays(
                                leaveForm.startDate,
                                leaveForm.endDate
                              )} days`}
                        </p>
                      </div>
                    )}

                    {/* Reason */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Leave <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Please provide a detailed reason for your leave"
                        value={leaveForm.reason}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        maxLength="500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {leaveForm.reason.length}/500 characters
                      </p>
                    </div>

                    {/* Document Upload (if required) */}
                    {getSelectedLeaveTypeDetails()?.requiresDocs && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supporting Documents{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="document-upload"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileSelect}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB
                          per file, Max 5 files)
                        </p>

                        {/* Selected Files Display */}
                        {selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Selected Files:
                            </p>
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="ml-2 text-red-500 hover:text-red-700 text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setIsAddModalOpen(false);
                          resetForm();
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddLeave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Submitting..." : "Apply for Leave"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Leave Details Modal */}
            {isViewModalOpen && selectedLeave && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-2xl z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        Leave Application Details
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(
                          selectedLeave.status
                        )}`}
                      >
                        {selectedLeave.status}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Leave Type
                          </label>
                          <p className="text-gray-800 font-medium">
                            {selectedLeave.leaveType}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Duration
                          </label>
                          <p className="text-gray-800 font-medium">
                            {selectedLeave.days}{" "}
                            {selectedLeave.days === 1 ? "day" : "days"}
                            {selectedLeave.isHalfDay && (
                              <span className="text-blue-600 text-sm ml-1">
                                (
                                {selectedLeave.halfDayType === "first-half"
                                  ? "First Half"
                                  : "Second Half"}
                                )
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Start Date
                          </label>
                          <p className="text-gray-800 font-medium">
                            {formatDate(selectedLeave.startDate)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            End Date
                          </label>
                          <p className="text-gray-800 font-medium">
                            {formatDate(selectedLeave.endDate)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Reason
                        </label>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                          {selectedLeave.reason}
                        </p>
                      </div>

                      {selectedLeave.documents &&
                        selectedLeave.documents.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                              Attached Documents
                            </label>
                            <div className="space-y-2">
                              {selectedLeave.documents.map((docUrl, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                >
                                  <span className="text-sm text-gray-700">
                                    Document {index + 1}
                                  </span>
                                  <button
                                    onClick={() =>
                                      window.open(
                                        docUrl?.url,
                                        "_blank",
                                        "noopener,noreferrer"
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-800 text-sm underline bg-transparent border-none cursor-pointer"
                                  >
                                    View
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedLeave.approvedBy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            {selectedLeave.status === "approved"
                              ? "Approved By"
                              : "Processed By"}
                          </label>
                          <p className="text-gray-800 font-medium">
                            {selectedLeave.approvedBy?.profile?.firstName+" "+selectedLeave.approvedBy?.profile?.lastName || "System"}
                            {selectedLeave.approvedAt && (
                              <span className="text-gray-500 text-sm ml-2">
                                on {formatDate(selectedLeave.approvedAt)}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {selectedLeave.rejectionReason && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Rejection Reason
                          </label>
                          <p className="text-red-700 bg-red-50 p-3 rounded-lg">
                            {selectedLeave.rejectionReason}
                          </p>
                        </div>
                      )}

                      {selectedLeave.rejectedBy?.profile?.firstName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Rejected By:
                          </label>
                          <p className="text-red-700 bg-red-50 p-3 rounded-lg">
                            {selectedLeave.rejectedBy?.profile.firstName}{" "}{selectedLeave.rejectedBy?.profile.lastName || ""} <br />
                            ({selectedLeave.rejectedBy?.profile.designation})
                          </p>
                        </div>
                      )}

                      {selectedLeave.comment && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Comments
                          </label>
                          <p className="text-gray-800 bg-blue-50 p-3 rounded-lg">
                            {selectedLeave.comment}
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <p>Applied on: {formatDate(selectedLeave.createdAt)}</p>
                        {selectedLeave.updatedAt !==
                          selectedLeave.createdAt && (
                          <p>
                            Last updated: {formatDate(selectedLeave.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-between pt-6 border-t mt-6">
                      <div>
                        {(selectedLeave.status === "pending" ||
                          selectedLeave.status === "approved") && (
                          <button
                            onClick={() => {
                              handleCancelLeave(selectedLeave._id);
                              setIsViewModalOpen(false);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Cancel Leave
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddLeave;