import React, { useEffect, useState } from "react";
import EmployeeSidebar from "../components/EmployeeSidebar";
import { useDispatch, useSelector } from "react-redux";
import { employeeEndpoints } from "../services/api";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import toast from "react-hot-toast";
import EmployeeHeader from "../components/EmployeeHeader";

const { getEmployeeProfile, updateEmployeeProfile } = employeeEndpoints;

// Skills Editor Component
const SkillsEditor = ({ skills, onSkillsChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSkill = () => {
    const newSkill = inputValue.trim();
    if (newSkill && !skills.includes(newSkill)) {
      onSkillsChange([...skills, newSkill]);
      setInputValue('');
    }
  };

  const removeSkill = (indexToRemove) => {
    onSkillsChange(skills.filter((_, index) => index !== indexToRemove));
  };

  const handleBulkAdd = () => {
    const newSkills = inputValue
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill && !skills.includes(skill));
    
    if (newSkills.length > 0) {
      onSkillsChange([...skills, ...newSkills]);
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Enter skills (press Enter or comma to add)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addSkill}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={handleBulkAdd}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add All
        </button>
      </div>
      
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm flex items-center gap-2"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="text-blue-600 hover:text-blue-800 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <p className="text-sm text-gray-600">
        Type skills and press Enter or comma to add them. Click × to remove.
      </p>
    </div>
  );
};

const EmployeeProfile = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);

  const dispatch = useDispatch();
  
  // State for employee details and editing
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editableData, setEditableData] = useState({
    firstName: "",
    lastName: "",
    skills: [],
    gender: "",
    dateOfBirth: "",
    city: "",
    state: "",
    personalEmail: "",
    personalMobile: "",
  });

  const fetchEmployeeDetails = async () => {
    try {
      dispatch(setLoading(true));
      console.log('Fetching employee details for:', employee._id);
      
      const response = await apiConnector("GET", `${getEmployeeProfile}${employee._id}`, null, {
        Authorization: `Bearer ${token}`
      });
      
      console.log("Employee details response:", response);
      setEmployeeDetails(response.data.data.employee);
      
      // Initialize editable data
      const emp = response.data.data.employee;
      const newEditableData = {
        firstName: emp?.user?.profile?.firstName || "",
        lastName: emp?.user?.profile?.lastName || "",
        skills: Array.isArray(emp?.employmentDetails?.skills) ? emp.employmentDetails.skills : [],
        gender: emp?.personalDetails?.gender || "",
        dateOfBirth: emp?.personalDetails?.dateOfBirth ? emp.personalDetails.dateOfBirth.split('T')[0] : "",
        city: emp?.personalDetails?.city || "",
        state: emp?.personalDetails?.state || "",
        personalEmail: emp?.personalDetails?.personalEmail || "",
        personalMobile: emp?.personalDetails?.personalMobile || "",
      };
      
      setEditableData(newEditableData);
      console.log("Editable data initialized:", newEditableData);
      
      // Set avatar preview - check both locations
      if (emp?.user?.profile?.avatar) {
        setAvatarPreview(emp.user.profile.avatar);
      } else if (emp?.employmentDetails?.avatar) {
        setAvatarPreview(emp.employmentDetails.avatar);
      }
      
    } catch (error) {
      toast.error("Unable to fetch employee details!");
      console.error("Error while fetching employee details:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      dispatch(setLoading(true));
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add individual fields
      formData.append('firstName', editableData.firstName);
      formData.append('lastName', editableData.lastName);
      formData.append('gender', editableData.gender);
      formData.append('dob', editableData.dateOfBirth);
      formData.append('city', editableData.city);
      formData.append('state', editableData.state);
      formData.append('personalEmail', editableData.personalEmail);
      formData.append('personalMobile', editableData.personalMobile);
      
      // Send skills as JSON string (the backend will handle parsing)
      formData.append('skills', JSON.stringify(editableData.skills));
      
      // Add avatar file if selected
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      console.log('Sending form data:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await apiConnector(
        "PUT", 
        `${updateEmployeeProfile}${employee._id}`, 
        formData, 
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      );

      console.log('Update response:', response);

      if (response.data.status === 'success') {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setAvatarFile(null);
        await fetchEmployeeDetails(); // Refresh data
      }
    } catch (error) {
      toast.error("Failed to update profile!");
      console.error("Error updating profile:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    
    // Reset avatar preview to original
    if (employeeDetails?.user?.profile?.avatar) {
      setAvatarPreview(employeeDetails.user.profile.avatar);
    } else if (employeeDetails?.employmentDetails?.avatar) {
      setAvatarPreview(employeeDetails.employmentDetails.avatar);
    } else {
      setAvatarPreview(null);
    }
    
    // Reset editable data to original values
    if (employeeDetails) {
      const emp = employeeDetails;
      const resetData = {
        firstName: emp.user?.profile?.firstName || "",
        lastName: emp.user?.profile?.lastName || "",
        skills: Array.isArray(emp.employmentDetails?.skills) ? emp.employmentDetails.skills : [],
        gender: emp.personalDetails?.gender || "",
        dateOfBirth: emp.personalDetails?.dateOfBirth ? emp.personalDetails.dateOfBirth.split('T')[0] : "",
        city: emp.personalDetails?.city || "",
        state: emp.personalDetails?.state || "",
        personalEmail: emp.personalDetails?.personalEmail || "",
        personalMobile: emp.personalDetails?.personalMobile || "",
      };
      
      setEditableData(resetData);
      console.log("Data reset to original:", resetData);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="relative">
        <EmployeeSidebar />
        <div className="w-full lg:ml-[20vw] lg:w-[80vw] pr-4 pb-10">
          <div className="w-[100vw] flex justify-center z-0 top-0 left-9 items-center px-6 lg:px-0 py-6 lg:py-0 min-h-[8vh] text-3xl text-white bg-gray-600 font-semibold lg:w-[80vw]">
            Employee Panel ({employee?.user?.profile?.firstName})
          </div>
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw] pr-4 pb-10">
        {/* Employee panel bar */}
      <EmployeeHeader/>
        
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold">Employee Profile</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-x-3">
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {employeeDetails && (
            <>
              {/* Debug info - remove in production */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800">Debug Info:</h4>
                <p className="text-xs text-blue-600">
                  Employee loaded: {employeeDetails ? 'Yes' : 'No'} | 
                  User: {employeeDetails?.user?.profile?.firstName || 'Not found'} | 
                  Personal Details: {employeeDetails?.personalDetails ? 'Yes' : 'No'} | 
                  Original Skills: [{Array.isArray(employeeDetails?.employmentDetails?.skills) ? employeeDetails.employmentDetails.skills.join(', ') : 'none'}] |
                  Editable Skills: [{Array.isArray(editableData.skills) ? editableData.skills.join(', ') : 'none'}]
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Avatar & Basic Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                    Profile Picture & Basic Info
                  </h3>
                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      {isEditing && (
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          Click the camera icon to upload a new avatar
                          <br />
                          (Max 5MB, PNG/JPG/JPEG)
                        </p>
                      )}
                    </div>

                      {/* Employee ID (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Employee ID:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                        {employeeDetails.employmentDetails?.employeeId || "Not provided"}
                      </p>
                    </div>

                    {/* First Name */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        First Name:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{employeeDetails.user?.profile?.firstName || "Not provided"}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Last Name:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{employeeDetails.user?.profile?.lastName || "Not provided"}</p>
                      )}
                    </div>

                  
                  </div>
                </div>

                {/* Personal Information Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    {/* Gender */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Gender:
                      </label>
                      {isEditing ? (
                        <select
                          value={editableData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 ml-3 capitalize">{employeeDetails.personalDetails?.gender || "Not provided"}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Date of Birth:
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editableData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{formatDate(employeeDetails.personalDetails?.dateOfBirth)}</p>
                      )}
                    </div>

                    {/* City */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        City:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{employeeDetails.personalDetails?.city || "Not provided"}</p>
                      )}
                    </div>

                    {/* State */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        State:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{employeeDetails.personalDetails?.state || "Not provided"}</p>
                      )}
                    </div>

                    {/* Official Email (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Official Email:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                        {employeeDetails.user?.email || "Not provided"}
                      </p>
                    </div>

                    {/* Personal Email */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Personal Email:
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editableData.personalEmail}
                          onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{employeeDetails.personalDetails?.personalEmail || "Not provided"}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    {/* Official Mobile (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Official Mobile:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                        {employeeDetails.user?.profile?.phone || "Not provided"}
                      </p>
                    </div>

                    {/* Personal Mobile */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Personal Mobile:
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editableData.personalMobile}
                          onChange={(e) => handleInputChange('personalMobile', e.target.value)}
                          className="flex-1 ml-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 ml-3">{employeeDetails.personalDetails?.personalMobile || "Not provided"}</p>
                      )}
                    </div>

                    {/* Skills - This one needs vertical layout due to complexity */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Skills:
                      </label>

                      {isEditing ? (
                        <SkillsEditor
                          skills={editableData.skills}
                          onSkillsChange={(skills) => handleInputChange('skills', skills)}
                        />
                      ) : (
                        <div className="ml-3">
                          {Array.isArray(employeeDetails.employmentDetails?.skills) && employeeDetails.employmentDetails.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {employeeDetails.employmentDetails.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">No skills added</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employment Details Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                    Employment Details
                  </h3>
                  <div className="space-y-4">
                    {/* Department (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Department:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded capitalize flex-1">
                        {employeeDetails.employmentDetails?.department?.name || "Not provided"}
                      </p>
                    </div>

                    {/* Designation (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Designation:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded capitalize flex-1">
                        {employeeDetails.employmentDetails?.designation || "Not provided"}
                      </p>
                    </div>

                    {/* Employment Type (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Employment Type:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded capitalize flex-1">
                        {employeeDetails.employmentDetails?.employmentType || "Not provided"}
                      </p>
                    </div>

                    {/* Joining Date (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Joining Date:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                        {formatDate(employeeDetails.employmentDetails?.joiningDate)}
                      </p>
                    </div>

                    {/* Status (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Status:
                      </label>
                      <span className={`ml-3 inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        employeeDetails.employmentDetails?.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employeeDetails.employmentDetails?.status || "Not provided"}
                      </span>
                    </div>

                    {/* Company (Read-only) */}
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                        Company:
                      </label>
                      <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                        {employeeDetails.company?.name || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                    Additional Details
                  </h3>
                <div className="space-y-4">
                  {/* Role (Read-only) */}
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                      Role:
                    </label>
                    <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded capitalize flex-1">
                      {employeeDetails.user?.role || "Not provided"}
                    </p>
                  </div>

                  {/* Shift (Read-only) */}
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                      Shift:
                    </label>
                    <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                      {employeeDetails.employmentDetails?.shift?.name || "Not provided"}
                      {employeeDetails.employmentDetails?.shift?.startTime && 
                       employeeDetails.employmentDetails?.shift?.endTime && (
                        <span className="text-sm text-gray-600 ml-2">
                          ({employeeDetails.employmentDetails.shift.startTime} - {employeeDetails.employmentDetails.shift.endTime})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Reporting To (Read-only) */}
                  <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 w-32 flex-shrink-0">
                      Reporting To:
                    </label>
                    <p className="text-gray-900 ml-3 bg-gray-100 px-3 py-1 rounded flex-1">
                      {employeeDetails.employmentDetails?.reportingTo?.user?.profile?.firstName 
                        ? `${employeeDetails.employmentDetails.reportingTo.user.profile.firstName} ${employeeDetails.employmentDetails.reportingTo.user.profile.lastName || ''}`.trim()
                        : "Not provided"}
                    </p>
                  </div>

                  {/* Leave Balance (Read-only) - This needs vertical layout */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Leave Balance:
                    </label>
                    <div className="ml-3 bg-gray-100 p-3 rounded">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Casual:</p>
                          <p className="text-gray-900">{employeeDetails.leaveBalance?.casual || 0} days</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Sick:</p>
                          <p className="text-gray-900">{employeeDetails.leaveBalance?.sick || 0} days</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Earned:</p>
                          <p className="text-gray-900">{employeeDetails.leaveBalance?.earned || 0} days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;