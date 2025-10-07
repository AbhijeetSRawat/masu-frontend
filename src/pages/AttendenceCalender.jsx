import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiConnector } from '../services/apiConnector';
import { attendanceEndpoints, leavepolicyendpoints, leaveEndpoints } from '../services/api';
import { toast } from 'react-hot-toast';
import { setLoading } from '../slices/authSlice';
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";
import { 
  FaCalendarAlt, 
  FaCalendarCheck, 
  FaCalendarTimes, 
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaPlayCircle,
  FaStopCircle,
  FaSync
} from 'react-icons/fa';

const AttendanceCalendar = () => {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const employee = useSelector(state => state.employees.reduxEmployee);
  const company = useSelector(state => state.permissions.company);
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leavePolicy, setLeavePolicy] = useState(null);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [attendanceType, setAttendanceType] = useState('present');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    halfDay: 0,
    late: 0,
    leaves: 0,
    holidays: 0,
    weekOffs: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if date is weekend based on company week off policy
  const isWeekOff = (date) => {
    const dayOfWeek = date.getDay();
    return leavePolicy?.weekOff?.includes(dayOfWeek) || false;
  };

  // Get holiday for a specific date
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

  // Refresh all data after attendance marking
  const refreshAllData = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchAttendanceRecords(),
        fetchLeavePolicy(),
        fetchEmployeeLeaves()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // FIXED: Fetch attendance records using proper endpoint with query params
  const fetchAttendanceRecords = async () => {
    try {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const response = await apiConnector(
        'GET',
        `${attendanceEndpoints.getAttendances}?employeeId=${employee._id}&companyId=${company._id}&startDate=${startDate}&endDate=${endDate}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data) {
        // Handle both response formats
        const records = response.data.attendances || response.data;
        
        if (Array.isArray(records)) {
          setAttendanceRecords(records);
          
          // Check today's attendance
          const today = new Date();
          const todayStr = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
          
          const todayRecord = records.find(record => {
            const recordDate = new Date(record.date);
            const recordStr = recordDate.getFullYear() + '-' + 
                             String(recordDate.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(recordDate.getDate()).padStart(2, '0');
            return recordStr === todayStr;
          });
          
          setTodayAttendance(todayRecord);
          console.log('Today attendance found:', todayRecord);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    }
  };

  // Fetch leave policy
  const fetchLeavePolicy = async () => {
    try {
      const res = await apiConnector(
        'GET', 
        `${leavepolicyendpoints.getLeavePolicy}${company._id}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

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
    }
  };

  // Fetch employee leaves
  const fetchEmployeeLeaves = async () => {
    try {
      const response = await apiConnector(
        'GET', 
        `${leaveEndpoints.GET_EMPLOYEE_LEAVES}${employee.user._id}?year=${currentYear}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.success) {
        setEmployeeLeaves(response.data.leaves || []);
      }
    } catch (error) {
      console.error('Error fetching employee leaves:', error);
    }
  };

  // Calculate attendance statistics
  const calculateStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      halfDay: 0,
      late: 0,
      leaves: 0,
      holidays: leavePolicy?.holidays?.length || 0,
      weekOffs: 0
    };

    // Calculate weekends in the year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    let weekOffCount = 0;
    
    for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
      if (isWeekOff(d)) {
        weekOffCount++;
      }
    }
    stats.weekOffs = weekOffCount;

    // Count attendance records
    attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'half_day':
          stats.halfDay++;
          break;
        case 'late':
          stats.late++;
          break;
        default:
          break;
      }
    });

    stats.leaves = employeeLeaves.filter(leave => leave.status === 'approved').length;
    setAttendanceStats(stats);
  };

  // FIXED: Mark attendance using proper endpoint
  const handleMarkAttendance = async () => {
    try {
      dispatch(setLoading(true));
      
      // Check if trying to mark attendance for weekend or holiday
      if (isWeekOff(selectedDate)) {
        toast.error('Cannot mark attendance on weekend');
        return;
      }

      const holidayExists = getHolidayForDate(selectedDate);
      if (holidayExists) {
        toast.error('Cannot mark attendance on company holiday');
        return;
      }

      // Check if updating existing record
      const existingRecord = selectedDateDetails?.type === 'attendance' ? selectedDateDetails.data : null;
      
      if (existingRecord && existingRecord._id) {
        // Update existing attendance
        const response = await apiConnector(
          'PUT',
          attendanceEndpoints.updateAttendance.replace(':id', existingRecord._id),
          {
            status: attendanceType,
            notes: '',
            date: selectedDate,
            shift: employee?.employmentDetails?.shift || null
          },
          { Authorization: `Bearer ${token}` }
        );

        if (response.data) {
          toast.success(`Attendance updated to ${attendanceType.replace('_', ' ')} successfully!`);
          setShowMarkModal(false);
          
          // Update local state immediately
          setAttendanceRecords(prev => prev.map(record => 
            record._id === existingRecord._id 
              ? { ...record, status: attendanceType, updatedAt: new Date().toISOString() }
              : record
          ));

          // Update today's attendance if updating today
          const today = new Date();
          const isToday = selectedDate.getFullYear() === today.getFullYear() &&
                         selectedDate.getMonth() === today.getMonth() &&
                         selectedDate.getDate() === today.getDate();
          
          if (isToday) {
            setTodayAttendance(prev => ({ ...prev, status: attendanceType }));
          }

          // Refresh from server
          setTimeout(() => refreshAllData(), 500);
        }
      } else {
        // Create new attendance
        const response = await apiConnector(
          'POST',
          attendanceEndpoints.createAttendance,
          {
            employee: employee._id,
            company: company._id,
            date: selectedDate,
            status: attendanceType,
            notes: '',
            shift: employee?.employmentDetails?.shift || null
          },
          { Authorization: `Bearer ${token}` }
        );

        if (response.data) {
          toast.success(`Attendance marked as ${attendanceType.replace('_', ' ')} successfully!`);
          setShowMarkModal(false);
          
          // Immediate local update
          const newAttendanceRecord = response.data;
          setAttendanceRecords(prev => [...prev, newAttendanceRecord]);

          // Update today's attendance if marking today
          const today = new Date();
          const isToday = selectedDate.getFullYear() === today.getFullYear() &&
                         selectedDate.getMonth() === today.getMonth() &&
                         selectedDate.getDate() === today.getDate();
          
          if (isToday) {
            setTodayAttendance(newAttendanceRecord);
          }

          // Refresh from server
          setTimeout(() => refreshAllData(), 500);
        }
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // FIXED: Quick mark today's attendance
  const handleQuickMarkToday = async (status) => {
    try {
      const today = new Date();
      
      if (isWeekOff(today)) {
        toast.error('Cannot mark attendance on weekend');
        return;
      }

      const holidayExists = getHolidayForDate(today);
      if (holidayExists) {
        toast.error('Cannot mark attendance on company holiday');
        return;
      }

      dispatch(setLoading(true));

      // Check if today's attendance already exists
      if (todayAttendance && todayAttendance._id) {
        // Update existing
        const response = await apiConnector(
          'PUT',
          attendanceEndpoints.updateAttendance.replace(':id', todayAttendance._id),
          {
            status: status,
            notes: '',
            date: today,
            shift: employee?.employmentDetails?.shift || null
          },
          { Authorization: `Bearer ${token}` }
        );

        if (response.data) {
          toast.success(`Updated to ${status.replace('_', ' ')} for today!`);
          
          // Update local state
          setTodayAttendance(prev => ({ ...prev, status: status }));
          setAttendanceRecords(prev => prev.map(record => 
            record._id === todayAttendance._id 
              ? { ...record, status: status }
              : record
          ));

          setTimeout(() => refreshAllData(), 500);
        }
      } else {
        // Create new
        const response = await apiConnector(
          'POST',
          attendanceEndpoints.createAttendance,
          {
            employee: employee._id,
            company: company._id,
            date: today,
            status: status,
            notes: '',
            shift: employee?.employmentDetails?.shift || null
          },
          { Authorization: `Bearer ${token}` }
        );

        if (response.data) {
          toast.success(`Marked as ${status.replace('_', ' ')} for today!`);
          
          const newAttendanceRecord = response.data;
          setTodayAttendance(newAttendanceRecord);
          setAttendanceRecords(prev => [...prev, newAttendanceRecord]);

          setTimeout(() => refreshAllData(), 500);
        }
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Get status for a specific date
  const getDateStatus = (date) => {
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
    
    // Check if it's a weekend
    if (isWeekOff(date)) {
      return { type: 'weekend', data: null };
    }
    
    // Check company holidays
    const holiday = getHolidayForDate(date);
    if (holiday) return { type: 'holiday', data: holiday };
    
    // Check employee leaves
    const leave = employeeLeaves.find(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const startStr = startDate.getFullYear() + '-' + 
                      String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(startDate.getDate()).padStart(2, '0');
      const endStr = endDate.getFullYear() + '-' + 
                    String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(endDate.getDate()).padStart(2, '0');
      return dateStr >= startStr && dateStr <= endStr && leave.status === 'approved';
    });
    if (leave) return { type: 'leave', data: leave };
    
    // Check attendance
    const attendance = attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      const recordStr = recordDate.getFullYear() + '-' + 
                       String(recordDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(recordDate.getDate()).padStart(2, '0');
      return recordStr === dateStr;
    });
    if (attendance) return { type: 'attendance', data: attendance };
    
    return { type: 'none', data: null };
  };

  // Handle date click
  const handleDateClick = (date) => {
    const status = getDateStatus(date);
    setSelectedDate(date);
    setSelectedDateDetails(status);
    
    // Don't allow marking attendance for future dates, weekends, or holidays
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date > today) {
      toast.error('Cannot mark attendance for future dates');
      return;
    }
    
    if (isWeekOff(date)) {
      toast.info('This is a weekend day');
      return;
    }
    
    const holidayExists = getHolidayForDate(date);
    if (holidayExists) {
      toast.info(`This is a company holiday: ${holidayExists.name}`);
      return;
    }
    
    // Set default attendance type based on existing record
    if (status.type === 'attendance') {
      setAttendanceType(status.data.status);
    } else {
      setAttendanceType('present');
    }
    
    setShowMarkModal(true);
  };

  // Generate calendar for a month
  const generateMonthCalendar = (monthIndex) => {
    const firstDay = new Date(currentYear, monthIndex, 1);
    const lastDay = new Date(currentYear, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, monthIndex, day);
      const holiday = getHolidayForDate(currentDate);
      const isWeekOffDay = isWeekOff(currentDate);
      
      const today = new Date();
      const isToday = currentDate.getFullYear() === today.getFullYear() &&
                     currentDate.getMonth() === today.getMonth() &&
                     currentDate.getDate() === today.getDate();
      
      calendarDays.push({
        day,
        date: currentDate,
        holiday,
        isWeekOff: isWeekOffDay,
        isToday
      });
    }
    
    return calendarDays;
  };

  useEffect(() => {
    if (employee?._id && company?._id) {
      refreshAllData();
    }
  }, [currentYear, employee?._id, company?._id]);

  useEffect(() => {
    calculateStats();
  }, [attendanceRecords, employeeLeaves, leavePolicy, currentYear]);

  const today = new Date();
  const canMarkToday = !isWeekOff(today) && !getHolidayForDate(today);

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
        <EmployeeHeader />
        
        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-600" />
                  My Attendance Calendar {currentYear}
                </h1>
                <p className="text-gray-600 mt-1">Mark your attendance and view your records</p>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={refreshAllData}
                  disabled={isRefreshing}
                  className={`p-2 rounded-full transition-colors ${
                    isRefreshing 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Refresh Data"
                >
                  <FaSync className={isRefreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setCurrentYear(prev => prev - 1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaChevronLeft className="text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-800 px-4">
                  {currentYear}
                </span>
                <button
                  onClick={() => setCurrentYear(prev => prev + 1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaChevronRight className="text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Quick Mark Today's Attendance */}
            {canMarkToday && !todayAttendance && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <FaCalendarCheck className="text-blue-600" />
                  Mark Today's Attendance ({today.toLocaleDateString()})
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleQuickMarkToday('present')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FaPlayCircle />
                    Present
                  </button>
                  <button
                    onClick={() => handleQuickMarkToday('late')}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <FaClock />
                    Late
                  </button>
                  <button
                    onClick={() => handleQuickMarkToday('half_day')}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <FaClock />
                    Half Day
                  </button>
                  <button
                    onClick={() => handleQuickMarkToday('absent')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaStopCircle />
                    Absent
                  </button>
                </div>
              </div>
            )}

            {/* Today's Status */}
            {todayAttendance && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                  <FaCalendarCheck className="text-green-600" />
                  Today's Attendance ({today.toLocaleDateString()}): 
                  <span className="capitalize ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {todayAttendance.status.replace('_', ' ')}
                  </span>
                </h3>
                <p className="text-green-600 text-sm mt-2">
                  Marked at: {new Date(todayAttendance.createdAt).toLocaleTimeString()}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDate(today);
                      setSelectedDateDetails({ type: 'attendance', data: todayAttendance });
                      setAttendanceType(todayAttendance.status);
                      setShowMarkModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Update Attendance
                  </button>
                </div>
              </div>
            )}
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Present</p>
                    <p className="text-2xl font-bold text-green-800">{attendanceStats.present}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <FaCalendarTimes className="text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Absent</p>
                    <p className="text-2xl font-bold text-red-800">{attendanceStats.absent}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <FaClock className="text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Half Day</p>
                    <p className="text-2xl font-bold text-orange-800">{attendanceStats.halfDay}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <FaClock className="text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Late</p>
                    <p className="text-2xl font-bold text-purple-800">{attendanceStats.late}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Leaves</p>
                    <p className="text-2xl font-bold text-yellow-800">{attendanceStats.leaves}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Holidays</p>
                    <p className="text-2xl font-bold text-red-800">{attendanceStats.holidays}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Weekends</p>
                    <p className="text-2xl font-bold text-gray-800">{attendanceStats.weekOffs}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Calendar Section */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-800 mb-4 text-center text-xl">
              Company Calendar {currentYear}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {months.map((month, monthIndex) => {
                const calendarDays = generateMonthCalendar(monthIndex);
                
                return (
                  <div key={monthIndex} className="bg-white rounded-lg border p-3">
                    <div className="text-center mb-3">
                      <h5 className="font-semibold text-gray-800 text-lg">{month}</h5>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {daysOfWeek.map(day => (
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
                        
                        const { day, date, holiday, isWeekOff, isToday } = dayData;
                        const attendanceStatus = getDateStatus(date);
                        
                        let dayClasses = "h-8 flex items-center justify-center text-xs rounded relative cursor-pointer ";
                        
                        if (attendanceStatus.type === 'attendance') {
                          switch (attendanceStatus.data.status) {
                            case 'present':
                              dayClasses += "bg-green-100 text-green-800 font-semibold ";
                              break;
                            case 'absent':
                              dayClasses += "bg-red-200 text-red-900 font-semibold ";
                              break;
                            case 'half_day':
                              dayClasses += "bg-orange-100 text-orange-800 font-semibold ";
                              break;
                            case 'late':
                              dayClasses += "bg-purple-100 text-purple-800 font-semibold ";
                              break;
                            default:
                              dayClasses += "text-gray-800 hover:bg-gray-50 ";
                          }
                          
                          if (isToday) {
                            dayClasses += "ring-2 ring-blue-500 ";
                          }
                          
                        } else if (attendanceStatus.type === 'leave') {
                          dayClasses += "bg-yellow-100 text-yellow-800 font-semibold ";
                          if (isToday) {
                            dayClasses += "ring-2 ring-blue-500 ";
                          }
                          
                        } else if (isToday) {
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
                            onClick={() => handleDateClick(date)}
                            title={
                              attendanceStatus.type === 'attendance'
                                ? `Attendance: ${attendanceStatus.data.status.replace('_', ' ')}${isToday ? ' (Today)' : ''} - Click to update`
                                : attendanceStatus.type === 'leave'
                                  ? `On Leave${isToday ? ' (Today)' : ''}`
                                  : holiday 
                                    ? `${holiday.name}: ${holiday.description}` 
                                    : isWeekOff 
                                      ? 'Week Off' 
                                      : isToday
                                        ? 'Today - Click to mark attendance'
                                        : 'Click to mark attendance'
                            }
                          >
                            <span>{day}</span>
                            {holiday && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                            {attendanceStatus.type === 'attendance' && (
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded relative">
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 border border-red-300 rounded relative">
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded relative">
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span>Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded relative">
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span>Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>On Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Today (No Attendance)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-blue-500 rounded"></div>
                <span>Today + Attendance</span>
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

        {/* Mark Attendance Modal */}
        {showMarkModal && (
          <div className="fixed inset-0 backdrop-blur-3xl bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaCalendarCheck className="text-blue-600" />
                {selectedDateDetails?.type === 'attendance' ? 'Update' : 'Mark'} Attendance - {selectedDate?.toLocaleDateString()}
              </h3>
              
              {selectedDateDetails?.type !== 'none' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Current Status: 
                    <span className="font-medium ml-1 capitalize">
                      {selectedDateDetails.type === 'attendance' && selectedDateDetails.data.status.replace('_', ' ')}
                      {selectedDateDetails.type === 'leave' && 'On Leave'}
                      {selectedDateDetails.type === 'holiday' && 'Company Holiday'}
                      {selectedDateDetails.type === 'weekend' && 'Weekend'}
                    </span>
                  </p>
                  {selectedDateDetails.type === 'attendance' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Marked at: {new Date(selectedDateDetails.data.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Attendance Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'present', label: 'Present', icon: FaPlayCircle, color: 'green' },
                    { value: 'absent', label: 'Absent', icon: FaStopCircle, color: 'red' },
                    { value: 'half_day', label: 'Half Day', icon: FaClock, color: 'orange' },
                    { value: 'late', label: 'Late', icon: FaClock, color: 'purple' }
                  ].map(type => {
                    const Icon = type.icon;
                    const isSelected = attendanceType === type.value;
                    return (
                      <label 
                        key={type.value} 
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? `border-${type.color}-500 bg-${type.color}-50` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="attendanceType"
                          value={type.value}
                          checked={isSelected}
                          onChange={(e) => setAttendanceType(e.target.value)}
                          className="sr-only"
                        />
                        <Icon className={`${isSelected ? `text-${type.color}-600` : 'text-gray-400'}`} />
                        <span className={`font-medium ${isSelected ? `text-${type.color}-800` : 'text-gray-600'}`}>
                          {type.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleMarkAttendance}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaCalendarCheck />
                  {selectedDateDetails?.type === 'attendance' ? 'Update' : 'Mark'} Attendance
                </button>
                <button
                  onClick={() => setShowMarkModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCalendar;
