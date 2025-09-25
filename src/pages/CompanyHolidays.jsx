import React, { useEffect, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { useSelector, useDispatch } from 'react-redux'
import { setLoading } from '../slices/companyPermission';
import { apiConnector } from '../services/apiConnector';
import { leavepolicyendpoints } from '../services/api';
import toast from 'react-hot-toast';
import AdminHeader from '../components/AdminHeader';
import SubAdminSidebar from '../components/SubAdminSidebar';
import SubAdminHeader from '../components/SubAdminHeader';

const {createLeavePolicy, updateLeavePolicy, addLeaveType, updateLeaveType, toggleLeaveTypeStatus, getLeavePolicy} = leavepolicyendpoints;

const CompanyHolidays = () => {
    const dispatch = useDispatch();
    const company = useSelector((state) => state.permissions.company);
    const loading = useSelector((state) => state.permissions.loading);
      const token = useSelector(state => state.auth.token)

      const role = useSelector( state => state.auth.role)
      const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

    const [policyExists, setPolicyExists] = useState(false);
    const [policyId, setPolicyId] = useState(null);
    
    // Basic Policy Data
    const [policyData, setPolicyData] = useState({
        yearStartMonth: 1,
        weekOff: [0, 6],
        holidays: []
    });

    // Leave Types Data
    const [leaveTypes, setLeaveTypes] = useState([]);
    
    const [currentLeaveType, setCurrentLeaveType] = useState({
        name: '',
        shortCode: '',
        maxPerRequest: 30,
        minPerRequest: 1,
        requiresApproval: true,
        requiresDocs: false,
        carryForward: false,
        encashment:false,
        lapse:false,
        documentTypes: [],
        unpaid: false,
        isActive: true,
        applicableFor: 'all',
        maxInstancesPerYear: null,
        coolingPeriod: 0
    });

    // Holiday Management
    const [currentHoliday, setCurrentHoliday] = useState({
        date: '',
        name: '',
        recurring: false,
        description: ''
    });

    const [editingIndex, setEditingIndex] = useState(-1);
    const [editingHolidayIndex, setEditingHolidayIndex] = useState(-1);
    const [expandedLeaveType, setExpandedLeaveType] = useState(-1);
    const [showLeaveTypeForm, setShowLeaveTypeForm] = useState(false);
    const [showHolidayForm, setShowHolidayForm] = useState(false);
    const [activeTab, setActiveTab] = useState('policy');

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const weekDays = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const applicableForOptions = [
        { value: 'all', label: 'All Employees' },
        { value: 'male', label: 'Male Employees' },
        { value: 'female', label: 'Female Employees' },
        { value: 'others', label: 'Other Employees' }
    ];

    // Fetch existing policy
    const fetchLeavePolicy = async () => {
        try {
            dispatch(setLoading(true));
            const response = await apiConnector('GET', getLeavePolicy + company._id,null,{
                Authorization : `Bearer ${token}`,
            });

            console.log(response)
            
            if (response.data.success && response.data.policy) {
                const policy = response.data.policy;
                setPolicyExists(true);
                setPolicyId(policy._id);
                setPolicyData({
                    yearStartMonth: policy.yearStartMonth || 1,
                    weekOff: policy.weekOff || [0, 6],
                    holidays: policy.holidays || []
                });
                setLeaveTypes(policy.leaveTypes || []);
            } else {
                setPolicyExists(false);
            }
        } catch (error) {
            console.log("Error happened while getting the policy.", error);
            setPolicyExists(false);
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Create Leave Policy
  

    // Update Leave Policy
    

    

    const handleHolidayChange = (field, value) => {
        setCurrentHoliday(prev => ({
            ...prev,
            [field]: value
        }));
    };

   

    // Holiday Management Functions
    const handleSaveHoliday = async () => {
        if (!currentHoliday.name || !currentHoliday.date) {
            toast.error('Please fill in holiday name and date');
            return;
        }

        try {
            dispatch(setLoading(true));
            const payload = {
                ...policyData,
                holidays: editingHolidayIndex >= 0 
                    ? policyData.holidays.map((h, i) => i === editingHolidayIndex ? currentHoliday : h)
                    : [...policyData.holidays, currentHoliday]
            };

            const response = await apiConnector('PUT', `${updateLeavePolicy}${policyId}`, payload,{
                Authorization : `Bearer ${token}`,
            });
            
            if (response.data.success) {
                toast.success(editingHolidayIndex >= 0 ? 'Holiday updated successfully' : 'Holiday added successfully');
                setPolicyData(payload);
                resetHolidayForm();
                setShowHolidayForm(false);
            }
        } catch (error) {
            console.error('Error saving holiday:', error);
            toast.error(error.response?.data?.message || 'Error saving holiday');
        } finally {
            dispatch(setLoading(false));
        }
    };

    const editHoliday = (index) => {
        const holiday = policyData.holidays[index];
        setCurrentHoliday({ ...holiday });
        setEditingHolidayIndex(index);
        setShowHolidayForm(true);
    };

    const removeHoliday = (index) => {
        const updatedHolidays = policyData.holidays.filter((_, i) => i !== index);
        setPolicyData(prev => ({
            ...prev,
            holidays: updatedHolidays
        }));
        toast.success('Holiday removed. Don\'t forget to update the policy.');
    };


    const resetHolidayForm = () => {
        setCurrentHoliday({
            date: '',
            name: '',
            recurring: false,
            description: ''
        });
        setEditingHolidayIndex(-1);
    };

    



   

    useEffect(() => {
        if (company?._id) {
            fetchLeavePolicy();
        }
    }, [company]);

    if (loading) {
        return (
            <div className="flex">
                <AdminSidebar />
                <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
                    <AdminHeader/>
                    <div className="flex w-full h-[92vh] justify-center items-center">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
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


                <div className='w-full px-6 py-4'>
                    <div className='w-full flex justify-center mt-4 mb-6 text-3xl font-semibold'>
                        Company Holidays
                    </div>


                   

                    {/* Holidays Tab */}
                    
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white shadow-lg rounded-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Holiday Management
                                    </h2>
                                    {
                                       policyExists 
                                       &&
                                        <button
                                        onClick={() => {
                                            setShowHolidayForm(!showHolidayForm);
                                            if (showHolidayForm) {
                                                resetHolidayForm();
                                            }
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        {showHolidayForm ? 'Cancel' : 'Add New Holiday'}
                                    </button>
                                    }
                                </div>

                                {/* Existing Holidays */}
                                {policyData.holidays.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">
                                            Configured Holidays ({policyData.holidays.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {policyData.holidays.map((holiday, index) => (
                                                <div key={index} className="bg-gray-50 rounded-lg border p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <h4 className="font-semibold text-lg">{holiday.name}</h4>
                                                                <span className="text-blue-600 font-medium">
                                                                    {new Date(holiday.date).toLocaleDateString()}
                                                                </span>
                                                                {holiday.recurring && (
                                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                                        Recurring
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {holiday.description && (
                                                                <p className="text-gray-600 text-sm">{holiday.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => editHoliday(index)}
                                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => removeHoliday(index)}
                                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add/Edit Holiday Form */}
                                {showHolidayForm && (
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                                            {editingHolidayIndex >= 0 ? 'Edit Holiday' : 'Add New Holiday'}
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label>
                                                <input
                                                    type="text"
                                                    value={currentHoliday.name}
                                                    onChange={(e) => handleHolidayChange('name', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., Diwali"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                                <input
                                                    type="date"
                                                    value={currentHoliday.date}
                                                    onChange={(e) => handleHolidayChange('date', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={currentHoliday.description}
                                                onChange={(e) => handleHolidayChange('description', e.target.value)}
                                                rows={3}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Optional description"
                                            />
                                        </div>

                                        <div className="mb-6">
                                            <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                <input
                                                    type="checkbox"
                                                    checked={currentHoliday.recurring}
                                                    onChange={(e) => handleHolidayChange('recurring', e.target.checked)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Recurring Holiday (Annual)</span>
                                            </label>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSaveHoliday}
                                                className={`px-6 py-2 text-white rounded-md transition-colors ${
                                                    editingHolidayIndex >= 0 
                                                        ? 'bg-orange-600 hover:bg-orange-700' 
                                                        : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                            >
                                                {editingHolidayIndex >= 0 ? 'Update Holiday' : 'Add Holiday'}
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetHolidayForm();
                                                    setShowHolidayForm(false);
                                                }}
                                                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        
                                    </div>
                                )}

                                {/* No Holidays Message */}
                                {policyData.holidays.length === 0 && policyExists && (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <div className="text-gray-500 text-lg mb-2">No holidays configured</div>
                                        <p className="text-gray-400 text-sm mb-4">Add your first holiday to get started</p>
                                        <button
                                            onClick={() => setShowHolidayForm(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Add First Holiday
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    

                    {/* Policy Not Created Message for Leave Types and Holidays tabs */}
                    {!policyExists && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                <div className="text-yellow-800 text-lg font-medium mb-2">
                                    Leave Policy Not Created
                                </div>
                                <p className="text-yellow-700 mb-4">
                                    Please create a leave policy first before managing {activeTab === 'leaves' ? 'leave types' : 'holidays'}.
                                </p>
                                <div className="text-sm text-yellow-600">
                                    Go to the "Basic Policy" tab to set up your company's leave policy settings.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CompanyHolidays