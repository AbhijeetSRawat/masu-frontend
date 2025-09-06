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

const LeavePolicy = () => {
    const dispatch = useDispatch();
    const company = useSelector((state) => state.permissions.company);
    const loading = useSelector((state) => state.permissions.loading);

      const role = useSelector( state => state.auth.role)
      const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

    const [policyExists, setPolicyExists] = useState(false);
    const [policyId, setPolicyId] = useState(null);
    
    // Basic Policy Data - Fixed to match schema
    const [policyData, setPolicyData] = useState({
        yearStartMonth: 1,
        weekOff: [0, 6],
        includeWeekOff: false,
        sandwichLeave: false,
        holidays: []
    });

    // Leave Types Data
    const [leaveTypes, setLeaveTypes] = useState([]);
    
    // Fixed initial state to match schema exactly
    const [currentLeaveType, setCurrentLeaveType] = useState({
        name: '',
        shortCode: '',
        maxPerRequest: 30,
        minPerRequest: 1,
        requiresApproval: true,
        requiresDocs: false,
        docsRequiredAfterDays: null,
        documentTypes: [],
        unpaid: false,
        isActive: true,
        applicableFor: 'all',
        maxInstancesPerYear: null,
        maxInstancesPerMonth: null,
        coolingPeriod: 0,
        carryForward: false,
        encashment: false,
        lapse: false
        // Removed fields not in schema: excludeHolidays, sandwichLeave (these are policy-level, not leave-type-level)
    });

    const [editingIndex, setEditingIndex] = useState(-1);
    const [expandedLeaveType, setExpandedLeaveType] = useState(-1);
    const [showLeaveTypeForm, setShowLeaveTypeForm] = useState(false);
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
            const response = await apiConnector('GET', getLeavePolicy + company._id);

            console.log(response)
            
            if (response.data.success && response.data.policy) {
                const policy = response.data.policy;
                setPolicyExists(true);
                setPolicyId(policy._id);
                setPolicyData({
                    yearStartMonth: policy.yearStartMonth || 1,
                    weekOff: policy.weekOff || [0, 6],
                    includeWeekOff: policy.includeWeekOff || false,
                    sandwichLeave: policy.sandwichLeave || false,
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

    // Create Leave Policy - Fixed payload structure
    const handleCreatePolicy = async (e) => {
        e.preventDefault();
        try {
            dispatch(setLoading(true));
            const response = await apiConnector('POST', createLeavePolicy, {
                company: company._id,
                ...policyData,
                leaveTypes: [] // Start with empty leave types
            });
            
            if (response.data.success) {
                toast.success('Leave policy created successfully');
                setPolicyExists(true);
                setPolicyId(response.data.policy._id);
            }
        } catch (error) {
            console.error('Error creating policy:', error);
            toast.error(error.response?.data?.message || 'Error creating leave policy');
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Update Leave Policy - Fixed to use correct endpoint structure
    const handleUpdatePolicy = async (e) => {
        e.preventDefault();
        try {
            dispatch(setLoading(true));
            // Remove company from update data as it's not allowed to be updated
            const { company: _, ...updateData } = policyData;
            const response = await apiConnector('PUT', `${updateLeavePolicy}${policyId}`, updateData);
            
            if (response.data.success) {
                toast.success('Leave policy updated successfully');
            }
        } catch (error) {
            console.error('Error updating policy:', error);
            toast.error(error.response?.data?.message || 'Error updating leave policy');
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleWeekOffChange = (dayValue) => {
        setPolicyData(prev => ({
            ...prev,
            weekOff: prev.weekOff.includes(dayValue) 
                ? prev.weekOff.filter(day => day !== dayValue)
                : [...prev.weekOff, dayValue]
        }));
    };

    const handleLeaveTypeChange = (field, value) => {
        setCurrentLeaveType(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Fixed Add or Update Leave Type
    const handleSaveLeaveType = async () => {
        if (!currentLeaveType.name || !currentLeaveType.shortCode) {
            toast.error('Please fill in name and short code');
            return;
        }

        if (!policyExists) {
            toast.error('Please create leave policy first');
            return;
        }

        try {
            dispatch(setLoading(true));
            
            if (editingIndex >= 0) {
                // Update existing leave type
                const leaveTypeId = leaveTypes[editingIndex]._id;
                const response = await apiConnector('PUT', `${updateLeaveType}${policyId}/type/${leaveTypeId}`, currentLeaveType);
                
                if (response.data.success) {
                    toast.success('Leave type updated successfully');
                    await fetchLeavePolicy(); // Refetch to get updated data
                }
            } else {
                // Add new leave type - Fixed endpoint URL
                const response = await apiConnector('POST', `${addLeaveType}${policyId}/type`, currentLeaveType);
                
                if (response.data.success) {
                    toast.success('Leave type added successfully');
                    await fetchLeavePolicy(); // Refetch to get updated data
                }
            }
            
            resetLeaveTypeForm();
            setShowLeaveTypeForm(false);
        } catch (error) {
            console.error('Error saving leave type:', error);
            toast.error(error.response?.data?.message || 'Error saving leave type');
        } finally {
            dispatch(setLoading(false));
        }
    };

    // Fixed Toggle Leave Type Status
    const handleToggleLeaveTypeStatus = async (index) => {
        try {
            dispatch(setLoading(true));
            const leaveTypeId = leaveTypes[index]._id;
            const response = await apiConnector('PATCH', `${toggleLeaveTypeStatus}${policyId}/leave-types/${leaveTypeId}/toggle`);
            
            if (response.data.success) {
                toast.success(response.data.message);
                await fetchLeavePolicy(); // Refetch to get updated data
            }
        } catch (error) {
            console.error('Error toggling leave type status:', error);
            toast.error(error.response?.data?.message || 'Error toggling leave type status');
        } finally {
            dispatch(setLoading(false));
        }
    };

    const resetLeaveTypeForm = () => {
        setCurrentLeaveType({
            name: '',
            shortCode: '',
            maxPerRequest: 30,
            minPerRequest: 1,
            requiresApproval: true,
            requiresDocs: false,
            docsRequiredAfterDays: null,
            documentTypes: [],
            unpaid: false,
            isActive: true,
            applicableFor: 'all',
            maxInstancesPerYear: null,
            maxInstancesPerMonth: null,
            coolingPeriod: 0,
            carryForward: false,
            encashment: false,
            lapse: false
        });
        setEditingIndex(-1);
    };

    const editLeaveType = (index) => {
        const leaveType = leaveTypes[index];
        setCurrentLeaveType({ ...leaveType });
        setEditingIndex(index);
        setShowLeaveTypeForm(true);
        setTimeout(() => {
            document.getElementById('leave-type-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const toggleLeaveTypeDetails = (index) => {
        setExpandedLeaveType(expandedLeaveType === index ? -1 : index);
    };

    const handleDocumentTypeChange = (e) => {
        const value = e.target.value;
        if (value && !currentLeaveType.documentTypes.includes(value)) {
            setCurrentLeaveType(prev => ({
                ...prev,
                documentTypes: [...prev.documentTypes, value]
            }));
        }
    };

    const removeDocumentType = (indexToRemove) => {
        setCurrentLeaveType(prev => ({
            ...prev,
            documentTypes: prev.documentTypes.filter((_, index) => index !== indexToRemove)
        }));
    };

    useEffect(() => {
        if (company?._id) {
            fetchLeavePolicy();
        }
    }, [company]);

    if (loading) {
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
                        Leave Policy Configuration
                    </div>

                    {/* Tabs */}
                    <div className="max-w-4xl mx-auto mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8">
                                {[
                                    { key: 'policy', label: 'Basic Policy' },
                                    { key: 'leaves', label: 'Leave Types' }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === tab.key
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Basic Policy Tab */}
                    {activeTab === 'policy' && (
                        <div className="max-w-4xl mx-auto mb-8">
                            <div className="bg-white shadow-lg rounded-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        {policyExists ? 'Update Leave Policy Settings' : 'Create Leave Policy'}
                                    </h2>
                                    {policyExists && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                            Policy Active
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={policyExists ? handleUpdatePolicy : handleCreatePolicy}>
                                    {/* Year Start Month */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Financial Year Start Month
                                        </label>
                                        <select 
                                            value={policyData.yearStartMonth}
                                            onChange={(e) => setPolicyData(prev => ({...prev, yearStartMonth: parseInt(e.target.value)}))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {months.map(month => (
                                                <option key={month.value} value={month.value}>
                                                    {month.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Include Week Off Toggle */}
                                    <div className="mb-4">
                                        <label className="flex items-center bg-gray-50 px-3 py-2 rounded-md">
                                            <input
                                                type="checkbox"
                                                checked={policyData.includeWeekOff}
                                                onChange={(e) => setPolicyData(prev => ({...prev, includeWeekOff: e.target.checked}))}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium">Include Week Off Days in Leave Calculation</span>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            When enabled, weekends will be counted as leave days
                                        </p>
                                    </div>

                                    {/* Sandwich Leave Toggle - Fixed to match schema */}
                                    <div className="mb-4">
                                        <label className="flex items-center bg-gray-50 px-3 py-2 rounded-md">
                                            <input
                                                type="checkbox"
                                                checked={policyData.sandwichLeave}
                                                onChange={(e) => setPolicyData(prev => ({...prev, sandwichLeave: e.target.checked}))}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium">Enable Sandwich Leave</span>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            When enabled, holidays between leave days will be included in leave calculation
                                        </p>
                                    </div>

                                    {/* Week Off Days */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Week Off Days
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {weekDays.map(day => (
                                                <label key={day.value} className="flex items-center bg-gray-50 px-3 py-2 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={policyData.weekOff.includes(day.value)}
                                                        onChange={() => handleWeekOffChange(day.value)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">{day.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`px-6 py-2 text-white rounded-md transition-colors ${
                                            policyExists 
                                                ? 'bg-orange-600 hover:bg-orange-700' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {policyExists ? 'Update Policy Settings' : 'Create Leave Policy'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Leave Types Tab */}
                    {activeTab === 'leaves' && policyExists && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white shadow-lg rounded-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Leave Types Management
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowLeaveTypeForm(!showLeaveTypeForm);
                                            if (showLeaveTypeForm) {
                                                resetLeaveTypeForm();
                                            }
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        {showLeaveTypeForm ? 'Cancel' : 'Add New Leave Type'}
                                    </button>
                                </div>

                                {/* Existing Leave Types */}
                                {leaveTypes.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3">
                                            Current Leave Types ({leaveTypes.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {leaveTypes.map((leave, index) => (
                                                <div key={leave._id || index} className={`bg-gray-50 rounded-lg border ${editingIndex === index ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                                                    {/* Header */}
                                                    <div className="p-4 cursor-pointer" onClick={() => toggleLeaveTypeDetails(index)}>
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="flex items-center">
                                                                    <span className="font-semibold text-lg">{leave.name}</span>
                                                                    <span className="text-blue-600 font-medium ml-2">({leave.shortCode})</span>
                                                                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                                                                        leave.isActive 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {leave.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                    {editingIndex === index && (
                                                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                            Editing
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-gray-600">
                                                                    <span className="font-medium">Max: {leave.maxPerRequest} days/request</span>
                                                                    {leave.unpaid && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Unpaid</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => {e.stopPropagation(); editLeaveType(index);}}
                                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => {e.stopPropagation(); handleToggleLeaveTypeStatus(index);}}
                                                                    className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                                                                        leave.isActive 
                                                                            ? 'bg-red-600 hover:bg-red-700' 
                                                                            : 'bg-green-600 hover:bg-green-700'
                                                                    }`}
                                                                >
                                                                    {leave.isActive ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                                <span className="text-gray-400 text-sm">
                                                                    {expandedLeaveType === index ? '▲' : '▼'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {expandedLeaveType === index && (
                                                        <div className="px-4 pb-4 border-t border-gray-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                                                {/* Basic Info */}
                                                                <div className="bg-white p-3 rounded border">
                                                                    <h5 className="font-medium text-gray-700 mb-2">Basic Information</h5>
                                                                    <div className="space-y-1 text-sm text-gray-600">
                                                                        <p><span className="font-medium">Name:</span> {leave.name}</p>
                                                                        <p><span className="font-medium">Code:</span> {leave.shortCode}</p>
                                                                        <p><span className="font-medium">Min per Request:</span> {leave.minPerRequest} days</p>
                                                                        <p><span className="font-medium">Max per Request:</span> {leave.maxPerRequest} days</p>
                                                                        <p><span className="font-medium">Applicable For:</span> {leave.applicableFor}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Restrictions */}
                                                                <div className="bg-white p-3 rounded border">
                                                                    <h5 className="font-medium text-gray-700 mb-2">Restrictions</h5>
                                                                    <div className="space-y-1 text-sm text-gray-600">
                                                                        <p><span className="font-medium">Max Instances/Year:</span> {leave.maxInstancesPerYear || 'Unlimited'}</p>
                                                                        <p><span className="font-medium">Max Instances/Month:</span> {leave.maxInstancesPerMonth || 'Unlimited'}</p>
                                                                        <p><span className="font-medium">Cooling Period:</span> {leave.coolingPeriod} days</p>
                                                                    </div>
                                                                </div>

                                                                {/* Requirements */}
                                                                <div className="bg-white p-3 rounded border">
                                                                    <h5 className="font-medium text-gray-700 mb-2">Requirements</h5>
                                                                    <div className="space-y-1 text-sm text-gray-600">
                                                                        <p><span className="font-medium">Approval Required:</span> {leave.requiresApproval ? 'Yes' : 'No'}</p>
                                                                        <p><span className="font-medium">Documents Required:</span> {leave.requiresDocs ? 'Yes' : 'No'}</p>
                                                                        {leave.requiresDocs && leave.docsRequiredAfterDays !== null && (
                                                                            <p><span className="font-medium">Docs Required After:</span> {leave.docsRequiredAfterDays} days</p>
                                                                        )}
                                                                        {leave.requiresDocs && leave.documentTypes?.length > 0 && (
                                                                            <p><span className="font-medium">Document Types:</span> {leave.documentTypes.join(', ')}</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Features - Fixed to only show schema fields */}
                                                                <div className="bg-white p-3 rounded border md:col-span-2 lg:col-span-3">
                                                                    <h5 className="font-medium text-gray-700 mb-2">Features</h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {[
                                                                            { key: 'unpaid', label: 'Unpaid Leave', color: 'red' },
                                                                            { key: 'requiresApproval', label: 'Requires Approval', color: 'blue' },
                                                                            { key: 'requiresDocs', label: 'Requires Documents', color: 'yellow' },
                                                                            { key: 'carryForward', label: 'Carry Forward', color: 'green' },
                                                                            { key: 'encashment', label: 'Encashment', color: 'purple' },
                                                                            { key: 'lapse', label: 'Lapse', color: 'orange' }
                                                                        ].map(feature => (
                                                                            leave[feature.key] && (
                                                                                <span key={feature.key} className={`px-2 py-1 text-xs rounded bg-${feature.color}-100 text-${feature.color}-800`}>
                                                                                    {feature.label}
                                                                                </span>
                                                                            )
                                                                        ))}
                                                                        {![leave.unpaid, leave.requiresApproval, leave.requiresDocs, leave.carryForward, leave.encashment, leave.lapse].some(Boolean) && (
                                                                            <span className="text-gray-500 text-sm">No special features enabled</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add/Edit Leave Type Form */}
                                {showLeaveTypeForm && (
                                    <div id="leave-type-form" className="border-t pt-6">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                                            {editingIndex >= 0 ? 'Edit Leave Type' : 'Add New Leave Type'}
                                        </h3>
                                        
                                        {/* Basic Information Section */}
                                        <div className="mb-6">
                                            <h4 className="text-md font-medium text-gray-700 mb-3">Basic Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                                    <input
                                                        type="text"
                                                        value={currentLeaveType.name}
                                                        onChange={(e) => handleLeaveTypeChange('name', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., CL"
                                                        maxLength={5}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Days per Request</label>
                                                    <input
                                                        type="number"
                                                        min="0.5"
                                                        step="0.5"
                                                        value={currentLeaveType.minPerRequest}
                                                        onChange={(e) => handleLeaveTypeChange('minPerRequest', parseFloat(e.target.value))}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Days per Request</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={currentLeaveType.maxPerRequest}
                                                        onChange={(e) => handleLeaveTypeChange('maxPerRequest', parseInt(e.target.value))}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Applicable For</label>
                                                    <select
                                                        value={currentLeaveType.applicableFor}
                                                        onChange={(e) => handleLeaveTypeChange('applicableFor', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {applicableForOptions.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Restrictions Section */}
                                        <div className="mb-6">
                                            <h4 className="text-md font-medium text-gray-700 mb-3">Restrictions</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Instances Per Year</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={currentLeaveType.maxInstancesPerYear || ''}
                                                        onChange={(e) => handleLeaveTypeChange('maxInstancesPerYear', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Leave blank for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Instances Per Month</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={currentLeaveType.maxInstancesPerMonth || ''}
                                                        onChange={(e) => handleLeaveTypeChange('maxInstancesPerMonth', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Leave blank for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cooling Period (Days)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={currentLeaveType.coolingPeriod}
                                                        onChange={(e) => handleLeaveTypeChange('coolingPeriod', parseInt(e.target.value) || 0)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Days between consecutive applications"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Requirements Section */}
                                        <div className="mb-6">
                                            <h4 className="text-md font-medium text-gray-700 mb-3">Requirements & Settings</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.requiresApproval}
                                                        onChange={(e) => handleLeaveTypeChange('requiresApproval', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Requires Approval</span>
                                                </label>

                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.requiresDocs}
                                                        onChange={(e) => handleLeaveTypeChange('requiresDocs', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Requires Documents</span>
                                                </label>

                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.carryForward}
                                                        onChange={(e) => handleLeaveTypeChange('carryForward', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Carry Forward</span>
                                                </label>

                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.encashment}
                                                        onChange={(e) => handleLeaveTypeChange('encashment', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Encashment</span>
                                                </label>

                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.lapse}
                                                        onChange={(e) => handleLeaveTypeChange('lapse', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Lapse</span>
                                                </label>

                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.unpaid}
                                                        onChange={(e) => handleLeaveTypeChange('unpaid', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Unpaid Leave</span>
                                                </label>

                                                <label className="flex items-center bg-gray-50 p-3 rounded-md">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentLeaveType.isActive}
                                                        onChange={(e) => handleLeaveTypeChange('isActive', e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>
                                            </div>

                                            {/* Documents Required After Days - Only shown when requiresDocs is true */}
                                            {currentLeaveType.requiresDocs && (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Documents Required After Days
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={currentLeaveType.docsRequiredAfterDays || ''}
                                                        onChange={(e) => handleLeaveTypeChange('docsRequiredAfterDays', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., 3 (require docs if leave > 3 days)"
                                                    />
                                                </div>
                                            )}

                                            {/* Document Types Section - Only shown when requiresDocs is true */}
                                            {currentLeaveType.requiresDocs && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Types Required</label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {currentLeaveType.documentTypes.map((docType, index) => (
                                                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center">
                                                                {docType}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDocumentType(index)}
                                                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Type document name and press Enter (e.g., Medical Certificate)"
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleDocumentTypeChange(e);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Form Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={handleSaveLeaveType}
                                                className={`px-6 py-2 text-white rounded-md transition-colors ${
                                                    editingIndex >= 0 
                                                        ? 'bg-orange-600 hover:bg-orange-700' 
                                                        : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                            >
                                                {editingIndex >= 0 ? 'Update Leave Type' : 'Add Leave Type'}
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetLeaveTypeForm();
                                                    setShowLeaveTypeForm(false);
                                                }}
                                                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* No Leave Types Message */}
                                {leaveTypes.length === 0 && !showLeaveTypeForm && (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <div className="text-gray-500 text-lg mb-2">No leave types configured</div>
                                        <p className="text-gray-400 text-sm mb-4">Add your first leave type to get started</p>
                                        <button
                                            onClick={() => setShowLeaveTypeForm(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Add First Leave Type
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Policy Not Created Message for Leave Types */}
                    {activeTab === 'leaves' && !policyExists && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                <div className="text-yellow-800 text-lg font-medium mb-2">
                                    Leave Policy Not Created
                                </div>
                                <p className="text-yellow-700 mb-4">
                                    Please create a leave policy first before managing leave types.
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

export default LeavePolicy