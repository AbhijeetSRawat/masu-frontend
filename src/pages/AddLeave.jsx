import React, { useEffect, useState } from "react";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { useDispatch, useSelector } from "react-redux";
import { leaveEndpoints, leavepolicyendpoints } from "../services/api";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import EmployeeHeader from "../components/EmployeeHeader";

const { APPLY_LEAVE, GET_EMPLOYEE_LEAVES, CANCEL_LEAVE } = leaveEndpoints;
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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const weekDays = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];

  // Updated form structure for combination leaves
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
    halfDayType: null,
    leaveBreakup: [], // Array of { leaveType, shortCode, days }
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
      files.forEach(validateFile);

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
      e.target.value = "";
    }
  };

  // Remove selected file
  const removeFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setLeaveForm((prev) => ({ ...prev, documents: updatedFiles }));

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

  const weekOffDays = leavePolicy.includeWeekOff ? [] : leavePolicy?.weekOff ;

    while (current <= end) {
      const day = current.getDay();
      if (!weekOffDays.includes(day)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  // Get available leave types for dropdown
  const getAvailableLeaveTypes = () => {
    if (
      leavePolicy &&
      leavePolicy.leaveTypes &&
      leavePolicy.leaveTypes.length > 0
    ) {
      return leavePolicy.leaveTypes.filter((type) => type.isActive !== false);
    }
    return [
      { shortCode: "CL", name: "Casual Leave" },
      { shortCode: "SL", name: "Sick Leave" },
      { shortCode: "EL", name: "Earned Leave" },
    ];
  };

  // Get leave balance for a specific leave type
  const getLeaveBalance = (shortCode) => {
    if (!shortCode || !leaves.length) return null;

    const selectedType = getAvailableLeaveTypes().find(type => type.shortCode === shortCode);
    if (!selectedType) return null;

    const maxInstances = selectedType.maxInstancesPerYear || 0;
    
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, (leavePolicy?.yearStartMonth || 1) - 1, 1);
    const yearEnd = new Date(currentYear + 1, (leavePolicy?.yearStartMonth || 1) - 1, 0);

    // Calculate used days from leaveBreakup array
    const usedDays = leaves
      .filter(leave => {
        const leaveDate = new Date(leave.startDate);
        return (
          (leave.status === 'approved' || leave.status === 'pending') &&
          leaveDate >= yearStart && leaveDate <= yearEnd
        );
      })
      .reduce((total, leave) => {
        // Sum days from leaveBreakup array for this shortCode
        const breakupDays = leave.leaveBreakup
          ?.filter(breakup => breakup.shortCode === shortCode)
          ?.reduce((sum, breakup) => sum + (breakup.days || 0), 0) || 0;
        return total + breakupDays;
      }, 0);

    return {
      total: maxInstances,
      used: usedDays,
      remaining: maxInstances - usedDays
    };
  };

  // Add a new leave type to the breakup
  const addLeaveBreakup = () => {
    const availableTypes = getAvailableLeaveTypes();
    if (availableTypes.length === 0) {
      toast.error("No leave types available");
      return;
    }

    const newBreakup = {
      leaveType: availableTypes[0].name,
      shortCode: availableTypes[0].shortCode,
      days: 1,
    };

    setLeaveForm(prev => ({
      ...prev,
      leaveBreakup: [...prev.leaveBreakup, newBreakup]
    }));
  };

  // Remove a leave breakup entry
  const removeLeaveBreakup = (index) => {
    setLeaveForm(prev => ({
      ...prev,
      leaveBreakup: prev.leaveBreakup.filter((_, i) => i !== index)
    }));
  };

  // Update a specific breakup entry
  const updateLeaveBreakup = (index, field, value) => {
    setLeaveForm(prev => ({
      ...prev,
      leaveBreakup: prev.leaveBreakup.map((item, i) => {
        if (i === index) {
          if (field === 'shortCode') {
            // When shortCode changes, update leaveType too
            const selectedType = getAvailableLeaveTypes().find(type => type.shortCode === value);
            return {
              ...item,
              shortCode: value,
              leaveType: selectedType?.name || item.leaveType
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  // Get total days from breakup
  const getTotalBreakupDays = () => {
    return leaveForm.leaveBreakup.reduce((total, item) => total + (parseFloat(item.days) || 0), 0);
  };

  // Check if documents are required for any leave type in breakup
  const areDocumentsRequired = () => {
    const totalDays = getTotalBreakupDays();
    
    return leaveForm.leaveBreakup.some(breakup => {
      const leaveType = getAvailableLeaveTypes().find(type => type.shortCode === breakup.shortCode);
      if (!leaveType?.requiresDocs) return false;
      
      if (leaveType.docsRequiredAfterDays !== null && 
          leaveType.docsRequiredAfterDays !== undefined) {
        return totalDays > leaveType.docsRequiredAfterDays;
      }
      return true; // Always required if no threshold specified
    });
  };

  // Auto-calculate and validate days when dates change
  useEffect(() => {
    if (leaveForm.startDate && leaveForm.endDate) {
      if (leaveForm.isHalfDay) {
        if (leaveForm.startDate === leaveForm.endDate) {
          // For half day, ensure total breakup is 0.5
          if (getTotalBreakupDays() !== 0.5) {
            toast.success("Adjusting leave breakup for half day (0.5 days total)");
            // Auto-adjust first breakup to 0.5 days
            if (leaveForm.leaveBreakup.length > 0) {
              updateLeaveBreakup(0, 'days', 0.5);
              // Remove other breakups for half day
              setLeaveForm(prev => ({
                ...prev,
                leaveBreakup: prev.leaveBreakup.slice(0, 1)
              }));
            }
          }
        } else {
          toast.error("For half day leave, start and end date must be the same");
          setLeaveForm((prev) => ({ ...prev, endDate: prev.startDate }));
        }
      } else {
        const businessDays = calculateBusinessDays(leaveForm.startDate, leaveForm.endDate);
        if (businessDays <= 0) {
          toast.error("No business days found in the selected date range");
        } else {
          // Show info about total business days
          const totalBreakup = getTotalBreakupDays();
          if (totalBreakup !== businessDays && totalBreakup > 0) {
            toast.success(`Business days: ${businessDays}. Current breakup total: ${totalBreakup}`);
          }
        }
      }
    }
  }, [
    leaveForm.startDate,
    leaveForm.endDate,
    leaveForm.isHalfDay,
    leaveForm.leaveBreakup,
    leavePolicy,
  ]);

  const getEmployeeLeaves = async () => {
    try {
      dispatch(setLoading(true));
     

      const result = await apiConnector(
        "GET",
        `${GET_EMPLOYEE_LEAVES}${employee.user._id}`,
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
      console.log(leaveId , employee.user._id)
      const result = await apiConnector(
        "PUT",
        `${CANCEL_LEAVE}${leaveId}/${employee.user._id}/cancel`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (result.data.success) {
        toast.success("Leave cancelled successfully!");
        getEmployeeLeaves();
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

    if (leaveForm.leaveBreakup.length === 0) {
      toast.error("Please add at least one leave type");
      return false;
    }

    // Validate each breakup entry
    for (let i = 0; i < leaveForm.leaveBreakup.length; i++) {
      const breakup = leaveForm.leaveBreakup[i];
      
      if (!breakup.leaveType || !breakup.shortCode) {
        toast.error(`Please select leave type for entry ${i + 1}`);
        return false;
      }

      if (!breakup.days || breakup.days <= 0) {
        toast.error(`Please enter valid days for ${breakup.leaveType}`);
        return false;
      }

      // Check balance
      const balance = getLeaveBalance(breakup.shortCode);
      if (balance && balance.total > 0 && breakup.days > balance.remaining) {
        toast.error(`Insufficient balance for ${breakup.leaveType}. Remaining: ${balance.remaining} days`);
        return false;
      }

      // Check leave type constraints
      const leaveType = getAvailableLeaveTypes().find(type => type.shortCode === breakup.shortCode);
      if (leaveType) {
        if (breakup.days > leaveType.maxPerRequest) {
          toast.error(`${breakup.leaveType} exceeds maximum ${leaveType.maxPerRequest} days per request`);
          return false;
        }
        if (breakup.days < leaveType.minPerRequest) {
          toast.error(`${breakup.leaveType} requires minimum ${leaveType.minPerRequest} days`);
          return false;
        }
      }
    }

    if (leaveForm.isHalfDay && !leaveForm.halfDayType) {
      toast.error("Please select half day type");
      return false;
    }

    if (leaveForm.isHalfDay && leaveForm.startDate !== leaveForm.endDate) {
      toast.error("For half day leave, start and end date must be the same");
      return false;
    }

    // Validate total days match business days
    const businessDays = leaveForm.isHalfDay 
      ? 0.5 
      : calculateBusinessDays(leaveForm.startDate, leaveForm.endDate);

    const totalBreakupDays = getTotalBreakupDays();

    if (Math.abs(totalBreakupDays - businessDays) > 0.001) { // Allow for floating point precision
      toast.error(`Leave breakup total (${totalBreakupDays}) must equal business days (${businessDays})`);
      return false;
    }

    // Check document requirements
    if (areDocumentsRequired() && selectedFiles.length === 0) {
      toast.error("Documents are required for one or more selected leave types");
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

      // Create the base payload object
      const payload = {
        employeeId: employee._id,
        companyId: company._id,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason.trim(),
        isHalfDay: leaveForm.isHalfDay,
        leaveBreakup: leaveForm.leaveBreakup.map(breakup => ({
          leaveType: breakup.leaveType,
          shortCode: breakup.shortCode,
          days: Number(breakup.days)
        }))
      };

      // Add halfDayType if it's a half day leave
      if (leaveForm.isHalfDay && leaveForm.halfDayType) {
        payload.halfDayType = leaveForm.halfDayType;
      }

      // If there are documents, use FormData
      if (selectedFiles.length > 0) {
        const formData = new FormData();

        // Append JSON data
        Object.keys(payload).forEach(key => {
          if (key === 'leaveBreakup') {
            formData.append(key, JSON.stringify(payload[key]));
          } else {
            formData.append(key, payload[key]);
          }
        });

        // Append documents
        selectedFiles.forEach(file => {
          formData.append('documents', file);
        });

        const result = await apiConnector(
          "POST",
          APPLY_LEAVE,
          formData,
          {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        );

        handleApiResponse(result);
      } else {
        // If no documents, send JSON directly
        const result = await apiConnector(
          "POST",
          APPLY_LEAVE,
          payload,
          {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        );

        handleApiResponse(result);
      }

    } catch (error) {
      console.error("Error applying leave:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit leave application";
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Helper function to handle API response
  const handleApiResponse = (result) => {
    if (result.data.success) {
      toast.success(result.data.message || "Leave application submitted successfully!");
      getEmployeeLeaves(); // Refresh leave list
      resetForm();
      setIsAddModalOpen(false);
    } else {
      toast.error(result.data.message || "Failed to apply leave");
    }
  };

  const resetForm = () => {
    setLeaveForm({
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      halfDayType: null,
      leaveBreakup: [],
      documents: [],
    });
    setSelectedFiles([]);

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

  useEffect(() => {
    if (isAddModalOpen) {
      resetForm();
    }
  }, [isAddModalOpen]);

  return (
    <div className="relative">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw] pr-4 pb-10">
        <EmployeeHeader />

        {/* Leave Policy Display Section - Same as before */}
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
                {/* Basic Policy Info */}
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

                {/* Leave Types Summary with Balance */}
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
                            {balance && balance.total > 0 && (
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

                {/* Detailed Policy Information - Same as before */}
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
                                      ? ` Required${leaveType.docsRequiredAfterDays ? ` after ${leaveType.docsRequiredAfterDays} days` : ''}`
                                      : " Not required"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Type:</span>
                                    {leaveType.unpaid ? " Unpaid" : " Paid"}
                                  </p>
                                </div>
                              </div>

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

        {/* Company Calendar Section - Same as before */}
        <div className="px-4">
          <div className="bg-gray-50 p-6 rounded-lg mt-6">
            <h4 className="font-semibold text-gray-800 mb-4 text-center text-xl">
              Company Calendar {new Date().getFullYear()}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(() => {
                const currentYear = new Date().getFullYear();
                const weekDaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                
                const getHolidayForDate = (date) => {
                  if (!leavePolicy?.holidays) return null;
                  
                  const formatDateForComparison = (d) => {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  const dateStr = formatDateForComparison(date);
                  
                  return leavePolicy.holidays.find(holiday => {
                    const holidayDate = new Date(holiday.date);
                    
                    if (holiday.recurring) {
                      return holidayDate.getMonth() === date.getMonth() && 
                             holidayDate.getDate() === date.getDate();
                    } else {
                      const holidayStr = formatDateForComparison(holidayDate);
                      return holidayStr === dateStr;
                    }
                  });
                };
                
                const isWeekOff = (date) => {
                  const dayOfWeek = date.getDay();
                  return leavePolicy?.weekOff?.includes(dayOfWeek) || false;
                };
                
                return months.map((month, monthIndex) => {
                  const firstDay = new Date(currentYear, monthIndex, 1);
                  const lastDay = new Date(currentYear, monthIndex + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startingDayOfWeek = firstDay.getDay();
                  
                  const calendarDays = [];
                  
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    calendarDays.push(null);
                  }
                  
                  for (let day = 1; day <= daysInMonth; day++) {
                    const currentDate = new Date(currentYear, monthIndex, day);
                    const holiday = getHolidayForDate(currentDate);
                    const isWeekOffDay = isWeekOff(currentDate);
                    const isToday = currentDate.toDateString() === new Date().toDateString();
                    
                    calendarDays.push({
                      day,
                      date: currentDate,
                      holiday,
                      isWeekOff: isWeekOffDay,
                      isToday
                    });
                  }
                  
                  return (
                    <div key={monthIndex} className="bg-white rounded-lg border p-3">
                      <div className="text-center mb-3">
                        <h5 className="font-semibold text-gray-800 text-lg">{month}</h5>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDaysShort.map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((dayData, index) => {
                          if (!dayData) {
                            return <div key={index} className="h-8"></div>;
                          }
                          
                          const { day, holiday, isWeekOff, isToday } = dayData;
                          
                          let dayClasses = "h-8 flex items-center justify-center text-xs rounded relative ";
                          
                          if (isToday) {
                            dayClasses += "bg-blue-600 text-white font-bold ";
                          } else if (holiday) {
                            dayClasses += "bg-red-100 text-red-800 font-semibold ";
                          } else if (isWeekOff) {
                            dayClasses += "bg-gray-200 text-gray-600 ";
                          } else {
                            dayClasses += "text-gray-800 hover:bg-gray-50 ";
                          }
                          
                          return (
                            <div
                              key={index}
                              className={dayClasses}
                              title={holiday ? `${holiday.name}: ${holiday.description}` : isWeekOff ? 'Week Off' : ''}
                            >
                              <span>{day}</span>
                              {holiday && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded relative">
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <span>Holidays ({leavePolicy?.holidays?.length || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span>Week Off ({leavePolicy?.weekOff?.map(day => weekDays[day]).join(', ') || 'None'})</span>
              </div>
            </div>
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
                    <th className="w-32 px-4 py-3">Leave Types</th>
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
                          {/* Display leave breakup */}
                          {leave.leaveBreakup && leave.leaveBreakup.length > 0 ? (
                            <div className="space-y-1">
                              {leave.leaveBreakup.map((breakup, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-medium">{breakup.shortCode}:</span>
                                  <span className="ml-1">{breakup.days} {breakup.days === 1 ? 'day' : 'days'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Fallback for old structure
                            <div className="font-medium">{leave.leaveType || 'N/A'}</div>
                          )}
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
                      <td className="px-4 py-3 font-medium">{leave.totalDays || leave.days}</td>
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

            {/* NEW Add Leave Modal with Combination Support */}
            {isAddModalOpen && (
              <div className="fixed inset-0 bg-opacity-50 backdrop-blur-2xl z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Apply for Leave
                    </h2>

                    {/* Date Selection First */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
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

                      <div>
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
                    </div>

                    

                    {/* Business Days Calculation Display */}
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
                        <p className="text-xs text-blue-600 mt-1">
                          Current Breakup Total: {getTotalBreakupDays()} days
                        </p>
                      </div>
                    )}

                    {/* Leave Breakup Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Leave Types Combination <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={addLeaveBreakup}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          + Add Leave Type
                        </button>
                      </div>

                      {leaveForm.leaveBreakup.length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-gray-500 text-sm">No leave types added yet</p>
                          <button
                            type="button"
                            onClick={addLeaveBreakup}
                            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            Add your first leave type
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {leaveForm.leaveBreakup.map((breakup, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-800">Leave Type {index + 1}</h4>
                                {leaveForm.leaveBreakup.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeLeaveBreakup(index)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    ✕ Remove
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Leave Type Selection */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Leave Type
                                  </label>
                                  <select
                                    value={breakup.shortCode}
                                    onChange={(e) => updateLeaveBreakup(index, 'shortCode', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select Leave Type</option>
                                    {getAvailableLeaveTypes().map((type) => {
                                      const balance = getLeaveBalance(type.shortCode);
                                      return (
                                        <option key={type.shortCode} value={type.shortCode}>
                                          {type.name} ({type.shortCode})
                                          {balance && balance.total > 0 && ` - Balance: ${balance.remaining}`}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                {/* Days Input */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Days
                                  </label>
                                  <input
                                    type="number"
                                    value={breakup.days}
                                    min={leaveForm.isHalfDay ? "0.5" : "1"}
                                    max={leaveForm.isHalfDay ? "0.5" : "30"}
                                    step={leaveForm.isHalfDay ? "0.5" : "1"}
                                    onChange={(e) => updateLeaveBreakup(index, 'days', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              {/* Leave Type Info */}
                              {breakup.shortCode && (
                                <div className="mt-2 text-xs">
                                  {(() => {
                                    const balance = getLeaveBalance(breakup.shortCode);
                                    const selectedType = getAvailableLeaveTypes().find(
                                      type => type.shortCode === breakup.shortCode
                                    );
                                    return (
                                      <div className="space-y-1">
                                        {balance && balance.total > 0 && (
                                          <p className={`${balance.remaining >= breakup.days ? 'text-green-600' : 'text-red-600'}`}>
                                            💰 Balance: {balance.remaining}/{balance.total} days
                                            {balance.remaining < breakup.days && " (Insufficient!)"}
                                          </p>
                                        )}
                                        {selectedType && (
                                          <div className="flex flex-wrap gap-1">
                                            <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs">
                                              Max: {selectedType.maxPerRequest} days
                                            </span>
                                            <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs">
                                              Min: {selectedType.minPerRequest} days
                                            </span>
                                            {selectedType.requiresDocs && (
                                              <span className="bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded text-xs">
                                                Docs Required
                                              </span>
                                            )}
                                            {selectedType.unpaid && (
                                              <span className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs">
                                                Unpaid
                                              </span>
                                            )}
                                            {!selectedType.requiresApproval && (
                                              <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded text-xs">
                                                Auto-approve
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

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
                    {areDocumentsRequired() && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supporting Documents <span className="text-red-500">*</span>
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
                          Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB per file, Max 5 files)
                          <br />Documents are required for one or more selected leave types
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

            {/* View Leave Details Modal - Updated for combination leaves */}
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
                      {/* Leave Types Breakdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Leave Types
                        </label>
                        {selectedLeave.leaveBreakup && selectedLeave.leaveBreakup.length > 0 ? (
                          <div className="mt-1 space-y-2">
                            {selectedLeave.leaveBreakup.map((breakup, index) => (
                              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div>
                                  <span className="font-medium text-gray-800">{breakup.leaveType}</span>
                                  <span className="text-sm text-gray-600 ml-2">({breakup.shortCode})</span>
                                </div>
                                <span className="font-medium text-blue-600">
                                  {breakup.days} {breakup.days === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Fallback for old structure
                          <p className="text-gray-800 font-medium bg-gray-50 p-2 rounded">
                            {selectedLeave.leaveType || 'N/A'}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Total Duration
                          </label>
                          <p className="text-gray-800 font-medium">
                            {selectedLeave.totalDays || selectedLeave.days}{" "}
                            {(selectedLeave.totalDays || selectedLeave.days) === 1 ? "day" : "days"}
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
                        <div>
                          <label className="block text-sm font-medium text-gray-500">
                            Application Date
                          </label>
                          <p className="text-gray-800 font-medium">
                            {formatDate(selectedLeave.createdAt)}
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
                              {selectedLeave.documents.map((doc, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                >
                                  <span className="text-sm text-gray-700">
                                    {doc.name || `Document ${index + 1}`}
                                  </span>
                                  <button
                                    onClick={() =>
                                      window.open(
                                        doc.url,
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
                            {selectedLeave.approvedBy?.profile?.firstName && selectedLeave.approvedBy?.profile?.lastName
                              ? `${selectedLeave.approvedBy.profile.firstName} ${selectedLeave.approvedBy.profile.lastName}`
                              : selectedLeave.approvedBy?.email || "System"}
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
                            Rejected By
                          </label>
                          <p className="text-red-700 bg-red-50 p-3 rounded-lg">
                            {selectedLeave.rejectedBy.profile.firstName}{" "}
                            {selectedLeave.rejectedBy.profile.lastName || ""} <br />
                            {selectedLeave.rejectedBy.profile.designation && 
                              `(${selectedLeave.rejectedBy.profile.designation})`}
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