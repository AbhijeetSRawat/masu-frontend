import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import {
  departmentEndpoints,
  employeeEndpoints,
} from "../services/api";
import { setReduxDepartments } from "../slices/departments";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { GET_ALL_DEPARTMENTS } = departmentEndpoints;
const {
  ADD_EMPLOYEE,
  getAllNewJoiners,
  EDIT_EMPLOYEE,
  makeDocumentInvalid,
  makeDocumentValid,
} = employeeEndpoints;

const AddNewJoiners = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const role = useSelector( state => state.auth.role)
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

  const loading = useSelector((state) => state.permissions.loading);
  const departmentData = useSelector((state) => state.departments.reduxDepartments);

  const [departments, setDepartments] = useState([]);
  const [newJoiners, setNewJoiners] = useState([]);
  const [filteredNewJoiners, setFilteredNewJoiners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalNewJoiners, setTotalNewJoiners] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedNewJoiner, setSelectedNewJoiner] = useState(null);

  // New state for documents modal
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

  // New state for verify modal
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyingNewJoiner, setVerifyingNewJoiner] = useState(null);

  // Simplified form with only required fields
  const [newJoinerForm, setNewJoinerForm] = useState({
    email: "",
    profile: { 
      firstName: "", 
      lastName: "" 
    },
    employmentDetails: {
      employeeId: "",
      joiningDate: "",
      department: "",
      designation: ""
    }
  });

  // Complete employee verification form
  const [verifyForm, setVerifyForm] = useState({
    // Profile details (pre-filled)
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
      avatar: ""
    },
    // Personal Details
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
      personalMobile: ""
    },
    // Employment Details (some pre-filled)
    employmentDetails: {
      employeeId: "",
      joiningDate: "",
      resignationDate: "",
      lastWorkingDate: "",
      department: "",
      shift: "",
      designation: "",
      employmentType: "full-time",
      workLocation: "",
      costCenter: "",
      businessArea: "",
      pfFlag: false,
      esicFlag: false,
      ptFlag: false,
      salary: {
        base: 0,
        bonus: 0,
        taxDeductions: 0
      },
      reportingTo: "",
      skills: []
    },
    // Leave Balance
    leaveBalance: {
      casual: 0,
      sick: 0,
      earned: 0
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

  // New state for document requirements
  const [documentRequirements, setDocumentRequirements] = useState([]);
  const [newDocumentName, setNewDocumentName] = useState("");

  // Add this state to store the current employee ID
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);

  const getAllDepartments = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", GET_ALL_DEPARTMENTS + company._id);
      dispatch(setReduxDepartments(res.data.data));
      setDepartments(res.data.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch departments");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getAllNewJoinersData = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector(
        "GET",
        `${getAllNewJoiners}${company._id}`,
        null,
        {
            "Authorization": `Bearer ${token}`
        }
      );

      console.log(res);

      const joinersData = res.data.employees || [];
      setNewJoiners(joinersData);
      setFilteredNewJoiners(joinersData);
      setTotalNewJoiners(joinersData.length);
      
      // Calculate pagination
      const pages = Math.ceil(joinersData.length / limit);
      setTotalPages(pages);

      toast.success("New joiners fetched successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch new joiners");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search with proper filtering
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);
    
    if (!query.trim()) {
      setFilteredNewJoiners(newJoiners);
      setTotalPages(Math.ceil(newJoiners.length / limit));
    } else {
      const filtered = newJoiners.filter(joiner => {
        const name = `${joiner.user?.profile?.firstName || ''} ${joiner.user?.profile?.lastName || ''}`.toLowerCase();
        const email = joiner.user?.email?.toLowerCase() || '';
        const employeeId = joiner.employmentDetails?.employeeId?.toLowerCase() || '';
        const designation = joiner.employmentDetails?.designation?.toLowerCase() || '';
        
        return name.includes(query) || 
               email.includes(query) || 
               employeeId.includes(query) ||
               designation.includes(query);
      });
      
      setFilteredNewJoiners(filtered);
      setTotalPages(Math.ceil(filtered.length / limit));
    }
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredNewJoiners.slice(startIndex, endIndex);
  };

  // Function to handle viewing documents
  const handleViewDocuments = (newJoiner) => {
    console.log("Selected New Joiner:", newJoiner); // For debugging
    const documents = newJoiner.employmentDetails?.documents || [];
    const employeeName = `${newJoiner.user?.profile?.firstName || ''} ${newJoiner.user?.profile?.lastName || ''}`.trim();
    
    // Store the MongoDB _id, not the employeeId
    setCurrentEmployeeId(newJoiner._id);
    setSelectedDocuments(documents);
    setSelectedEmployeeName(employeeName);
    setIsDocumentsModalOpen(true);
  };

  // Function to handle verify button click
  const handleVerifyNewJoiner = (newJoiner) => {
    setVerifyingNewJoiner(newJoiner);

    console.log(verifyingNewJoiner)
    
    // Pre-fill the form with existing data
    setVerifyForm({
      profile: {
        firstName: newJoiner.user?.profile?.firstName || "",
        lastName: newJoiner.user?.profile?.lastName || "",
        phone: newJoiner.user?.profile?.phone || "",
        avatar: newJoiner.user?.profile?.avatar || ""
      },
      personalDetails: {
        gender: newJoiner.personalDetails?.gender || "",
        dateOfBirth: newJoiner.personalDetails?.dateOfBirth ? 
          new Date(newJoiner.personalDetails.dateOfBirth).toISOString().split('T')[0] : "",
        city: newJoiner.personalDetails?.city || "",
        state: newJoiner.personalDetails?.state || "",
        panNo: newJoiner.personalDetails?.panNo || "",
        aadharNo: newJoiner.personalDetails?.aadharNo || "",
        uanNo: newJoiner.personalDetails?.uanNo || "",
        esicNo: newJoiner.personalDetails?.esicNo || "",
        bankAccountNo: newJoiner.personalDetails?.bankAccountNo || "",
        ifscCode: newJoiner.personalDetails?.ifscCode || "",
        personalEmail: newJoiner.personalDetails?.personalEmail || "",
        officialMobile: newJoiner.personalDetails?.officialMobile || "",
        personalMobile: newJoiner.personalDetails?.personalMobile || ""
      },
      employmentDetails: {
        employeeId: newJoiner.employmentDetails?.employeeId || "",
        joiningDate: newJoiner.employmentDetails?.joiningDate ? 
          new Date(newJoiner.employmentDetails.joiningDate).toISOString().split('T')[0] : "",
        resignationDate: "",
        lastWorkingDate: "",
        department: newJoiner.employmentDetails?.department?._id || newJoiner.employmentDetails?.department || "",
        shift: newJoiner.employmentDetails?.shift || "",
        designation: newJoiner.employmentDetails?.designation || "",
        employmentType: newJoiner.employmentDetails?.employmentType || "full-time",
        workLocation: newJoiner.employmentDetails?.workLocation || "",
        costCenter: newJoiner.employmentDetails?.costCenter || "",
        businessArea: newJoiner.employmentDetails?.businessArea || "",
        pfFlag: newJoiner.employmentDetails?.pfFlag || false,
        esicFlag: newJoiner.employmentDetails?.esicFlag || false,
        ptFlag: newJoiner.employmentDetails?.ptFlag || false,
        salary: {
          base: newJoiner.employmentDetails?.salary?.base || 0,
          bonus: newJoiner.employmentDetails?.salary?.bonus || 0,
          taxDeductions: newJoiner.employmentDetails?.salary?.taxDeductions || 0
        },
        reportingTo: newJoiner.employmentDetails?.reportingTo || "",
        skills: newJoiner.employmentDetails?.skills || []
      },
      leaveBalance: {
        casual: newJoiner.leaveBalance?.casual || 0,
        sick: newJoiner.leaveBalance?.sick || 0,
        earned: newJoiner.leaveBalance?.earned || 0
      }
    });
    
    setIsVerifyModalOpen(true);
  };

  // Function to open document in new tab
  const openDocument = (url) => {
    window.open(url, '_blank');
  };

  // Function to get file type icon
  const getFileTypeIcon = (type) => {
    if (!type) return '📎';
    type = type.toLowerCase();
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    return '📎';
  };

  // Reset form
  const resetNewJoinerForm = () => {
    setNewJoinerForm({
      email: "",
      profile: { 
        firstName: "", 
        lastName: "" 
      },
      employmentDetails: {
        employeeId: "",
        joiningDate: "",
        department: "",
        designation: ""
      }
    });
    setDocumentRequirements([]);
    setNewDocumentName('');
  };

  // Reset verify form
  const resetVerifyForm = () => {
    setVerifyForm({
      profile: {
        firstName: "",
        lastName: "",
        phone: "",
        avatar: ""
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
        personalMobile: ""
      },
      employmentDetails: {
        employeeId: "",
        joiningDate: "",
        resignationDate: "",
        lastWorkingDate: "",
        department: "",
        shift: "",
        designation: "",
        employmentType: "full-time",
        workLocation: "",
        costCenter: "",
        businessArea: "",
        pfFlag: false,
        esicFlag: false,
        ptFlag: false,
        salary: {
          base: 0,
          bonus: 0,
          taxDeductions: 0
        },
        reportingTo: "",
        skills: []
      },
      leaveBalance: {
        casual: 0,
        sick: 0,
        earned: 0
      }
    });
  };

  // Function to handle adding new document requirements
  const addDocumentRequirement = () => {
    if (!newDocumentName.trim()) {
      toast.error('Please enter a document name');
      return;
    }
    
    setDocumentRequirements(prev => [...prev, {
      name: newDocumentName.trim(),
      isRequired: true
    }]);
    setNewDocumentName('');
  };

  // Function to remove document requirements
  const removeDocumentRequirement = (index) => {
    setDocumentRequirements(prev => prev.filter((_, i) => i !== index));
  };

  // Submit handler for adding new joiner
  const submitHandler = async () => {
    try {
      setFormErrors([]);
      setIsSubmitting(true);
      
      const errors = validateForm(newJoinerForm);
      if (errors.length > 0) {
        setFormErrors(errors);
        errors.forEach(error => toast.error(error));
        return;
      }
      
      // Validate required fields
      if (!newJoinerForm.email || !newJoinerForm.profile.firstName || 
          !newJoinerForm.profile.lastName || !newJoinerForm.employmentDetails.employeeId ||
          !newJoinerForm.employmentDetails.joiningDate || !newJoinerForm.employmentDetails.department ||
          !newJoinerForm.employmentDetails.designation) {
        throw new Error("Please fill all required fields");
      }

      dispatch(setLoading(true));
      
      const payload = {
        email: newJoinerForm.email.trim(),
        profile: {
          firstName: newJoinerForm.profile.firstName.trim(),
          lastName: newJoinerForm.profile.lastName.trim()
        },
        companyId: company._id,
        role: "newjoiner",
        employmentDetails: {
          ...newJoinerForm.employmentDetails,
          employeeId: newJoinerForm.employmentDetails.employeeId.trim(),
          designation: newJoinerForm.employmentDetails.designation.trim(),
          documents: documentRequirements.map(doc => ({
            name: doc.name,
            isRequired: doc.isRequired,
            files: []
          }))
        },
      };

      const response = await apiConnector("POST", ADD_EMPLOYEE, payload);
      
      

      toast.success("New joiner added successfully!");
      setIsAddModalOpen(false);
      setSelectedNewJoiner(null);
      resetNewJoinerForm();
      await getAllNewJoinersData();
    } catch (err) {
      console.error("Error adding new joiner:", err);
      toast.error(err.message || "Failed to save new joiner");
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  // Submit handler for verifying new joiner (converting to employee)
  const verifySubmitHandler = async () => {
    try {
      // Validate required fields
      if (!verifyForm.profile.firstName || !verifyForm.profile.lastName || 
          !verifyForm.employmentDetails.employeeId || !verifyForm.employmentDetails.joiningDate ||
          !verifyForm.employmentDetails.department || !verifyForm.employmentDetails.designation) {
        toast.error("Please fill all required fields");
        return;
      }

      dispatch(setLoading(true));
      
      const payload = {
        email: verifyingNewJoiner.user.email,
        role: "employee", // Change role from newjoiner to employee
        profile: {
          firstName: verifyForm.profile.firstName,
          lastName: verifyForm.profile.lastName,
          phone: verifyForm.profile.phone
        },
        companyId: company._id,
        personalDetails: verifyForm.personalDetails,
        employmentDetails: {
          ...verifyForm.employmentDetails,
          // Convert date strings to proper format if needed
          joiningDate: new Date(verifyForm.employmentDetails.joiningDate).toISOString(),
          resignationDate: verifyForm.employmentDetails.resignationDate ? 
            new Date(verifyForm.employmentDetails.resignationDate).toISOString() : null,
          lastWorkingDate: verifyForm.employmentDetails.lastWorkingDate ?
            new Date(verifyForm.employmentDetails.lastWorkingDate).toISOString() : null,
          // Ensure numbers are properly typed
          salary: {
            base: Number(verifyForm.employmentDetails.salary.base),
            bonus: Number(verifyForm.employmentDetails.salary.bonus),
            taxDeductions: Number(verifyForm.employmentDetails.salary.taxDeductions)
          }
        },
        leaveBalance: {
          casual: Number(verifyForm.leaveBalance.casual),
          sick: Number(verifyForm.leaveBalance.sick),
          earned: Number(verifyForm.leaveBalance.earned)
        }
      };

      // Use PUT request to update existing employee
      const result = await apiConnector(
        "PUT",
        `${EDIT_EMPLOYEE}${verifyingNewJoiner.user._id}`,
        payload,
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      if (result.data.success || result.status === 200) {
        toast.success("New joiner verified and converted to employee successfully!");
        setIsVerifyModalOpen(false);
        setVerifyingNewJoiner(null);
        resetVerifyForm();
        await getAllNewJoinersData();
      } else {
        throw new Error(result.data.message || "Failed to verify new joiner");
      }
    } catch (err) {
      console.error("Error verifying new joiner:", err);
      toast.error(err.response?.data?.message || "Failed to verify new joiner");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Add these functions after your other state declarations
  const handleValidateDocument = async (employeeId, docName) => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector(
        "PATCH",
        `${makeDocumentValid}${employeeId}`,
        { 
          docName 
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data.success) {
        toast.success(`${docName} validated successfully`);
        
        // Update local state
        const updatedDocs = selectedDocuments.map(doc => {
          if (doc.name === docName) {
            return { ...doc, isValid: true };
          }
          return doc;
        });
        setSelectedDocuments(updatedDocs);
        
        // Refresh data
        await getAllNewJoinersData();
      }
    } catch (error) {
      console.error('Error validating document:', error);
      toast.error(error.response?.data?.message || 'Failed to validate document');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInvalidateDocument = async (employeeId, docName) => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector(
        "PATCH",
        `${makeDocumentInvalid}${employeeId}`,
        { 
          docName 
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data.success) {
        toast.success(`${docName} marked as invalid`);
        
        // Update local state - set both isValid false and validatedBy
        const updatedDocs = selectedDocuments.map(doc => {
          if (doc.name === docName) {
            return { 
              ...doc, 
              isValid: false,
              validatedBy: response.data.validatedBy || "current-user-id" // Update with actual validator ID
            };
          }
          return doc;
        });
        setSelectedDocuments(updatedDocs);
        
        // Refresh data to get latest changes
        await getAllNewJoinersData();
      }
    } catch (error) {
      console.error('Error invalidating document:', error);
      toast.error(error.response?.data?.message || 'Failed to invalidate document');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update the useEffect hooks with proper dependencies
  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        if (company?._id && isSubscribed) {
          await getAllNewJoinersData();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [company?._id]);

  useEffect(() => {
    if (departmentData) {
      setDepartments(departmentData);
      dispatch(setReduxDepartments(departmentData));
    } else {
      getAllDepartments();
    }
  }, [departmentData]); // Add dispatch as dependency

  const currentPageData = getCurrentPageData();

  // Validation function for new joiner form
  const validateForm = (formData) => {
    const errors = [];
    
    if (!formData.email || !formData.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (!formData.profile.firstName?.trim()) {
      errors.push('First name is required');
    }
    
    if (!formData.profile.lastName?.trim()) {
      errors.push('Last name is required');
    }
    
    if (!formData.employmentDetails.employeeId?.trim()) {
      errors.push('Employee ID is required');
    }
    
    if (!formData.employmentDetails.joiningDate) {
      errors.push('Joining date is required');
    }
    
    if (!formData.employmentDetails.department) {
      errors.push('Department is required');
    }
    
    if (!formData.employmentDetails.designation?.trim()) {
      errors.push('Designation is required');
    }

    return errors;
  };

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
          <div className="flex w-full h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-6 mt-4">
              <h1 className="text-2xl font-bold text-gray-800">New Joiners</h1>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
              >
                + Add New Joiner
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 mb-4 mt-4">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Search new joiners by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-600">
                  Showing {filteredNewJoiners?.length} of {totalNewJoiners} new joiners
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto px-6 mt-4">
              <table className="min-w-full border border-gray-300 mb-3 text-left text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-2">Sr.No.</th>
                    <th className="px-4 py-2">Employee ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Designation</th>
                    <th className="px-4 py-2">Joining Date</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageData?.length > 0 ? (
                    currentPageData.map((newJoiner, index) => (
                      <tr key={newJoiner._id} className="border-t border-gray-300 hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="px-4 py-2">
                          {newJoiner?.employmentDetails?.employeeId || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {newJoiner.user?.profile?.firstName}{" "}
                          {newJoiner.user?.profile?.lastName}
                        </td>
                        <td className="px-4 py-2">
                          {newJoiner.user?.email?.length > 25 ? (
                            <>{newJoiner.user?.email.substr(0, 25)}...</>
                          ) : (
                            <>{newJoiner.user?.email}</>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {newJoiner.employmentDetails?.designation || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {newJoiner.employmentDetails?.joiningDate ? 
                            new Date(newJoiner.employmentDetails.joiningDate).toLocaleDateString() 
                            : "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDocuments(newJoiner)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              title="View Documents"
                            >
                              📄 Documents
                            </button>
                            <button
                              onClick={() => handleVerifyNewJoiner(newJoiner)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                              title="Verify New Joiner"
                            >
                              ✅ Verify
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))
                  : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        {searchQuery ? `No new joiners found matching "${searchQuery}"` : "No new joiners found"}
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

            {/* Add Modal */}
            {isAddModalOpen && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">Add New Joiner</h2>

                  <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {/* Basic Information */}
                    <div className="col-span-full">
                      <h3 className="text-lg font-semibold mb-2 text-blue-900">
                        Basic Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter employee ID"
                        required
                        value={newJoinerForm.employmentDetails.employeeId}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              employeeId: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter email address"
                        type="email"
                        required
                        value={newJoinerForm.email}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter first name"
                        required
                        value={newJoinerForm.profile.firstName}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              firstName: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter last name"
                        required
                        value={newJoinerForm.profile.lastName}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              lastName: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter job designation"
                        required
                        value={newJoinerForm.employmentDetails.designation}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              designation: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={newJoinerForm.employmentDetails.department}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              department: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dep) => (
                          <option key={dep._id} value={dep._id}>
                            {dep.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col col-span-full">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Joining Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newJoinerForm.employmentDetails.joiningDate}
                        onChange={(e) =>
                          setNewJoinerForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              joiningDate: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 max-w-xs"
                      />
                    </div>

                    {/* Document Requirements Section */}
                    <div className="col-span-full mt-4">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900">
                        Required Documents
                      </h3>
                      
                      {/* Add new document input */}
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          placeholder="Enter document name (e.g., Aadhar Card, PAN Card)"
                          value={newDocumentName}
                          onChange={(e) => setNewDocumentName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button" // Add this to prevent form submission
                          onClick={(e) => {
                            e.preventDefault(); // Add this to prevent default behavior
                            addDocumentRequirement();
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Add Document
                        </button>
                      </div>

                      {/* List of document requirements */}
                      {documentRequirements.length > 0 ? (
                        <div className="space-y-2">
                          {documentRequirements.map((doc, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={doc.isRequired}
                                    onChange={(e) => {
                                      const updatedDocs = [...documentRequirements];
                                      updatedDocs[index].isRequired = e.target.checked;
                                      setDocumentRequirements(updatedDocs);
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium">Required</span>
                                </label>
                                <span className="text-gray-700">{doc.name}</span>
                              </div>
                              <button
                                onClick={() => removeDocumentRequirement(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No document requirements added yet</p>
                      )}
                    </div>
                  </form>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setSelectedNewJoiner(null);
                        resetNewJoinerForm();
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitHandler}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? "Adding..." : "Add New Joiner"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Modal */}
            {isDocumentsModalOpen && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Documents - {selectedEmployeeName}
                    </h2>
                    <button
                      onClick={() => {
                        setIsDocumentsModalOpen(false);
                        setCurrentEmployeeId(null);
                        setVerifyingNewJoiner(null);
                        setSelectedDocuments([]);
                        setSelectedEmployeeName("");
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {selectedDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDocuments.map((doc, docIndex) => (
                        <div key={docIndex} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-blue-900 mb-3 capitalize">
                            {doc.name}
                          </h3>
                          
                          {doc.files && doc.files.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {doc.files.map((file, fileIndex) => (
                                <div
                                  key={fileIndex}
                                  className="border border-gray-300 rounded-lg p-3 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-2xl">
                                        {getFileTypeIcon(file.type)}
                                      </span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          File {fileIndex + 1}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {file.type || 'Unknown type'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {doc.isValid ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                          Verified ✓
                                        </span>
                                      ) : doc.validatedBy ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                          Invalid ✗
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-500 mb-3">
                                    Uploaded: {file.uploadedAt ? 
                                      new Date(file.uploadedAt).toLocaleDateString() : 
                                      'Unknown date'
                                    }
                                  </div>

                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => openDocument(file.url)}
                                      className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                                    >
                                      View Document
                                    </button>
                                    
                                    {/* Add validation buttons */}
                                    <div className="flex gap-2">
                                      {doc.isValid ? (
                                        // Show only Invalidate button for verified documents
                                        <button
                                          onClick={() => handleInvalidateDocument(currentEmployeeId, doc.name)}
                                          disabled={loading}
                                          className={`w-full px-3 py-1 text-sm rounded ${
                                            loading
                                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                                          }`}
                                        >
                                          {loading ? 'Processing...' : 'Invalidate'}
                                        </button>
                                      ) : doc.validatedBy ? (
                                        // Show only Validate button for invalid documents
                                        <button
                                          onClick={() => handleValidateDocument(currentEmployeeId, doc.name)}
                                          disabled={loading}
                                          className={`w-full px-3 py-1 text-sm rounded ${
                                            loading
                                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                                          }`}
                                        >
                                          {loading ? 'Processing...' : 'Validate'}
                                        </button>
                                      ) : (
                                        // Show both buttons for pending documents
                                        <div className="flex gap-2 w-full">
                                          <button
                                            onClick={() => handleValidateDocument(currentEmployeeId, doc.name)}
                                            disabled={loading}
                                            className={`flex-1 px-3 py-1 text-sm rounded ${
                                              loading
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                          >
                                            {loading ? 'Processing...' : 'Validate'}
                                          </button>
                                          <button
                                            onClick={() => handleInvalidateDocument(currentEmployeeId, doc.name)}
                                            disabled={loading}
                                            className={`flex-1 px-3 py-1 text-sm rounded ${
                                              loading
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}
                                          >
                                            {loading ? 'Processing...' : 'Invalidate'}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No files available for this document type.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-gray-500 text-lg">No documents available for this employee.</p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsDocumentsModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Verify Modal */}
            {isVerifyModalOpen && verifyingNewJoiner && (
              <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                      Verify New Joiner - {verifyingNewJoiner.user?.profile?.firstName} {verifyingNewJoiner.user?.profile?.lastName}
                    </h2>
                    <button
                      onClick={() => {
                        setIsVerifyModalOpen(false);
                        setVerifyingNewJoiner(null);
                        resetVerifyForm();
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                    {/* Profile Information */}
                    <div className="col-span-full">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900 border-b pb-2">
                        Profile Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter first name"
                        required
                        value={verifyForm.profile.firstName}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              firstName: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter last name"
                        required
                        value={verifyForm.profile.lastName}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              lastName: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        placeholder="Enter phone number"
                        value={verifyForm.profile.phone}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              phone: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Personal Details */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900 border-b pb-2">
                        Personal Details
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={verifyForm.personalDetails.gender}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              gender: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                        value={verifyForm.personalDetails.dateOfBirth}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              dateOfBirth: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        placeholder="Enter city"
                        value={verifyForm.personalDetails.city}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              city: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        placeholder="Enter state"
                        value={verifyForm.personalDetails.state}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              state: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        PAN Number
                      </label>
                      <input
                        placeholder="Enter PAN number"
                        value={verifyForm.personalDetails.panNo}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              panNo: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Aadhar Number
                      </label>
                      <input
                        placeholder="Enter Aadhar number"
                        value={verifyForm.personalDetails.aadharNo}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              aadharNo: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        UAN Number
                      </label>
                      <input
                        placeholder="Enter UAN number"
                        value={verifyForm.personalDetails.uanNo}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              uanNo: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        ESIC Number
                      </label>
                      <input
                        placeholder="Enter ESIC number"
                        value={verifyForm.personalDetails.esicNo}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              esicNo: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        placeholder="Enter bank account number"
                        value={verifyForm.personalDetails.bankAccountNo}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              bankAccountNo: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        IFSC Code
                      </label>
                      <input
                        placeholder="Enter IFSC code"
                        value={verifyForm.personalDetails.ifscCode}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              ifscCode: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Personal Email
                      </label>
                      <input
                        type="email"
                        placeholder="Enter personal email"
                        value={verifyForm.personalDetails.personalEmail}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              personalEmail: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Official Mobile
                      </label>
                      <input
                        placeholder="Enter official mobile number"
                        value={verifyForm.personalDetails.officialMobile}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              officialMobile: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Personal Mobile
                      </label>
                      <input
                        placeholder="Enter personal mobile number"
                        value={verifyForm.personalDetails.personalMobile}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            personalDetails: {
                              ...prev.personalDetails,
                              personalMobile: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Employment Details */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900 border-b pb-2">
                        Employment Details
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter employee ID"
                        required
                        value={verifyForm.employmentDetails.employeeId}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              employeeId: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <input
                        placeholder="Enter designation"
                        required
                        value={verifyForm.employmentDetails.designation}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              designation: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={verifyForm.employmentDetails.department}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              department: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                        Joining Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={verifyForm.employmentDetails.joiningDate}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              joiningDate: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Employment Type
                      </label>
                      <select
                        value={verifyForm.employmentDetails.employmentType}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              employmentType: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Work Location
                      </label>
                      <input
                        placeholder="Enter work location"
                        value={verifyForm.employmentDetails.workLocation}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              workLocation: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Cost Center
                      </label>
                      <input
                        placeholder="Enter cost center"
                        value={verifyForm.employmentDetails.costCenter}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              costCenter: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Business Area
                      </label>
                      <input
                        placeholder="Enter business area"
                        value={verifyForm.employmentDetails.businessArea}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              businessArea: e.target.value,
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Salary Information */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900 border-b pb-2">
                        Salary Information
                      </h3>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Base Salary
                      </label>
                      <input
                        type="number"
                        placeholder="Enter base salary"
                        value={verifyForm.employmentDetails.salary.base}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              salary: {
                                ...prev.employmentDetails.salary,
                                base: Number(e.target.value),
                              },
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Bonus
                      </label>
                      <input
                        type="number"
                        placeholder="Enter bonus amount"
                        value={verifyForm.employmentDetails.salary.bonus}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              salary: {
                                ...prev.employmentDetails.salary,
                                bonus: Number(e.target.value),
                              },
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        Tax Deductions
                      </label>
                      <input
                        type="number"
                        placeholder="Enter tax deductions"
                        value={verifyForm.employmentDetails.salary.taxDeductions}
                        onChange={(e) =>
                          setVerifyForm((prev) => ({
                            ...prev,
                            employmentDetails: {
                              ...prev.employmentDetails,
                              salary: {
                                ...prev.employmentDetails.salary,
                                taxDeductions: Number(e.target.value),
                              },
                            },
                          }))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Compliance Flags */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900 border-b pb-2">
                        Compliance & Benefits
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 col-span-full">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={verifyForm.employmentDetails.pfFlag}
                          onChange={(e) =>
                            setVerifyForm((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                pfFlag: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">PF Applicable</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={verifyForm.employmentDetails.esicFlag}
                          onChange={(e) =>
                            setVerifyForm((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                esicFlag: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">ESIC Applicable</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={verifyForm.employmentDetails.ptFlag}
                          onChange={(e) =>
                            setVerifyForm((prev) => ({
                              ...prev,
                              employmentDetails: {
                                ...prev.employmentDetails,
                                ptFlag: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">PT Applicable</span>
                      </label>
                    </div>

                    {/* Leave Balance */}
                    <div className="col-span-full mt-6">
                      <h3 className="text-lg font-semibold mb-3 text-blue-900 border-b pb-2">
                        Leave Balance
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-full">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Casual Leave
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter casual leave balance"
                          value={verifyForm.leaveBalance.casual}
                          onChange={(e) =>
                            setVerifyForm((prev) => ({
                              ...prev,
                              leaveBalance: {
                                ...prev.leaveBalance,
                                casual: Number(e.target.value),
                              },
                            }))}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Sick Leave
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter sick leave balance"
                          value={verifyForm.leaveBalance.sick}
                          onChange={(e) =>
                            setVerifyForm((prev) => ({
                              ...prev,
                              leaveBalance: {
                                ...prev.leaveBalance,
                                sick: Number(e.target.value),
                              },
                            }))}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Earned Leave
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Enter earned leave balance"
                          value={verifyForm.leaveBalance.earned}
                          onChange={(e) =>
                            setVerifyForm((prev) => ({
                              ...prev,
                              leaveBalance: {
                                ...prev.leaveBalance,
                                earned: Number(e.target.value),
                              },
                            }))}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="col-span-full mt-8 flex justify-end gap-3 border-t pt-4">
                      <button
                        onClick={() => {
                          setIsVerifyModalOpen(false);
                          setVerifyingNewJoiner(null);
                          resetVerifyForm();
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={verifySubmitHandler}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
                      >
                        {loading ? "Verifying..." : "Verify & Convert to Employee"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AddNewJoiners;