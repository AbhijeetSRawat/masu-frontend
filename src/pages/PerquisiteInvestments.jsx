import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import SubAdminSidebar from '../components/SubAdminSidebar';
import SubAdminHeader from '../components/SubAdminHeader';
import HRSidebar from '../components/HRSidebar';
import HRHeader from '../components/HRHeader';
import toast from 'react-hot-toast';
import { setLoading } from '../slices/companyPermission';
import { apiConnector } from '../services/apiConnector';
import {
  employeeEndpoints,
  perkEndpoints,
  departmentEndpoints
} from '../services/api';
import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCar,
  FaHome,
  FaMedkit,
  FaGraduationCap,
  FaPlane,
  FaEllipsisH,
  FaSpinner,
  FaDownload,
  FaUpload,
  FaMoneyBillAlt,
  FaCalendarAlt,
  FaCheck,
  FaExclamationTriangle,
  FaToggleOn,
  FaToggleOff,
  FaList,
  FaCog
} from 'react-icons/fa';

const { GET_ALL_EMPLOYEE_BY_COMPANY_ID } = employeeEndpoints;
const {
  createPerk,
  bulkCreatePerks,
  getCompanyPerks,
  assignPerkToEmployee,
  bulkAssignPerks,
  getEmployeePerks,
  removeEmployeePerk,
  updatePerkStatus
} = perkEndpoints;

// Perk Category Icons Map
const PERK_CATEGORY_ICONS = {
  vehicle: FaCar,
  housing: FaHome,
  medical: FaMedkit,
  education: FaGraduationCap,
  travel: FaPlane,
  other: FaEllipsisH
};

// Perk Categories Options
const PERK_CATEGORIES = [
  { value: 'vehicle', label: 'Vehicle', color: 'bg-blue-100 text-blue-800' },
  { value: 'housing', label: 'Housing', color: 'bg-green-100 text-green-800' },
  { value: 'medical', label: 'Medical', color: 'bg-red-100 text-red-800' },
  { value: 'education', label: 'Education', color: 'bg-purple-100 text-purple-800' },
  { value: 'travel', label: 'Travel', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
];

// Employee Perks Management Modal Component
const EmployeePerksModal = ({ 
  isOpen, 
  onClose, 
  employee, 
  companyPerks, 
  token, 
  onRefresh 
}) => {
  const [employeePerks, setEmployeePerks] = useState([]);
  const [availablePerks, setAvailablePerks] = useState([]);
  const [selectedPerks, setSelectedPerks] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'assign'

  // Fetch employee perks
  const fetchEmployeePerks = useCallback(async () => {
    if (!employee?._id || !token) return;

    try {
      setModalLoading(true);
      const response = await apiConnector(
        'GET',
        `${getEmployeePerks.replace(':employeeId', employee._id)}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.employeePerks) {
        setEmployeePerks(response.data.employeePerks);
      }
    } catch (error) {
      console.error('Error fetching employee perks:', error);
      toast.error('Failed to fetch employee perks');
    } finally {
      setModalLoading(false);
    }
  }, [employee?._id, token]);

  // Filter available perks (not already assigned)
  const filterAvailablePerks = useCallback(() => {
    const assignedPerkIds = employeePerks
      .filter(ep => ep.status === 'active')
      .map(ep => ep.perk._id);
    
    const available = companyPerks.filter(perk => 
      perk.isActive && !assignedPerkIds.includes(perk._id)
    );
    
    setAvailablePerks(available);
  }, [employeePerks, companyPerks]);

  // Handle perk selection for assignment
  const handlePerkSelection = useCallback((perkId, isSelected) => {
    setSelectedPerks(prev => {
      if (isSelected) {
        return [...prev, perkId];
      } else {
        return prev.filter(id => id !== perkId);
      }
    });
  }, []);

  // Assign selected perks to employee
  const handleAssignPerks = useCallback(async () => {
    if (selectedPerks.length === 0) {
      toast.error('Please select at least one perk');
      return;
    }

    try {
      setAssignLoading(true);
      
      const assignments = selectedPerks.map(perkId => ({
        employeeId: employee._id,
        perkId,
        effectiveDate: new Date().toISOString().split('T')[0],
        notes: `Assigned via bulk assignment on ${new Date().toLocaleDateString()}`
      }));

      const response = await apiConnector(
        'POST',
        bulkAssignPerks,
        { assignments },
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.successful > 0) {
        toast.success(`${response.data.successful} perks assigned successfully`);
        setSelectedPerks([]);
        fetchEmployeePerks();
        onRefresh();
        setActiveTab('assigned');
      }

      if (response.data?.errors?.length > 0) {
        toast.error(`${response.data.errors.length} assignments failed`);
      }
    } catch (error) {
      console.error('Error assigning perks:', error);
      toast.error('Failed to assign perks');
    } finally {
      setAssignLoading(false);
    }
  }, [selectedPerks, employee?._id, token, fetchEmployeePerks, onRefresh]);

  // Remove perk from employee
  const handleRemovePerk = useCallback(async (employeePerkId) => {
   

    try {
      const response = await apiConnector(
        'PUT',
        `${removeEmployeePerk.replace(':employeePerkId', employeePerkId)}`,
        {
          endDate: new Date().toISOString().split('T')[0],
          notes: 'Removed by admin'
        },
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.employeePerk) {
        toast.success('Perk removed successfully');
        fetchEmployeePerks();
        onRefresh();
      }
    } catch (error) {
      console.error('Error removing perk:', error);
      toast.error('Failed to remove perk');
    }
  }, [token, fetchEmployeePerks, onRefresh]);

  // Get perk category display
  const getPerkCategoryDisplay = useCallback((category) => {
    const categoryInfo = PERK_CATEGORIES.find(cat => cat.value === category);
    const IconComponent = PERK_CATEGORY_ICONS[category] || FaEllipsisH;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {categoryInfo?.label || category}
      </span>
    );
  }, []);

  useEffect(() => {
    if (isOpen && employee) {
      fetchEmployeePerks();
    }
  }, [isOpen, employee, fetchEmployeePerks]);

  useEffect(() => {
    filterAvailablePerks();
  }, [filterAvailablePerks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm   bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaUsers className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Perks Management - {employee?.user?.profile?.firstName} {employee?.user?.profile?.lastName}
              </h2>
              <p className="text-sm text-gray-600">
                Employee ID: {employee?.employmentDetails?.employeeId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col h-[70vh]">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Assigned Perks ({employeePerks.filter(ep => ep.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Assign New Perks ({availablePerks.length} available)
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {modalLoading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : activeTab === 'assigned' ? (
              /* Assigned Perks Tab */
              <div className="space-y-4">
                {employeePerks.filter(ep => ep.status === 'active').length === 0 ? (
                  <div className="text-center py-12">
                    <FaMoneyBillAlt className="text-4xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Perks Assigned</h3>
                    <p className="text-gray-500">This employee has no active perks assigned.</p>
                  </div>
                ) : (
                  employeePerks
                    .filter(ep => ep.status === 'active')
                    .map((employeePerk) => (
                      <div key={employeePerk._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-800">
                                {employeePerk.perk.name}
                              </h4>
                              {getPerkCategoryDisplay(employeePerk.perk.category)}
                              {employeePerk.perk.taxable && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <FaExclamationTriangle className="w-3 h-3 mr-1" />
                                  Taxable
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Value:</span>
                                <span className="font-medium ml-2">{employeePerk.perk.perkValue}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Ownership:</span>
                                <span className="font-medium ml-2 capitalize">{employeePerk.perk.ownership}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Usage:</span>
                                <span className="font-medium ml-2 capitalize">{employeePerk.perk.usage}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Effective Date:</span>
                                <span className="font-medium ml-2">
                                  {new Date(employeePerk.effectiveDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {employeePerk.perk.specialConditions && (
                              <div className="mt-3">
                                <span className="text-gray-500 text-sm">Special Conditions:</span>
                                <p className="text-sm text-gray-700 mt-1">{employeePerk.perk.specialConditions}</p>
                              </div>
                            )}

                            {employeePerk.notes && (
                              <div className="mt-3">
                                <span className="text-gray-500 text-sm">Notes:</span>
                                <p className="text-sm text-gray-700 mt-1">{employeePerk.notes}</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemovePerk(employeePerk._id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Perk"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            ) : (
              /* Assign New Perks Tab */
              <div className="space-y-4">
                {availablePerks.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCheck className="text-4xl text-green-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">All Perks Assigned</h3>
                    <p className="text-gray-500">This employee has all available perks assigned.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        Select perks to assign to this employee ({selectedPerks.length} selected)
                      </p>
                      {selectedPerks.length > 0 && (
                        <button
                          onClick={handleAssignPerks}
                          disabled={assignLoading}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {assignLoading ? (
                            <FaSpinner className="animate-spin w-4 h-4" />
                          ) : (
                            <FaPlus className="w-4 h-4" />
                          )}
                          {assignLoading ? 'Assigning...' : `Assign Selected (${selectedPerks.length})`}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availablePerks.map((perk) => (
                        <div key={perk._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedPerks.includes(perk._id)}
                              onChange={(e) => handlePerkSelection(perk._id, e.target.checked)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-base font-medium text-gray-800">{perk.name}</h4>
                                {getPerkCategoryDisplay(perk.category)}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="text-gray-500">Value:</span>
                                  <span className="font-medium ml-1">{perk.perkValue}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Usage:</span>
                                  <span className="font-medium ml-1 capitalize">{perk.usage}</span>
                                </div>
                              </div>

                              {perk.specialConditions && (
                                <p className="text-xs text-gray-600 mt-2">{perk.specialConditions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Perk Modal Component - CORRECTED VERSION
const CreatePerkModal = ({ isOpen, onClose, onRefresh, token }) => {
  const dispatch = useDispatch();
  const company = useSelector((state) => state.permissions.company);
  const [perkForm, setPerkForm] = useState({
    name: '',
    category: 'other',
    ownership: 'company',
    engineCapacity: 'na',
    usage: 'official',
    driverProvided: false,
    perkValue: '',
    specialConditions: '',
    taxable: false,
    calculationMethod: 'fixed',
    fixedAmount: 0,
    formula: ''
  });

  const resetPerkForm = () => {
    setPerkForm({
      name: '',
      category: 'other',
      ownership: 'company',
      engineCapacity: 'na',
      usage: 'official',
      driverProvided: false,
      perkValue: '',
      specialConditions: '',
      taxable: false,
      calculationMethod: 'fixed',
      fixedAmount: 0,
      formula: ''
    });
  };

  const handleSubmit = async () => {
    if (!perkForm.name.trim() || !perkForm.perkValue.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!company?._id) {
      toast.error('Company information not found');
      return;
    }

    try {
      dispatch(setLoading(true));

      // CORRECTED: Include companyId in the request body as expected by the controller
      const perkData = {
        ...perkForm,
        companyId: company._id  // Add companyId to match controller expectations
      };

      console.log('Sending perk data:', perkData);
      
      const response = await apiConnector(
        'POST',
        createPerk,
        perkData,  // Send the corrected data with companyId
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.perk) {
        toast.success('Perk created successfully');
        resetPerkForm();
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Error creating perk:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create perk';
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm   bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Create New Perk</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="col-span-full">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">Basic Information</h3>
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perk Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter perk name"
                value={perkForm.name}
                onChange={(e) => setPerkForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={perkForm.category}
                onChange={(e) => setPerkForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {PERK_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ownership</label>
              <select
                value={perkForm.ownership}
                onChange={(e) => setPerkForm(prev => ({ ...prev, ownership: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="company">Company</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage</label>
              <select
                value={perkForm.usage}
                onChange={(e) => setPerkForm(prev => ({ ...prev, usage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="official">Official</option>
                <option value="personal">Personal</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perk Value <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter perk value (e.g., ₹50,000 or Car Model X)"
                value={perkForm.perkValue}
                onChange={(e) => setPerkForm(prev => ({ ...prev, perkValue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Vehicle Specific Fields */}
            {perkForm.category === 'vehicle' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engine Capacity</label>
                  <select
                    value={perkForm.engineCapacity}
                    onChange={(e) => setPerkForm(prev => ({ ...prev, engineCapacity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="na">Not Applicable</option>
                    <option value="1.6 Below">1.6L and Below</option>
                    <option value="1.6 Above">Above 1.6L</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="driverProvided"
                    checked={perkForm.driverProvided}
                    onChange={(e) => setPerkForm(prev => ({ ...prev, driverProvided: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="driverProvided" className="ml-2 text-sm text-gray-700">
                    Driver Provided
                  </label>
                </div>
              </>
            )}

            {/* Tax Configuration */}
            <div className="col-span-full">
              <h3 className="text-lg font-semibold mb-4 text-blue-900 mt-6">Tax Configuration</h3>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="taxable"
                checked={perkForm.taxable}
                onChange={(e) => setPerkForm(prev => ({ ...prev, taxable: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="taxable" className="ml-2 text-sm text-gray-700">
                This perk is taxable
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Method</label>
              <select
                value={perkForm.calculationMethod}
                onChange={(e) => setPerkForm(prev => ({ ...prev, calculationMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="actual">Actual Cost</option>
                <option value="formula">Formula Based</option>
              </select>
            </div>

            {perkForm.calculationMethod === 'fixed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter fixed amount"
                  value={perkForm.fixedAmount}
                  onChange={(e) => setPerkForm(prev => ({ ...prev, fixedAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {perkForm.calculationMethod === 'formula' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
                <input
                  type="text"
                  placeholder="e.g., baseSalary * 0.1"
                  value={perkForm.formula}
                  onChange={(e) => setPerkForm(prev => ({ ...prev, formula: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Conditions</label>
              <textarea
                placeholder="Enter any special conditions or terms"
                value={perkForm.specialConditions}
                onChange={(e) => setPerkForm(prev => ({ ...prev, specialConditions: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Perk
          </button>
        </div>
      </div>
    </div>
  );
};

// Company Perks List Component
const CompanyPerksList = ({ companyPerks, onRefresh, token }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Get perk category display
  const getPerkCategoryDisplay = useCallback((category) => {
    const categoryInfo = PERK_CATEGORIES.find(cat => cat.value === category);
    const IconComponent = PERK_CATEGORY_ICONS[category] || FaEllipsisH;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {categoryInfo?.label || category}
      </span>
    );
  }, []);

  // Toggle perk status
  const handleTogglePerkStatus = async (perkId, currentStatus) => {
    try {
      const response = await apiConnector(
        'PUT',
        `${updatePerkStatus.replace(':perkId', perkId)}`,
        { isActive: !currentStatus },
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.perk) {
        toast.success(`Perk ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating perk status:', error);
      toast.error('Failed to update perk status');
    }
  };

  // Filter perks based on search and category
  const filteredPerks = companyPerks.filter(perk => {
    const matchesSearch = perk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perk.perkValue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || perk.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search perks by name or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {PERK_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPerks.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-12">
              <FaMoneyBillAlt className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {companyPerks.length === 0 ? 'No Perks Created' : 'No Perks Found'}
              </h3>
              <p className="text-gray-500">
                {companyPerks.length === 0 
                  ? 'Create your first company perk to get started.' 
                  : 'Try adjusting your search criteria.'
                }
              </p>
            </div>
          </div>
        ) : (
          filteredPerks.map((perk) => (
            <div key={perk._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{perk.name}</h3>
                      <button
                        onClick={() => handleTogglePerkStatus(perk._id, perk.isActive)}
                        className={`p-1 rounded transition-colors ${
                          perk.isActive 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={perk.isActive ? 'Deactivate Perk' : 'Activate Perk'}
                      >
                        {perk.isActive ? <FaToggleOn className="w-6 h-6" /> : <FaToggleOff className="w-6 h-6" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {getPerkCategoryDisplay(perk.category)}
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        perk.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {perk.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {perk.taxable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <FaExclamationTriangle className="w-3 h-3 mr-1" />
                          Taxable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Value:</span>
                      <p className="font-medium text-gray-800">{perk.perkValue}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Ownership:</span>
                      <p className="font-medium text-gray-800 capitalize">{perk.ownership}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <p className="font-medium text-gray-800 capitalize">{perk.usage}</p>
                    </div>
                    {perk.category === 'vehicle' && perk.engineCapacity !== 'na' && (
                      <div>
                        <span className="text-gray-500">Engine:</span>
                        <p className="font-medium text-gray-800">{perk.engineCapacity}</p>
                      </div>
                    )}
                  </div>

                  {perk.category === 'vehicle' && perk.driverProvided && (
                    <div className="flex items-center gap-2">
                      <FaCheck className="w-3 h-3 text-green-600" />
                      <span className="text-sm text-gray-600">Driver Provided</span>
                    </div>
                  )}

                  {perk.specialConditions && (
                    <div>
                      <span className="text-gray-500">Special Conditions:</span>
                      <p className="text-gray-700 text-sm mt-1">{perk.specialConditions}</p>
                    </div>
                  )}

                  {perk.taxable && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Calculation:</span>
                          <p className="font-medium text-gray-800 capitalize">{perk.calculationMethod}</p>
                        </div>
                        {perk.calculationMethod === 'fixed' && (
                          <div>
                            <span className="text-gray-500">Fixed Amount:</span>
                            <p className="font-medium text-gray-800">₹{perk.fixedAmount}</p>
                          </div>
                        )}
                      </div>
                      {perk.calculationMethod === 'formula' && perk.formula && (
                        <div className="mt-2">
                          <span className="text-gray-500">Formula:</span>
                          <p className="font-mono text-xs text-gray-700 bg-gray-50 p-1 rounded">{perk.formula}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  Created: {new Date(perk.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main PerquisitesInvestments Component
const PerquisitesInvestments = () => {
  const dispatch = useDispatch();
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const loading = useSelector((state) => state.permissions.loading);
  const role = useSelector((state) => state.auth.role);
  const subAdminPermissions = useSelector((state) => state.permissions.subAdminPermissions);

  // State management
  const [employees, setEmployees] = useState([]);
  const [companyPerks, setCompanyPerks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  
  // Toggle states for view switching
  const [viewMode, setViewMode] = useState('employees'); // 'employees' or 'perks'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const limit = 10;

  // Modal states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeePerksModalOpen, setIsEmployeePerksModalOpen] = useState(false);
  const [isCreatePerkModalOpen, setIsCreatePerkModalOpen] = useState(false);

  // Fetch all employees
  const fetchEmployees = useCallback(async (page = 1, search = '', department = '') => {
    if (!company?._id || !token) return;

    try {
      dispatch(setLoading(true));
      let url = `${GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=${page}&limit=${limit}`;
      
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (department) url += `&department=${department}`;

      const response = await apiConnector('GET', url, null, {
        Authorization: `Bearer ${token}`
      });

      if (response.data?.employees) {
        setEmployees(response.data.employees);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        setTotalEmployees(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      dispatch(setLoading(false));
    }
  }, [company?._id, token, dispatch]);

  // Fetch company perks
  const fetchCompanyPerks = useCallback(async () => {
    if (!company?._id || !token) return;

    try {
      const response = await apiConnector(
        'GET',
        `${getCompanyPerks.replace(':companyId', company._id)}?limit=100`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.perks) {
        setCompanyPerks(response.data.perks);
      }
    } catch (error) {
      console.error('Error fetching company perks:', error);
      toast.error('Failed to fetch company perks');
    }
  }, [company?._id, token]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    if (!company?._id || !token) return;

    try {
      const response = await apiConnector(
        'GET',
        `${departmentEndpoints.GET_ALL_DEPARTMENTS}${company._id}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.data) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [company?._id, token]);

  // Handle search
  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setCurrentPage(1);
    fetchEmployees(1, query, departmentFilter);
  }, [fetchEmployees, departmentFilter]);

  // Handle department filter
  const handleDepartmentFilter = useCallback((department) => {
    setDepartmentFilter(department);
    setCurrentPage(1);
    fetchEmployees(1, searchTerm, department);
  }, [fetchEmployees, searchTerm]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    fetchEmployees(page, searchTerm, departmentFilter);
  }, [fetchEmployees, searchTerm, departmentFilter]);

  // Open employee perks modal
  const handleViewEmployeePerks = useCallback((employee) => {
    setSelectedEmployee(employee);
    setIsEmployeePerksModalOpen(true);
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchEmployees(currentPage, searchTerm, departmentFilter);
    fetchCompanyPerks();
  }, [fetchEmployees, currentPage, searchTerm, departmentFilter, fetchCompanyPerks]);

  // Initialize data
  useEffect(() => {
    if (company?._id) {
      fetchEmployees();
      fetchCompanyPerks();
      fetchDepartments();
    }
  }, [company?._id, fetchEmployees, fetchCompanyPerks, fetchDepartments]);

  // Sidebar and header based on role
  const sidebar = role === 'admin' ? <AdminSidebar /> :
                  role === 'superadmin' && subAdminPermissions ? <SubAdminSidebar /> :
                  role === 'superadmin' ? <AdminSidebar /> :
                  role === 'sub-admin' ? <SubAdminSidebar /> :
                  <HRSidebar />;

  const header = role === 'admin' ? <AdminHeader /> :
                 role === 'superadmin' && subAdminPermissions ? <SubAdminHeader /> :
                 role === 'superadmin' ? <AdminHeader /> :
                 role === 'sub-admin' ? <SubAdminHeader /> :
                 <HRHeader />;

  return (
    <div className="flex">
      {sidebar}
      
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        {header}

        {loading ? (
          <div className="flex w-full h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Header Section with Toggle */}
            <div className="bg-white rounded-lg shadow-md p-6 m-6 mb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 mb-4 lg:mb-0">
                  <FaMoneyBillAlt className="text-3xl text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">Perquisites & Investments</h1>
                    <p className="text-gray-600">Manage employee perks and benefits</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('employees')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        viewMode === 'employees'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <FaUsers className="w-4 h-4" />
                      Employee Management
                    </button>
                    <button
                      onClick={() => setViewMode('perks')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        viewMode === 'perks'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <FaCog className="w-4 h-4" />
                      Company Perks
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsCreatePerkModalOpen(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    <FaPlus /> Create Perk
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards - Dynamic based on view mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mx-6 mb-6">
              {viewMode === 'employees' ? (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Employees</p>
                        <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                      </div>
                      <FaUsers className="text-3xl text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Available Perks</p>
                        <p className="text-2xl font-bold text-green-600">{companyPerks.filter(p => p.isActive).length}</p>
                      </div>
                      <FaMoneyBillAlt className="text-3xl text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Departments</p>
                        <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
                      </div>
                      <FaFilter className="text-3xl text-purple-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Page</p>
                        <p className="text-2xl font-bold text-orange-600">{currentPage} of {totalPages}</p>
                      </div>
                      <FaEye className="text-3xl text-orange-500" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Perks</p>
                        <p className="text-2xl font-bold text-gray-900">{companyPerks.length}</p>
                      </div>
                      <FaMoneyBillAlt className="text-3xl text-blue-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Perks</p>
                        <p className="text-2xl font-bold text-green-600">{companyPerks.filter(p => p.isActive).length}</p>
                      </div>
                      <FaCheck className="text-3xl text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Inactive Perks</p>
                        <p className="text-2xl font-bold text-red-600">{companyPerks.filter(p => !p.isActive).length}</p>
                      </div>
                      <FaTimes className="text-3xl text-red-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Taxable Perks</p>
                        <p className="text-2xl font-bold text-orange-600">{companyPerks.filter(p => p.taxable).length}</p>
                      </div>
                      <FaExclamationTriangle className="text-3xl text-orange-500" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Conditional Content based on view mode */}
            {viewMode === 'employees' ? (
              <>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mx-6 mb-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search employees by name, ID, or email..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <select
                      value={departmentFilter}
                      onChange={(e) => handleDepartmentFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mx-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Employees List</h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Designation
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employees.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center">
                                <FaUsers className="text-4xl text-gray-300 mb-2" />
                                <p className="text-lg font-medium">No employees found</p>
                                <p className="text-sm">Try adjusting your search criteria</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          employees.map((employee) => (
                            <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-800">
                                        {employee.user?.profile?.firstName?.[0] || 'N'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {employee.user?.profile?.firstName} {employee.user?.profile?.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      ID: {employee.employmentDetails?.employeeId}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {employee.user?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.employmentDetails?.department?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.employmentDetails?.designation || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  employee.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {employee.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleViewEmployeePerks(employee)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                >
                                  <FaEye className="w-4 h-4" />
                                  Manage Perks
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalEmployees)} of {totalEmployees} employees
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 rounded ${
                            currentPage === 1
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + Math.max(1, currentPage - 2);
                          if (page <= totalPages) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded ${
                                  page === currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                          return null;
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 rounded ${
                            currentPage === totalPages
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Company Perks View */
              <div className="mx-6">
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Company Perks Management</h2>
                  <CompanyPerksList 
                    companyPerks={companyPerks}
                    onRefresh={handleRefresh}
                    token={token}
                  />
                </div>
              </div>
            )}

            {/* Modals */}
            <EmployeePerksModal
              isOpen={isEmployeePerksModalOpen}
              onClose={() => {
                setIsEmployeePerksModalOpen(false);
                setSelectedEmployee(null);
              }}
              employee={selectedEmployee}
              companyPerks={companyPerks}
              token={token}
              onRefresh={handleRefresh}
            />

            <CreatePerkModal
              isOpen={isCreatePerkModalOpen}
              onClose={() => setIsCreatePerkModalOpen(false)}
              onRefresh={handleRefresh}
              token={token}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PerquisitesInvestments;
