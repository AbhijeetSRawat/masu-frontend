import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { perkEndpoints } from "../services/api";
import {
  FaMoneyBillAlt,
  FaCar,
  FaHome,
  FaMedkit,
  FaGraduationCap,
  FaPlane,
  FaEllipsisH,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaUser,
  FaBuilding,
  FaChartPie,
  FaFileAlt,
  FaClock
} from "react-icons/fa";

const { getEmployeePerks } = perkEndpoints;

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

// Individual Perk Card Component
const PerkCard = ({ employeePerk }) => {
  const getPerkCategoryDisplay = (category) => {
    const categoryInfo = PERK_CATEGORIES.find(cat => cat.value === category);
    const IconComponent = PERK_CATEGORY_ICONS[category] || FaEllipsisH;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {categoryInfo?.label || category}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-800">
                {employeePerk.perk.name}
              </h3>
              {getPerkCategoryDisplay(employeePerk.perk.category)}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <FaCheck className="w-3 h-3 mr-1" />
                Active
              </span>
              {employeePerk.perk.taxable && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <FaExclamationTriangle className="w-3 h-3 mr-1" />
                  Taxable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Perk Details */}
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FaMoneyBillAlt className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700">Perk Value</span>
              </div>
              <p className="text-gray-900 font-semibold">{employeePerk.perk.perkValue}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FaBuilding className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-700">Ownership</span>
              </div>
              <p className="text-gray-900 capitalize">{employeePerk.perk.ownership}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FaUser className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-gray-700">Usage</span>
              </div>
              <p className="text-gray-900 capitalize">{employeePerk.perk.usage}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FaCalendarAlt className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-gray-700">Effective Date</span>
              </div>
              <p className="text-gray-900">{formatDate(employeePerk.effectiveDate)}</p>
            </div>
          </div>

          {/* Vehicle Specific Details */}
          {employeePerk.perk.category === 'vehicle' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <FaCar className="w-4 h-4" />
                Vehicle Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {employeePerk.perk.engineCapacity !== 'na' && (
                  <div>
                    <span className="text-blue-600 font-medium">Engine Capacity:</span>
                    <span className="ml-2 text-blue-800">{employeePerk.perk.engineCapacity}</span>
                  </div>
                )}
                <div>
                  <span className="text-blue-600 font-medium">Driver Provided:</span>
                  <span className="ml-2 text-blue-800">
                    {employeePerk.perk.driverProvided ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tax Information */}
          {employeePerk.perk.taxable && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <FaChartPie className="w-4 h-4" />
                Tax Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-orange-600 font-medium">Calculation Method:</span>
                  <span className="ml-2 text-orange-800 capitalize">{employeePerk.perk.calculationMethod}</span>
                </div>
                {employeePerk.calculatedAmount > 0 && (
                  <div>
                    <span className="text-orange-600 font-medium">Calculated Amount:</span>
                    <span className="ml-2 text-orange-800 font-semibold">
                      {formatCurrency(employeePerk.calculatedAmount)}
                    </span>
                  </div>
                )}
                {employeePerk.taxableAmount > 0 && (
                  <div>
                    <span className="text-orange-600 font-medium">Taxable Amount:</span>
                    <span className="ml-2 text-orange-800 font-semibold">
                      {formatCurrency(employeePerk.taxableAmount)}
                    </span>
                  </div>
                )}
                {employeePerk.perk.calculationMethod === 'fixed' && employeePerk.perk.fixedAmount && (
                  <div>
                    <span className="text-orange-600 font-medium">Fixed Amount:</span>
                    <span className="ml-2 text-orange-800 font-semibold">
                      {formatCurrency(employeePerk.perk.fixedAmount)}
                    </span>
                  </div>
                )}
              </div>
              {employeePerk.perk.calculationMethod === 'formula' && employeePerk.perk.formula && (
                <div className="mt-3 p-2 bg-orange-100 rounded">
                  <span className="text-orange-600 font-medium text-xs">Formula:</span>
                  <code className="ml-2 text-orange-800 text-xs font-mono bg-white px-1 py-0.5 rounded">
                    {employeePerk.perk.formula}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Special Conditions */}
          {employeePerk.perk.specialConditions && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <FaInfoCircle className="w-4 h-4" />
                Special Conditions
              </h4>
              <p className="text-yellow-700 text-sm">{employeePerk.perk.specialConditions}</p>
            </div>
          )}

          {/* Assignment Notes */}
          {employeePerk.notes && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaFileAlt className="w-4 h-4" />
                Assignment Notes
              </h4>
              <p className="text-gray-600 text-sm">{employeePerk.notes}</p>
            </div>
          )}

          {/* Assignment History */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FaClock className="w-3 h-3" />
                <span>Assigned: {formatDate(employeePerk.effectiveDate)}</span>
              </div>
              {employeePerk.approvedDate && (
                <div className="flex items-center gap-1">
                  <FaCheck className="w-3 h-3" />
                  <span>Approved: {formatDate(employeePerk.approvedDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Employee Perquisites Component
const EmployeePerquisites = () => {
  const [employeePerks, setEmployeePerks] = useState([]);
  const [perkSummary, setPerkSummary] = useState({
    total: 0,
    active: 0,
    taxable: 0,
    totalTaxableAmount: 0
  });

  const token = useSelector(state => state.auth.token);
  const loading = useSelector((state) => state.permissions.loading);
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const dispatch = useDispatch();

  const fetchEmployeePerks = async () => {
    if (!employee?._id || !token) return;

    try {
      dispatch(setLoading(true));
      const response = await apiConnector(
        "GET", 
        `${getEmployeePerks.replace(':employeeId', employee._id)}?status=active&limit=100`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      if (response.data?.employeePerks) {
        setEmployeePerks(response.data.employeePerks);
        calculatePerkSummary(response.data.employeePerks);
        console.log("Employee perks:", response.data.employeePerks);
      }
    } catch (error) {
      console.log("Error in fetching employee perks:", error);
      toast.error("Failed to fetch perquisites data");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const calculatePerkSummary = (perks) => {
    const summary = perks.reduce((acc, employeePerk) => {
      if (employeePerk.status === 'active') {
        acc.active += 1;
        if (employeePerk.perk.taxable) {
          acc.taxable += 1;
          acc.totalTaxableAmount += employeePerk.taxableAmount || 0;
        }
      }
      return acc;
    }, {
      total: perks.length,
      active: 0,
      taxable: 0,
      totalTaxableAmount: 0
    });

    setPerkSummary(summary);
  };

  // Group perks by category
  const perksByCategory = employeePerks
    .filter(ep => ep.status === 'active')
    .reduce((acc, employeePerk) => {
      const category = employeePerk.perk.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(employeePerk);
      return acc;
    }, {});

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  useEffect(() => {
    if (employee?._id) {
      fetchEmployeePerks();
    }
  }, [employee]);

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
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <FaMoneyBillAlt className="text-3xl text-blue-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Perquisites & Benefits</h2>
                    <p className="text-gray-600 mt-1">
                      Year: {new Date().getFullYear()} | Employee ID: {employee?.employmentDetails?.employeeId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Total Perks</div>
                        <div className="text-2xl font-bold text-blue-600">{perkSummary.total}</div>
                      </div>
                      <FaMoneyBillAlt className="text-3xl text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Active Perks</div>
                        <div className="text-2xl font-bold text-green-600">{perkSummary.active}</div>
                      </div>
                      <FaCheck className="text-3xl text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Taxable Perks</div>
                        <div className="text-2xl font-bold text-orange-600">{perkSummary.taxable}</div>
                      </div>
                      <FaExclamationTriangle className="text-3xl text-orange-500" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Taxable Amount</div>
                        <div className="text-xl font-bold text-purple-600">
                          {formatCurrency(perkSummary.totalTaxableAmount)}
                        </div>
                      </div>
                      <FaChartPie className="text-3xl text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perks Content */}
            {employeePerks.filter(ep => ep.status === 'active').length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FaMoneyBillAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Perquisites Assigned</h3>
                <p className="text-gray-500">
                  You currently have no active perquisites assigned. Please contact HR for more information.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Perks by Category */}
                {Object.entries(perksByCategory).map(([category, perks]) => {
                  const categoryInfo = PERK_CATEGORIES.find(cat => cat.value === category);
                  const IconComponent = PERK_CATEGORY_ICONS[category] || FaEllipsisH;
                  
                  return (
                    <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center gap-3">
                          <IconComponent className="text-2xl text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {categoryInfo?.label || category} Perquisites
                            </h3>
                            <p className="text-sm text-gray-600">{perks.length} perk{perks.length !== 1 ? 's' : ''} assigned</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {perks.map((employeePerk) => (
                            <PerkCard key={employeePerk._id} employeePerk={employeePerk} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Tax Information Summary */}
                {perkSummary.taxable > 0 && (
                  <div className="bg-orange-50 rounded-lg shadow-md border border-orange-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FaExclamationTriangle className="text-2xl text-orange-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-800">Tax Information</h3>
                        <p className="text-sm text-orange-600">Important tax implications for your perquisites</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border border-orange-300">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-orange-800">{perkSummary.taxable}</div>
                          <div className="text-sm text-orange-600">Taxable Perks</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-800">
                            {formatCurrency(perkSummary.totalTaxableAmount)}
                          </div>
                          <div className="text-sm text-orange-600">Total Taxable Amount</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-800">{new Date().getFullYear()}</div>
                          <div className="text-sm text-orange-600">Tax Year</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-orange-100 rounded border-l-4 border-orange-400">
                        <p className="text-sm text-orange-700">
                          <strong>Note:</strong> The taxable amount shown will be added to your taxable income. 
                          Please consult with the finance team or your tax advisor for detailed tax implications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePerquisites;
