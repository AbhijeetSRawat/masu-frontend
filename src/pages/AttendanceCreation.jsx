import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import SubAdminSidebar from '../components/SubAdminSidebar';
import SubAdminHeader from '../components/SubAdminHeader';
import ManagerHeader from '../components/ManagerHeader';
import ManagerSidebar from '../components/ManagerSidebar';
import HRSidebar from '../components/HRSidebar';
import HRHeader from '../components/HRHeader';
import { apiConnector } from '../services/apiConnector';
import { attendanceEndpoints, departmentEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaClock,
  FaBuilding,
  FaArrowLeft,
  FaUserTie
} from 'react-icons/fa';

// Department Selection Component for Admins
const DepartmentSelection = ({ departments, onSelectDepartment, loading, company }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-2 text-gray-600">Loading departments...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Department</h2>
        <p className="text-gray-600">Choose a department to manage attendance for its employees</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <FaBuilding className="text-4xl text-gray-300 mb-4 mx-auto" />
          <p className="text-lg font-medium text-gray-600 mb-2">No departments found</p>
          <p className="text-gray-500">
            {departments.length === 0 
              ? 'No departments available in your company.' 
              : 'Try adjusting your search criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <div
              key={dept._id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer group hover:border-blue-300"
              onClick={() => onSelectDepartment(dept)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FaBuilding className="text-blue-600 text-xl" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {dept.name}
                    </h3>
                  </div>
                </div>
              </div>

              {dept.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {dept.description.length > 100 
                    ? `${dept.description.substring(0, 100)}...` 
                    : dept.description
                  }
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <FaUserTie className="text-gray-400 mr-2" />
                  <span className="text-gray-600">Manager: </span>
                  <span className="text-gray-800 font-medium">
                    {dept.manager?.user?.profile?.firstName 
                      ? `${dept.manager.user.profile.firstName} ${dept.manager.user.profile.lastName || ""}`
                      : "Not Assigned"
                    }
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <FaUsers className="text-gray-400 mr-2" />
                  <span className="text-gray-600">HR: </span>
                  <span className="text-gray-800 font-medium">
                    {dept.hr?.user?.profile?.firstName 
                      ? `${dept.hr.user.profile.firstName} ${dept.hr.user.profile.lastName || ""}`
                      : "Not Assigned"
                    }
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Select Department
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Modal Component for Attendance Details with Direct API Updates
const AttendanceModal = ({ isOpen, onClose, attendanceData, onUpdateAttendance, token, selectedDate }) => {
  const [editMode, setEditMode] = useState(false);
  const [tempStatus, setTempStatus] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const attendanceStatusOptions = [
    { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', icon: FaCheck },
    { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', icon: FaTimes },
    { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-800', icon: FaExclamationTriangle },
    { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: FaExclamationTriangle },
    { value: 'holiday', label: 'Holiday', color: 'bg-blue-100 text-blue-800', icon: FaCalendarAlt },
    { value: 'week_off', label: 'Week Off', color: 'bg-purple-100 text-purple-800', icon: FaCalendarAlt },
  ];

  useEffect(() => {
    if (attendanceData) {
      setTempStatus(attendanceData.status);
      setTempNotes(attendanceData.notes || '');
    }
  }, [attendanceData]);

  const handleSaveChanges = async () => {
    if (!attendanceData || !token) return;

    try {
      setIsUpdating(true);
      
      if (attendanceData.isExisting && attendanceData.attendanceId) {
        const updateData = {
          status: tempStatus,
          notes: tempNotes || '',
          date: selectedDate,
          shift: attendanceData.employeeData?.shift || null
        };

        const response = await apiConnector(
          'PUT',
          `${attendanceEndpoints.updateAttendance}${attendanceData.attendanceId}`,
          updateData,
          { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        );

        if (response.data?.attendance) {
          toast.success('Attendance updated successfully');
          if (onUpdateAttendance) {
            onUpdateAttendance(attendanceData.employee, tempStatus, tempNotes);
          }
          setEditMode(false);
          onClose();
        }
      } else {
        const createData = {
          employee: attendanceData.employee,
          company: attendanceData.employeeData?.company || attendanceData.company,
          date: selectedDate,
          status: tempStatus,
          notes: tempNotes || '',
          shift: attendanceData.employeeData?.shift || null
        };

        const response = await apiConnector(
          'POST',
          attendanceEndpoints.createAttendance,
          createData,
          { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        );

        if (response.data) {
          toast.success('Attendance created successfully');
          if (onUpdateAttendance) {
            onUpdateAttendance(attendanceData.employee, tempStatus, tempNotes, response.data._id);
          }
          setEditMode(false);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save attendance';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusOption = attendanceStatusOptions.find(opt => opt.value === status);
    const IconComponent = statusOption?.icon || FaCheck;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusOption?.color}`}>
        <IconComponent className="w-4 h-4 mr-2" />
        {statusOption?.label}
      </span>
    );
  };

  if (!isOpen || !attendanceData) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-3xl bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Attendance Details
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              disabled={isUpdating}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <FaEdit className="w-4 h-4" />
              {editMode ? 'Cancel Edit' : 'Edit'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-800 font-medium">
                  {`${attendanceData.employeeData?.user?.profile?.firstName || ''} ${attendanceData.employeeData?.user?.profile?.lastName || ''}`.trim() || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Employee ID</label>
                <p className="text-gray-800 font-medium">
                  {attendanceData.employeeData?.employmentDetails?.employeeId || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-800 font-medium">
                  {attendanceData.employeeData?.employmentDetails?.department?.name || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-800 font-medium">
                  {attendanceData.employeeData?.user?.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Attendance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Date</label>
                <p className="text-gray-800 font-medium flex items-center">
                  <FaCalendarAlt className="w-4 h-4 mr-2 text-blue-500" />
                  {new Date(attendanceData.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                {editMode ? (
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    disabled={isUpdating}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    {attendanceStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1">
                    {getStatusDisplay(attendanceData.status)}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600">Notes</label>
              {editMode ? (
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Add notes..."
                  maxLength={200}
                  rows={3}
                  disabled={isUpdating}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              ) : (
                <p className="mt-1 text-gray-800">
                  {attendanceData.notes || 'No notes added'}
                </p>
              )}
            </div>

            {attendanceData.isExisting && (
              <div className="mt-4 flex items-center text-green-600">
                <FaClock className="w-4 h-4 mr-2" />
                <span className="text-sm">This attendance record has been saved to the system</span>
              </div>
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={() => setEditMode(false)}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating && <FaSpinner className="animate-spin w-4 h-4" />}
              {isUpdating ? (attendanceData.isExisting ? 'Updating...' : 'Creating...') : (attendanceData.isExisting ? 'Update Status' : 'Create Attendance')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AttendanceCreation = () => {
  // State management
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [updateInProgress, setUpdateInProgress] = useState(new Set());
  const [bulkUpdateInProgress, setBulkUpdateInProgress] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // Admin-specific states
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [managerId, setManagerId] = useState(null); // Store the manager ID for API calls
  
  // Modal state
  const [selectedAttendanceForModal, setSelectedAttendanceForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Backend pagination state
  const [employeePagination, setEmployeePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEmployees: 0,
    limit: 50,
    loading: false
  });
  
  const [attendancePagination, setAttendancePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 100,
    loading: false
  });
  
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.employees.reduxEmployee);
  const company = useSelector((state) => state.permissions.company);
  const reduxRole = useSelector(state => state.auth.role)

  const attendanceStatusOptions = [
    { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', icon: FaCheck },
    { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', icon: FaTimes },
    { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-800', icon: FaExclamationTriangle },
    { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: FaExclamationTriangle },
    { value: 'holiday', label: 'Holiday', color: 'bg-blue-100 text-blue-800', icon: FaCalendarAlt },
    { value: 'week_off', label: 'Week Off', color: 'bg-purple-100 text-purple-800', icon: FaCalendarAlt },
  ];

  // Memoized calculations for performance
  const attendanceStats = useMemo(() => {
    const stats = attendanceStatusOptions.reduce((acc, option) => {
      acc[option.value] = attendanceData.filter(item => item.status === option.value).length;
      return acc;
    }, {});
    stats.total = attendanceData.length;
    return stats;
  }, [attendanceData]);

  // Client-side filtering (for currently loaded data only)
  const filteredAttendanceData = useMemo(() => {
    return attendanceData.filter(item => {
      if (!item.employeeData) return false;
      
      const employeeName = `${item.employeeData?.user?.profile?.firstName || ''} ${item.employeeData?.user?.profile?.lastName || ''}`.trim().toLowerCase();
      const employeeId = item.employeeData?.employmentDetails?.employeeId?.toLowerCase() || '';
      const department = item.employeeData?.employmentDetails?.department?.name?.toLowerCase() || '';
      
      const matchesSearch = !searchTerm || 
        employeeName.includes(searchTerm.toLowerCase()) ||
        employeeId.includes(searchTerm.toLowerCase()) ||
        department.includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [attendanceData, searchTerm, statusFilter]);

  // Fetch departments for admin
  const fetchDepartments = useCallback(async () => {
    if (!company?._id || !token) return;

    try {
      setDepartmentsLoading(true);
      const response = await apiConnector(
        "GET", 
        departmentEndpoints.GET_ALL_DEPARTMENTS + company._id,
        null,
        { Authorization: `Bearer ${token}` }
      );
      
      if (response.data?.data) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setDepartmentsLoading(false);
    }
  }, [company?._id, token]);

  // Handle department selection for admin
  const handleDepartmentSelect = useCallback((department) => {
    setSelectedDepartment(department);
    
    // Get the manager ID from the selected department
    const deptManagerId = department.manager?.user?._id;
    if (deptManagerId) {
      setManagerId(deptManagerId);
      toast.success(`Selected ${department.name} - Manager: ${department.manager.user.profile?.firstName || 'Unknown'}`);
    } else {
      toast.error('This department does not have a manager assigned');
      return;
    }
  }, []);

  // Reset department selection
  const handleBackToDepartments = useCallback(() => {
    setSelectedDepartment(null);
    setManagerId(null);
    setEmployees([]);
    setAttendanceData([]);
    setSelectedEmployees(new Set());
  }, []);

  // Dynamic API endpoint based on user role or selected manager
  const getEmployeesEndpoint = useCallback(() => {
    if ((user?.role === 'admin' || user?.role === 'superadmin' || reduxRole === 'superadmin') && managerId) {
      console.log("i am running")
      return `${attendanceEndpoints.getEmoployeesUnderHr}${managerId}`;
    } else if (user?.role === 'manager') {
      return `${attendanceEndpoints.getEmoployeesUnderHr}${user.id}`;
    } else {
      return `${attendanceEndpoints.getEmoployeesUnderHr}${user.id}`;
    }
  }, [user?.role, user?.id, managerId, reduxRole]);

  const getAttendanceEndpoint = useCallback(() => {
    if ((user?.role === 'admin' || user?.role === 'superadmin' || reduxRole === 'superadmin') && managerId) {
      return `${attendanceEndpoints.getAttendanceByDate}${managerId}`;
    } else if (user?.role === 'manager') {
      return `${attendanceEndpoints.getAttendanceByDate}${user.id}`;
    } else {
      return `${attendanceEndpoints.getAttendanceByDate}${user.id}`;
    }
  }, [user?.role, user?.id, managerId, reduxRole]);

  // Auto-refresh function
  const autoRefreshData = useCallback(async () => {
    console.log('Auto-refreshing data after update...');
    try {
      await Promise.all([
        fetchEmployees(employeePagination.currentPage, employeePagination.limit),
        fetchExistingAttendance(attendancePagination.currentPage, attendancePagination.limit)
      ]);
      console.log('Auto-refresh completed');
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, [employeePagination.currentPage, employeePagination.limit, attendancePagination.currentPage, attendancePagination.limit]);

  // Fetch employees with backend pagination
  const fetchEmployees = useCallback(async (page = 1, limit = 50) => {
    // Update role check to include superadmin
    const currentUserId = ((user?.role === 'admin' || user?.role === 'superadmin' || reduxRole === 'superadmin') && managerId) 
      ? managerId 
      : user?.id;

    if (!currentUserId || !token) {
      toast.error('User authentication required');
      return;
    }

    try {
      setEmployeePagination(prev => ({ ...prev, loading: true }));
      console.log(`Fetching employees for ${user?.role || reduxRole} - Page: ${page}, Limit: ${limit}`);
      
      const response = await apiConnector(
        'GET',
        `${getEmployeesEndpoint()}?page=${page}&limit=${limit}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      console.log(response)

      if (response.data?.employees) {
        const { employees: fetchedEmployees, totalEmployees, totalPages, page: currentPage } = response.data;
        setEmployees(fetchedEmployees);
        setEmployeePagination({
          currentPage: Number(currentPage),
          totalPages: Number(totalPages),
          totalEmployees: Number(totalEmployees),
          limit: Number(limit),
          loading: false
        });
        
        initializeAttendanceData(fetchedEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setEmployeePagination(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, token, getEmployeesEndpoint, managerId, user?.role, reduxRole]);

  // Fetch existing attendance with backend pagination
  const fetchExistingAttendance = useCallback(async (page = 1, limit = 100) => {
    const currentUserId = ((user?.role === 'admin' || user?.role === 'superadmin' || reduxRole === 'superadmin') && managerId) 
      ? managerId 
      : user?.id;
    
    if (!currentUserId || !token || !selectedDate) return;

    try {
      setAttendancePagination(prev => ({ ...prev, loading: true }));
      const response = await apiConnector(
        'GET',
        `${getAttendanceEndpoint()}?date=${selectedDate}&page=${page}&limit=${limit}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.attendances) {
        updateAttendanceWithExisting(response.data.attendances);
        setAttendancePagination({
          currentPage: Number(response.data.page),
          totalPages: Number(response.data.totalPages),
          totalRecords: Number(response.data.totalRecords),
          limit: Number(limit),
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
      setAttendancePagination(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, token, selectedDate, getAttendanceEndpoint, managerId, user?.role, reduxRole]);

  const initializeAttendanceData = useCallback((employeeList) => {
    const initialData = employeeList.map(employee => ({
      employee: employee._id,
      employeeData: employee,
      date: selectedDate,
      status: 'absent',
      notes: '',
      isExisting: false,
      attendanceId: null,
      company: employee.company
    }));
    setAttendanceData(initialData);
    console.log('Initialized attendance data for', employeeList.length, 'employees for date:', selectedDate);
  }, [selectedDate]);

  const updateAttendanceWithExisting = useCallback((existingAttendance) => {
    setAttendanceData(prev => 
      prev.map(item => {
        const existing = existingAttendance.find(att => {
          const employeeId = att.employee._id || att.employee;
          return employeeId === item.employee;
        });
        
        if (existing) {
          return {
            ...item,
            status: existing.status,
            notes: existing.notes || '',
            isExisting: true,
            attendanceId: existing._id,
            date: selectedDate
          };
        } else {
          return {
            ...item,
            status: 'absent',
            notes: '',
            isExisting: false,
            attendanceId: null,
            date: selectedDate
          };
        }
      })
    );
  }, [selectedDate]);

  // Employee pagination handlers
  const handleEmployeePageChange = useCallback(async (newPage) => {
    if (newPage >= 1 && newPage <= employeePagination.totalPages && !employeePagination.loading) {
      await fetchEmployees(newPage, employeePagination.limit);
    }
  }, [fetchEmployees, employeePagination.totalPages, employeePagination.loading, employeePagination.limit]);

  // Load all employees for attendance creation
  const loadAllEmployees = useCallback(async () => {
    const currentUserId = ((user?.role === 'admin' || user?.role === 'superadmin' || reduxRole === 'superadmin') && managerId) 
      ? managerId 
      : user?.id;
    
    if (!currentUserId || !token) return;
    
    try {
      setLoading(true);
      await fetchEmployees(1, 200);
    } catch (error) {
      console.error('Error loading all employees:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, user?.id, token, managerId, user?.role, reduxRole]);

  // Corrected handleStatusChange with proper create/update logic
  const handleStatusChange = useCallback(async (employeeId, newStatus, notes = '') => {
    if (!token) return;

    const employeeData = attendanceData.find(item => item.employee === employeeId);
    if (!employeeData) return;

    try {
      setUpdateInProgress(prev => new Set([...prev, employeeId]));
      
      if (employeeData.isExisting && employeeData.attendanceId) {
        console.log('Updating existing attendance record');
        const updateData = {
          status: newStatus,
          notes: notes || '',
          date: selectedDate,
          shift: employeeData.employeeData?.shift || null
        };

        const response = await apiConnector(
          'PUT',
          `${attendanceEndpoints.updateAttendance}${employeeData.attendanceId}`,
          updateData,
          { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        );

        if (response.data?.attendance) {
          setAttendanceData(prev =>
            prev.map(item =>
              item.employee === employeeId
                ? { ...item, status: newStatus, notes, isExisting: true }
                : item
            )
          );
          setLastUpdateTime(new Date());
          toast.success('Attendance updated successfully');
        }
      } else {
        console.log('Creating new attendance record');
        const createData = {
          employee: employeeId,
          company: employeeData.employeeData?.company || employeeData.company,
          date: selectedDate,
          status: newStatus,
          notes: notes || '',
          shift: employeeData.employeeData?.shift || null
        };

        const response = await apiConnector(
          'POST',
          attendanceEndpoints.createAttendance,
          createData,
          { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        );

        if (response.data) {
          setAttendanceData(prev =>
            prev.map(item =>
              item.employee === employeeId
                ? { ...item, status: newStatus, notes, isExisting: true, attendanceId: response.data._id }
                : item
            )
          );
          setLastUpdateTime(new Date());
          toast.success('Attendance created successfully');
        }
      }
    } catch (error) {
      console.error('Error handling attendance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save attendance';
      toast.error(errorMessage);
    } finally {
      setUpdateInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
    }
  }, [attendanceData, selectedDate, token]);

  const handleNotesChange = useCallback((employeeId, notes) => {
    setAttendanceData(prev =>
      prev.map(item =>
        item.employee === employeeId
          ? { ...item, notes }
          : item
      )
    );
  }, []);

  // Enhanced bulk status change with proper create/update logic
  const handleBulkStatusChange = useCallback(async () => {
    if (!bulkStatus || selectedEmployees.size === 0) {
      toast.error('Please select employees and status for bulk update');
      return;
    }

    try {
      setBulkUpdateInProgress(true);
      
      const selectedRecords = attendanceData.filter(item => 
        selectedEmployees.has(item.employee)
      );
      
      if (selectedRecords.length === 0) {
        toast.error('No valid employee records found for selected employees');
        return;
      }
      
      const recordsToCreate = selectedRecords.filter(record => !record.isExisting);
      const recordsToUpdate = selectedRecords.filter(record => record.isExisting && record.attendanceId);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Handle bulk creation
      if (recordsToCreate.length > 0) {
        try {
          const companyId = recordsToCreate[0]?.employeeData?.company || recordsToCreate[0]?.company;
          
          const bulkCreateData = {
            company: companyId,
            attendances: recordsToCreate.map(record => ({
              employee: record.employee,
              date: selectedDate,
              status: bulkStatus,
              notes: record.notes || '',
              shift: record.employeeData?.shift || null
            }))
          };

          const createResponse = await apiConnector(
            'POST',
            attendanceEndpoints.bulkAttendance,
            bulkCreateData,
            { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          );

          if (createResponse.data?.results) {
            const createResults = createResponse.data.results;
            const createSuccessCount = createResults.filter(result => result.success).length;
            successCount += createSuccessCount;
            failureCount += createResults.filter(result => !result.success).length;
            
            createResults.forEach(result => {
              if (result.success) {
                setAttendanceData(prev =>
                  prev.map(item =>
                    item.employee === result.employee
                      ? { ...item, status: bulkStatus, isExisting: true, attendanceId: result.attendanceId }
                      : item
                  )
                );
              }
            });
          } else {
            successCount += recordsToCreate.length;
            setAttendanceData(prev =>
              prev.map(item => {
                if (recordsToCreate.some(record => record.employee === item.employee)) {
                  return { ...item, status: bulkStatus, isExisting: true };
                }
                return item;
              })
            );
          }
        } catch (error) {
          console.error('Error in bulk create:', error);
          failureCount += recordsToCreate.length;
        }
      }
      
      // Handle bulk updates
      if (recordsToUpdate.length > 0) {
        try {
          const bulkUpdateData = {
            updates: recordsToUpdate.map(record => ({
              attendanceId: record.attendanceId,
              status: bulkStatus,
              notes: record.notes || '',
              date: selectedDate,
              shift: record.employeeData?.shift || null
            }))
          };

          const updateResponse = await apiConnector(
            'PUT',
            `${attendanceEndpoints.bulkUpdateAttendance}`,
            bulkUpdateData,
            { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          );

          if (updateResponse.data?.results) {
            const updateResults = updateResponse.data.results;
            const updateSuccessCount = updateResults.filter(result => result.success).length;
            successCount += updateSuccessCount;
            failureCount += updateResults.filter(result => !result.success).length;
            
            updateResults.forEach(result => {
              if (result.success) {
                setAttendanceData(prev =>
                  prev.map(item =>
                    item.attendanceId === result.attendanceId
                      ? { ...item, status: bulkStatus, isExisting: true }
                      : item
                  )
                );
              }
            });
          } else {
            successCount += recordsToUpdate.length;
            setAttendanceData(prev =>
              prev.map(item => {
                if (recordsToUpdate.some(record => record.employee === item.employee)) {
                  return { ...item, status: bulkStatus, isExisting: true };
                }
                return item;
              })
            );
          }
        } catch (error) {
          console.error('Error in bulk update:', error);
          failureCount += recordsToUpdate.length;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} employees to ${bulkStatus}`);
        setLastUpdateTime(new Date());
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to process ${failureCount} records`);
      }
      
      setSelectedEmployees(new Set());
      setBulkStatus('');
      setShowBulkActions(false);
      
    } catch (error) {
      console.error('Error in bulk status change:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update attendance records';
      toast.error(errorMessage);
    } finally {
      setBulkUpdateInProgress(false);
    }
  }, [bulkStatus, selectedEmployees, attendanceData, selectedDate, token]);

  const handleSelectEmployee = useCallback((employeeId, isChecked) => {
    const newSelected = new Set(selectedEmployees);
    if (isChecked) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
    setSelectedEmployees(newSelected);
  }, [selectedEmployees]);

  const handleSelectAll = useCallback((isChecked) => {
    if (isChecked) {
      const allEmployeeIds = filteredAttendanceData.map(item => item.employee);
      setSelectedEmployees(new Set(allEmployeeIds));
    } else {
      setSelectedEmployees(new Set());
    }
  }, [filteredAttendanceData]);

  // Modal handlers
  const handleViewAttendance = useCallback((attendance) => {
    setSelectedAttendanceForModal(attendance);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAttendanceForModal(null);
  }, []);

  const handleUpdateAttendanceFromModal = useCallback((employeeId, newStatus, notes, attendanceId = null) => {
    setAttendanceData(prev =>
      prev.map(item =>
        item.employee === employeeId
          ? { 
              ...item, 
              status: newStatus, 
              notes, 
              isExisting: true,
              attendanceId: attendanceId || item.attendanceId
            }
          : item
      )
    );
    setLastUpdateTime(new Date());
  }, []);

  const exportAttendanceData = useCallback(() => {
    try {
      if (filteredAttendanceData.length === 0) {
        toast.error('No data to export');
        return;
      }

      const csvContent = [
        ['Employee Name', 'Employee ID', 'Department', 'Date', 'Status', 'Notes'].join(','),
        ...filteredAttendanceData.map(item => [
          `"${`${item.employeeData?.user?.profile?.firstName || ''} ${item.employeeData?.user?.profile?.lastName || ''}`.trim()}"`,
          `"${item.employeeData?.employmentDetails?.employeeId || 'N/A'}"`,
          `"${item.employeeData?.employmentDetails?.department?.name || 'N/A'}"`,
          selectedDate,
          item.status,
          `"${item.notes || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance_${selectedDate}_${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Attendance data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  }, [filteredAttendanceData, selectedDate]);

  // Helper functions
  const getStatusIcon = useCallback((status) => {
    const statusOption = attendanceStatusOptions.find(opt => opt.value === status);
    const IconComponent = statusOption?.icon || FaCheck;
    return <IconComponent className="w-4 h-4" />;
  }, []);

  const getStatusColor = useCallback((status) => {
    const statusOption = attendanceStatusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  }, []);

  // Enhanced notes change handler with auto-save for existing records
  const handleNotesChangeWithAutoSave = useCallback(async (employeeId, notes) => {
    const employeeData = attendanceData.find(item => item.employee === employeeId);
    if (!employeeData) return;

    handleNotesChange(employeeId, notes);

    if (employeeData.isExisting && employeeData.attendanceId) {
      clearTimeout(window.notesTimeout);
      window.notesTimeout = setTimeout(async () => {
        try {
          const updateData = {
            status: employeeData.status,
            notes: notes || '',
            date: selectedDate,
            shift: employeeData.employeeData?.shift || null
          };

          await apiConnector(
            'PUT',
            `${attendanceEndpoints.updateAttendance}${employeeData.attendanceId}`,
            updateData,
            { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          );

          setLastUpdateTime(new Date());
        } catch (error) {
          console.error('Error auto-saving notes:', error);
        }
      }, 1000);
    }
  }, [attendanceData, handleNotesChange, selectedDate, token]);

  // Effects
  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'superadmin' || reduxRole === 'superadmin') && !selectedDepartment) {
      console.log('Admin/Superadmin user detected, loading departments...');
      fetchDepartments();
    } else if (selectedDepartment?._id || 
              (user?.role !== 'admin' && user?.role !== 'superadmin' && reduxRole !== 'superadmin')) {
      console.log('Loading employees for attendance management...');
      loadAllEmployees();
    }
  }, [user?.role, reduxRole, selectedDepartment, fetchDepartments, loadAllEmployees]);

  useEffect(() => {
    if (employees.length > 0 && selectedDate) {
      console.log('Employees loaded, fetching existing attendance...');
      fetchExistingAttendance(1, attendancePagination.limit);
    }
  }, [employees.length, selectedDate, fetchExistingAttendance, attendancePagination.limit]);

  useEffect(() => {
    setSelectedEmployees(new Set());
  }, [searchTerm, statusFilter, attendanceData]);

  useEffect(() => {
    return () => {
      if (window.notesTimeout) {
        clearTimeout(window.notesTimeout);
      }
    };
  }, []);

  // Role-based sidebar and header components
  const sidebar = (user?.role === 'admin' || reduxRole === 'superadmin') ? <AdminSidebar /> :
                  user?.role === 'sub-admin' ? <SubAdminSidebar /> :
                  user?.role === 'manager' ? <ManagerSidebar /> :
                  <HRSidebar />;

  const header = (user?.role === 'admin' || reduxRole === 'superadmin') ? <AdminHeader /> :
                 user?.role === 'sub-admin' ? <SubAdminHeader /> :
                 user?.role === 'manager' ? <ManagerHeader /> :
                 <HRHeader />;

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );

  // Employee Pagination Component
  const EmployeePaginationControls = () => {
    if (employeePagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg mb-4">
        <div className="flex items-center text-sm text-gray-700">
          <span className="font-medium">Employee Pages:</span>
          <span className="ml-2">
            Page {employeePagination.currentPage} of {employeePagination.totalPages} 
            ({employeePagination.totalEmployees} total employees)
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEmployeePageChange(employeePagination.currentPage - 1)}
            disabled={employeePagination.currentPage <= 1 || employeePagination.loading}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaChevronLeft className="w-3 h-3 mr-1" />
            Previous
          </button>
          
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
            {employeePagination.currentPage}
          </span>
          
          <button
            onClick={() => handleEmployeePageChange(employeePagination.currentPage + 1)}
            disabled={employeePagination.currentPage >= employeePagination.totalPages || employeePagination.loading}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FaChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  // Show department selection for admin users
  if ((user?.role === 'admin' || reduxRole === 'superadmin') && !selectedDepartment) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {sidebar}
        <div className="w-full lg:w-[79vw] lg:ml-[20vw]">
          {header}
          
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBuilding className="text-3xl text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
                  <p className="text-gray-600">Select a department to manage attendance for its employees</p>
                </div>
              </div>
            </div>

            <DepartmentSelection 
              departments={departments}
              onSelectDepartment={handleDepartmentSelect}
              loading={departmentsLoading}
              company={company}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebar}
      <div className="w-full lg:w-[79vw] lg:ml-[20vw]">
        {header}
        
        <div className="p-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 mb-4 lg:mb-0">
                <FaUsers className="text-3xl text-blue-600" />
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
                    {(user?.role === 'admin' || reduxRole === 'superadmin') && selectedDepartment && (
                      <button
                        onClick={handleBackToDepartments}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <FaArrowLeft className="w-3 h-3" />
                        Back to Departments
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {(user?.role === 'admin' || reduxRole === 'superadmin') && selectedDepartment
                      ? `Managing attendance for ${selectedDepartment.name} Department`
                      : 'Create and manage attendance for your team'
                    }
                  </p>
                  {lastUpdateTime && (
                    <p className="text-sm text-green-600">
                      Last updated: {lastUpdateTime.toLocaleTimeString()}
                    </p>
                  )}
                  {employeePagination.totalEmployees > 0 && (
                    <p className="text-sm text-blue-600">
                      Showing {employees.length} of {employeePagination.totalEmployees} employees
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={exportAttendanceData}
                  disabled={filteredAttendanceData.length === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <FaDownload /> Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Employee Pagination Controls */}
          <EmployeePaginationControls />

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {attendanceStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showBulkActions 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaFilter /> Bulk Actions
              </button>
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Selected: {selectedEmployees.size} employees
                  </span>
                  
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    {attendanceStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleBulkStatusChange}
                    disabled={!bulkStatus || selectedEmployees.size === 0 || bulkUpdateInProgress}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bulkUpdateInProgress ? <FaSpinner className="animate-spin" /> : null}
                    {bulkUpdateInProgress ? 'Processing...' : 'Apply to Selected'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                </div>
                <FaUsers className="text-3xl text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present || 0}</p>
                </div>
                <FaCheck className="text-3xl text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absent || 0}</p>
                </div>
                <FaTimes className="text-3xl text-red-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Half Day</p>
                  <p className="text-2xl font-bold text-orange-600">{attendanceStats.half_day || 0}</p>
                </div>
                <FaExclamationTriangle className="text-3xl text-orange-500" />
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {(user?.role === 'admin' || reduxRole === 'superadmin') && selectedDepartment && (
                  <span className="text-sm text-gray-600 ml-2">
                    - {selectedDepartment.name} Department
                  </span>
                )}
                </h2>
                <div className="text-sm text-gray-600 mt-2 lg:mt-0">
                  Smart save - New records created, existing records updated
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.size === filteredAttendanceData.length && filteredAttendanceData.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading || employeePagination.loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8">
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : filteredAttendanceData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FaUsers className="text-4xl text-gray-300 mb-2" />
                          <p className="text-lg font-medium">No employees found</p>
                          <p className="text-sm">
                            {employees.length === 0 
                              ? 'No employees available. Check if you have employees assigned to your department.'
                              : 'Try adjusting your search criteria'
                            }
                          </p>
                          {employeePagination.totalPages > 1 && (
                            <p className="text-sm text-blue-600 mt-2">
                              Try navigating to different employee pages above
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceData.map((attendance, index) => {
                      const isUpdating = updateInProgress.has(attendance.employee);
                      return (
                        <tr key={`${attendance.employee}-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(attendance.employee)}
                              onChange={(e) => handleSelectEmployee(attendance.employee, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-800">
                                    {(attendance.employeeData?.user?.profile?.firstName?.[0] || 'N')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {`${attendance.employeeData?.user?.profile?.firstName || ''} ${attendance.employeeData?.user?.profile?.lastName || ''}`.trim() || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {attendance.employeeData?.employmentDetails?.employeeId || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attendance.employeeData?.employmentDetails?.department?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <select
                                  value={attendance.status}
                                  onChange={(e) => handleStatusChange(attendance.employee, e.target.value, attendance.notes)}
                                  disabled={isUpdating}
                                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 pr-8"
                                >
                                  {attendanceStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                {isUpdating && (
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                    <FaSpinner className="animate-spin w-3 h-3 text-blue-600" />
                                  </div>
                                )}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
                                {getStatusIcon(attendance.status)}
                                <span className="ml-1">{attendance.status.replace('_', ' ').toUpperCase()}</span>
                              </span>
                              {attendance.isExisting && (
                                <span className="text-xs text-green-600 font-medium" title="Saved in database">✓</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={attendance.notes}
                              onChange={(e) => handleNotesChangeWithAutoSave(attendance.employee, e.target.value)}
                              placeholder="Add notes..."
                              disabled={isUpdating}
                              maxLength={200}
                              className="text-sm border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewAttendance(attendance)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="View details"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Modal */}
           <AttendanceModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            attendanceData={selectedAttendanceForModal}
            onUpdateAttendance={handleUpdateAttendanceFromModal}
            token={token}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceCreation;