import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { flexiEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const FlexiBenefits = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const role = useSelector(state => state.auth.role);
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions);

  const [activeTab, setActiveTab] = useState("basket");
  const [flexiBasket, setFlexiBasket] = useState(null);
  const [submittedDeclarations, setSubmittedDeclarations] = useState([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [isViewDeclarationModalOpen, setIsViewDeclarationModalOpen] = useState(false);
  const [isEditBasketModalOpen, setIsEditBasketModalOpen] = useState(false);
  const [isViewOptionModalOpen, setIsViewOptionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [editMode, setEditMode] = useState('basic');
  const [financialYear, setFinancialYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.permissions.loading);

  // Default flexi options
  const defaultFlexiOptions = [
    {
      headCode: "HRA",
      name: "House Rent Allowance",
      description: "Allowance for rental accommodation",
      optionType: "amount",
      minLimit: 0,
      maxLimit: 100000,
      calculationBasis: "40% of Basic Salary",
      taxBenefit: "Exempt u/s 10(13A) - Least of actual HRA, 40%/50% of Basic, or Rent-10% Basic",
      conditions: "Rent receipts required for amounts > Rs. 3,000/month",
      isActive: true,
      order: 1
    },
    {
      headCode: "LTA",
      name: "Leave Travel Allowance",
      description: "Allowance for travel during leave",
      optionType: "amount",
      minLimit: 0,
      maxLimit: 60000,
      calculationBasis: "As per CTC Slab",
      taxBenefit: "Exempt twice in a block of 4 years for travel within India",
      conditions: "Travel tickets and proofs required",
      isActive: true,
      order: 2
    },
    {
      headCode: "FUEL",
      name: "Fuel & Maintenance Reimbursement",
      description: "Reimbursement for vehicle fuel and maintenance",
      optionType: "amount",
      minLimit: 0,
      maxLimit: 39600,
      calculationBasis: "As per CTC Slab",
      taxBenefit: "Rs 1,800/month for <1600cc, Rs 2,400/month for >1600cc",
      conditions: "Vehicle registration required",
      isActive: true,
      order: 3
    },
    {
      headCode: "MEAL",
      name: "Meal Allowance",
      description: "Meal coupons or allowance",
      optionType: "unit",
      unitValue: 50,
      minLimit: 0,
      maxLimit: 26400,
      calculationBasis: "Rs 50 per meal coupon",
      taxBenefit: "Exempt up to Rs 50 per meal",
      conditions: "Maximum 2 meals per day",
      isActive: true,
      order: 4
    },
    {
      headCode: "TELECOM",
      name: "Telephone Allowance",
      description: "Mobile/Telephone reimbursement",
      optionType: "amount",
      minLimit: 0,
      maxLimit: 36000,
      calculationBasis: "Fixed monthly allowance",
      taxBenefit: "Fully taxable",
      conditions: "Bills may be required",
      isActive: true,
      order: 5
    }
  ];

  // Basket form state
  const [basketForm, setBasketForm] = useState({
    name: "",
    totalFlexiAmount: 0,
    calculationBasis: "Basic Salary",
    calculationPercentage: 0,
    financialYear: "",
    options: []
  });

  // Fetch flexi basket
  const fetchFlexiBasket = async () => {
    try {
      dispatch(setLoading(true));
      const url = flexiEndpoints.getFlexiBasket.replace(":companyId", company._id);
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      if (result.data.success) {
        setFlexiBasket(result.data.data);
        toast.success("Flexi basket fetched successfully!");
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        toast.error("No flexi basket found. Please create one.");
        setFlexiBasket(null);
      } else {
        toast.error("Unable to fetch flexi basket!");
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch submitted declarations
  const fetchSubmittedDeclarations = async () => {
    try {
      dispatch(setLoading(true));
      const url = `${flexiEndpoints.getFlexiDeclarationForCompany}?companyId=${company._id}&financialYear=${financialYear}&status=Submitted`;
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      console.log(result)

      if (result.data.success) {
        setSubmittedDeclarations(Array.isArray(result.data.data) ? result.data.data : [result.data.data].filter(Boolean));
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status !== 404) {
        toast.error("Failed to fetch submitted declarations");
      }
      setSubmittedDeclarations([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Save basket
  const handleSaveBasket = async () => {
    if (!basketForm.name.trim()) {
      toast.error("Please enter a basket name");
      return;
    }

    if (!basketForm.financialYear.trim()) {
      toast.error("Please enter a financial year");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const url = flexiEndpoints.createOrUpdateFlexiBasket.replace(":companyId", company._id);
      
      const payload = {
        name: basketForm.name,
        totalFlexiAmount: basketForm.totalFlexiAmount,
        calculationBasis: basketForm.calculationBasis,
        calculationPercentage: basketForm.calculationPercentage,
        financialYear: basketForm.financialYear,
        options: basketForm.options
      };

      const result = await apiConnector("POST", url, payload, {
        Authorization: `Bearer ${token}`
      });

      if (result.data.success) {
        toast.success("Flexi basket saved successfully!");
        setFlexiBasket(result.data.data);
        setIsEditBasketModalOpen(false);
        setEditMode('basic');
        fetchFlexiBasket();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save flexi basket");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Approve declaration
  const handleApproveDeclaration = async (declarationId) => {
    if (!declarationId) {
      toast.error("Invalid declaration ID");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const url = flexiEndpoints.approveFlexiDeclaration.replace(":id", declarationId);
      
      const result = await apiConnector("POST", url, null, {
        Authorization: `Bearer ${token}`
      });

      if (result.data.success) {
        toast.success("Declaration approved successfully!");
        fetchSubmittedDeclarations();
        setIsViewDeclarationModalOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve declaration");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle opening create/edit modal
  const handleOpenCreateModal = () => {
    if (!flexiBasket) {
      setBasketForm({
        name: "Flexi Benefits Basket",
        totalFlexiAmount: 0,
        calculationBasis: "Basic Salary",
        calculationPercentage: 0,
        financialYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        options: [...defaultFlexiOptions]
      });
    } else {
      setBasketForm({
        name: flexiBasket.name || "",
        totalFlexiAmount: flexiBasket.totalFlexiAmount || 0,
        calculationBasis: flexiBasket.calculationBasis || "Basic Salary",
        calculationPercentage: flexiBasket.calculationPercentage || 0,
        financialYear: flexiBasket.financialYear || "",
        options: flexiBasket.options ? [...flexiBasket.options] : [...defaultFlexiOptions]
      });
    }
    setIsEditBasketModalOpen(true);
    setEditMode('basic');
  };

  // View declaration details
  const handleViewDeclaration = (declaration) => {
    setSelectedDeclaration(declaration);
    setIsViewDeclarationModalOpen(true);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setBasketForm({
      ...basketForm,
      options: [...defaultFlexiOptions]
    });
    toast.success("Reset to default flexi options");
  };

  // Handle view option
  const handleViewOption = (option) => {
    setSelectedOption(option);
    setIsViewOptionModalOpen(true);
  };

  // Flexi option management
  const handleAddFlexiOption = () => {
    const newOption = {
      headCode: '',
      name: '',
      description: '',
      optionType: 'amount',
      minLimit: 0,
      maxLimit: 0,
      calculationBasis: '',
      taxBenefit: '',
      conditions: '',
      isActive: true,
      order: basketForm.options.length + 1
    };
    setBasketForm({
      ...basketForm,
      options: [...basketForm.options, newOption]
    });
  };

  const handleUpdateFlexiOption = (index, field, value) => {
    const updatedOptions = [...basketForm.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setBasketForm({ ...basketForm, options: updatedOptions });
  };

  const handleRemoveFlexiOption = (index) => {
    const updatedOptions = basketForm.options.filter((_, i) => i !== index);
    setBasketForm({ ...basketForm, options: updatedOptions });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Submitted': return 'bg-blue-100 text-blue-700';
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    if (company?._id && token) {
      if (activeTab === "basket") {
        fetchFlexiBasket();
      } else if (activeTab === "declarations") {
        fetchSubmittedDeclarations();
      }
    }
  }, [activeTab, company?._id, token, financialYear]);

  return (
    <div className="flex">
      {role === 'superadmin' 
        ? (subAdminPermissions !== null ? <SubAdminSidebar /> : <AdminSidebar />)
        : role === 'admin' 
          ? <AdminSidebar /> 
          : role === 'manager'
            ? <ManagerSidebar />
            : role === 'hr'
              ? <HRSidebar />
              : <SubAdminSidebar />}
      
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        {(role === 'superadmin')
          ? (subAdminPermissions !== null ? <SubAdminHeader /> : <AdminHeader />)
          : role === 'admin' ? <AdminHeader/> :
            role === 'manager' ? <ManagerHeader/>:
            role === 'hr'?<HRHeader/>:
             <SubAdminHeader />}

        {loading ? (
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            <div className="px-6 mt-4">
              {/* Tab Navigation */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActiveTab("basket")}
                  className={`px-6 py-2 rounded font-semibold ${
                    activeTab === "basket"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Flexi Basket
                </button>
                <button
                  onClick={() => setActiveTab("declarations")}
                  className={`px-6 py-2 rounded font-semibold ${
                    activeTab === "declarations"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Employee Declarations
                </button>
              </div>

              {/* Basket Tab */}
              {activeTab === "basket" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Flexi Benefits Basket Configuration</h2>
                    <button
                      onClick={handleOpenCreateModal}
                      className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                    >
                      {flexiBasket ? "Edit Basket" : "Create Basket"}
                    </button>
                  </div>

                  {flexiBasket ? (
                    <div className="space-y-6">
                      {/* Basket Details */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm text-gray-600">Basket Name</p>
                          <p className="font-semibold">{flexiBasket.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Financial Year</p>
                          <p className="font-semibold">{flexiBasket.financialYear}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Calculation Basis</p>
                          <p className="font-semibold">{flexiBasket.calculationBasis}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Calculation Percentage</p>
                          <p className="font-semibold">{flexiBasket.calculationPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Flexi Amount</p>
                          <p className="font-semibold text-lg text-blue-900">
                            {formatCurrency(flexiBasket.totalFlexiAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Flexi Options */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Available Flexi Benefit Options</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left">Order</th>
                                <th className="px-4 py-2 text-left">Code</th>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Type</th>
                                <th className="px-4 py-2 text-left">Max Limit</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {flexiBasket.options && flexiBasket.options.length > 0 ? (
                                flexiBasket.options
                                  .sort((a, b) => a.order - b.order)
                                  .map((option, index) => (
                                    <tr key={index} className="border-t hover:bg-gray-50">
                                      <td className="px-4 py-2">{option.order}</td>
                                      <td className="px-4 py-2 font-medium">{option.headCode}</td>
                                      <td className="px-4 py-2">{option.name}</td>
                                      <td className="px-4 py-2 capitalize">{option.optionType}</td>
                                      <td className="px-4 py-2">{formatCurrency(option.maxLimit)}</td>
                                      <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          option.isActive 
                                            ? "bg-green-100 text-green-700" 
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                          {option.isActive ? "Active" : "Inactive"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <button
                                          onClick={() => handleViewOption(option)}
                                          className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors text-xs"
                                        >
                                          View Details
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                              ) : (
                                <tr>
                                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                    No flexi options configured
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No flexi basket configured yet</p>
                      <p className="text-sm mt-2">Click "Create Basket" to set up your company's flexi benefits structure</p>
                    </div>
                  )}
                </div>
              )}

              {/* Declarations Tab */}
              {activeTab === "declarations" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Submitted Flexi Declarations</h2>
                    <select
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                      className="px-3 py-2 border rounded text-sm"
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>

                  {submittedDeclarations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Employee ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-right">Total Declared</th>
                            <th className="px-4 py-2 text-right">Remaining Balance</th>
                            <th className="px-4 py-2 text-center">Status</th>
                            <th className="px-4 py-2 text-center">Submitted At</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submittedDeclarations.map((declaration, index) => (
                            <tr key={index} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">
                                {declaration.employee?.employmentDetails?.employeeId || 'N/A'}
                              </td>
                              <td className="px-4 py-2">
                                {declaration.employee?.user?.profile?.firstName} {declaration.employee?.user?.profile?.lastName}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {declaration.employee?.user?.email}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-green-700">
                                {formatCurrency(declaration.totalDeclaredAmount)}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-orange-700">
                                {formatCurrency(declaration.remainingBalance)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(declaration.status)}`}>
                                  {declaration.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-center text-gray-600">
                                {new Date(declaration.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleViewDeclaration(declaration)}
                                    className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors text-xs"
                                  >
                                    View
                                  </button>
                                  {declaration.status === 'Submitted' && (
                                    <button
                                      onClick={() => handleApproveDeclaration(declaration._id)}
                                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-xs"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No submitted declarations found</p>
                      <p className="text-sm mt-2">Declarations will appear here once employees submit them for approval</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Edit Basket Modal */}
            {isEditBasketModalOpen && (
              <div className="fixed inset-0   bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">
                      {flexiBasket ? "Edit Flexi Basket" : "Create Flexi Basket"}
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-2 mb-6 border-b">
                      <button
                        onClick={() => setEditMode('basic')}
                        className={`px-4 py-2 font-medium ${
                          editMode === 'basic'
                            ? 'border-b-2 border-blue-900 text-blue-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Basic Info
                      </button>
                      <button
                        onClick={() => setEditMode('options')}
                        className={`px-4 py-2 font-medium ${
                          editMode === 'options'
                            ? 'border-b-2 border-blue-900 text-blue-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Flexi Options ({basketForm.options.length})
                      </button>
                    </div>

                    {editMode === 'basic' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Basket Name
                          </label>
                          <input
                            type="text"
                            value={basketForm.name}
                            onChange={(e) => setBasketForm({...basketForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Flexi Benefits Basket"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Financial Year
                            </label>
                            <input
                              type="text"
                              value={basketForm.financialYear}
                              onChange={(e) => setBasketForm({...basketForm, financialYear: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="2024-2025"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total Flexi Amount
                            </label>
                            <input
                              type="number"
                              value={basketForm.totalFlexiAmount}
                              onChange={(e) => setBasketForm({...basketForm, totalFlexiAmount: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Calculation Basis
                            </label>
                            <select
                              value={basketForm.calculationBasis}
                              onChange={(e) => setBasketForm({...basketForm, calculationBasis: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Basic Salary">Basic Salary</option>
                              <option value="Fixed Amount">Fixed Amount</option>
                              <option value="CTC">CTC</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Calculation Percentage
                            </label>
                            <input
                              type="number"
                              value={basketForm.calculationPercentage}
                              onChange={(e) => setBasketForm({...basketForm, calculationPercentage: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Basket Configuration</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {flexiBasket 
                              ? "Use the Flexi Options tab to edit benefit options."
                              : "Creating a new basket will include default flexi benefit options. You can customize them using the Flexi Options tab."}
                          </p>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Current Flexi Options: {basketForm.options.length}</li>
                            <li>• Active Options: {basketForm.options.filter(opt => opt.isActive).length}</li>
                          </ul>
                          
                          <button
                            onClick={resetToDefaults}
                            className="mt-3 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                          >
                            Reset to Defaults
                          </button>
                        </div>
                      </div>
                    )}

                    {editMode === 'options' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Flexi Benefit Options Configuration</h3>
                          <button
                            onClick={handleAddFlexiOption}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            + Add Option
                          </button>
                        </div>

                        {basketForm.options.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No flexi options configured. Click "Add Option" to create one.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {basketForm.options.map((option, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Head Code *</label>
                                    <input
                                      type="text"
                                      value={option.headCode}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'headCode', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., HRA"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                      type="text"
                                      value={option.name}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'name', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., House Rent Allowance"
                                    />
                                  </div>

                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                      type="text"
                                      value={option.description}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'description', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Brief description of the benefit"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Option Type *</label>
                                    <select
                                      value={option.optionType}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'optionType', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="amount">Amount</option>
                                      <option value="unit">Unit</option>
                                      <option value="percentage">Percentage</option>
                                    </select>
                                  </div>

                                  {option.optionType === 'unit' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Value (₹)</label>
                                      <input
                                        type="number"
                                        value={option.unitValue || 0}
                                        onChange={(e) => handleUpdateFlexiOption(index, 'unitValue', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 50"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Limit (₹)</label>
                                    <input
                                      type="number"
                                      value={option.minLimit}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'minLimit', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 0"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Limit (₹)</label>
                                    <input
                                      type="number"
                                      value={option.maxLimit}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'maxLimit', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 100000"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                                    <input
                                      type="number"
                                      value={option.order}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'order', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Calculation Basis</label>
                                    <input
                                      type="text"
                                      value={option.calculationBasis}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'calculationBasis', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 40% of Basic Salary"
                                    />
                                  </div>

                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tax Benefit</label>
                                    <textarea
                                      value={option.taxBenefit}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'taxBenefit', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Tax exemption details"
                                      rows="2"
                                    />
                                  </div>

                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Conditions</label>
                                    <textarea
                                      value={option.conditions}
                                      onChange={(e) => handleUpdateFlexiOption(index, 'conditions', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Any conditions or requirements"
                                      rows="2"
                                    />
                                  </div>

                                  <div className="col-span-2 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={option.isActive}
                                        onChange={(e) => handleUpdateFlexiOption(index, 'isActive', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      Active
                                    </label>

                                    <button
                                      onClick={() => handleRemoveFlexiOption(index)}
                                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t p-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsEditBasketModalOpen(false);
                        setEditMode('basic');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBasket}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Basket"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View Declaration Details Modal */}
            {isViewDeclarationModalOpen && selectedDeclaration && (
              <div className="fixed inset-0   bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Flexi Declaration Details</h2>
                      <button 
                        onClick={() => setIsViewDeclarationModalOpen(false)} 
                        className="text-white hover:text-gray-200 text-3xl font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Employee Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">Employee Information</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Employee ID</p>
                          <p className="font-semibold">{selectedDeclaration.employee?.employmentDetails?.employeeId}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Name</p>
                          <p className="font-semibold">
                            {selectedDeclaration.employee?.user?.profile?.firstName} {selectedDeclaration.employee?.user?.profile?.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-semibold">{selectedDeclaration.employee?.user?.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Department</p>
                          <p className="font-semibold">{selectedDeclaration.employee?.employmentDetails?.department?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Designation</p>
                          <p className="font-semibold">{selectedDeclaration.employee?.employmentDetails?.designation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedDeclaration.status)}`}>
                            {selectedDeclaration.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Basic Salary</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedDeclaration.basicSalary)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Flexi Amount</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(selectedDeclaration.totalFlexiAmount)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Declared</p>
                        <p className="text-xl font-bold text-purple-700">{formatCurrency(selectedDeclaration.totalDeclaredAmount)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Remaining Balance</p>
                        <p className="text-xl font-bold text-orange-700">{formatCurrency(selectedDeclaration.remainingBalance)}</p>
                      </div>
                    </div>

                    {/* Declarations Table */}
                    <div>
                      <h3 className="font-bold text-lg mb-3">Benefit Declarations</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left">Benefit Head</th>
                              <th className="px-4 py-2 text-right">Units</th>
                              <th className="px-4 py-2 text-right">Declared Amount</th>
                              <th className="px-4 py-2 text-right">Monthly Amount</th>
                              <th className="px-4 py-2 text-right">Limit</th>
                              <th className="px-4 py-2 text-right">Tax Benefit</th>
                              <th className="px-4 py-2 text-center">Within Limit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDeclaration.declarations.map((decl, index) => (
                              <tr key={index} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{decl.headCode}</td>
                                <td className="px-4 py-2 text-right">{decl.declaredUnits || '-'}</td>
                                <td className="px-4 py-2 text-right font-semibold">{formatCurrency(decl.declaredAmount)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(decl.monthlyAmount)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(decl.limitAsPerCTC)}</td>
                                <td className="px-4 py-2 text-right text-green-600">{formatCurrency(decl.taxBenefitAmount)}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    decl.isWithinLimit 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-red-100 text-red-700"
                                  }`}>
                                    {decl.isWithinLimit ? "Yes" : "No"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedDeclaration.submittedAt && (
                        <div>
                          <p className="text-gray-600">Submitted At</p>
                          <p className="font-medium">{new Date(selectedDeclaration.submittedAt).toLocaleString()}</p>
                        </div>
                      )}
                      {selectedDeclaration.approvedAt && (
                        <div>
                          <p className="text-gray-600">Approved At</p>
                          <p className="font-medium">{new Date(selectedDeclaration.approvedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
                    <button
                      onClick={() => setIsViewDeclarationModalOpen(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Close
                    </button>
                    {selectedDeclaration.status === 'Submitted' && (
                      <button
                        onClick={() => handleApproveDeclaration(selectedDeclaration._id)}
                        className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Approve Declaration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* View Option Details Modal */}
            {isViewOptionModalOpen && selectedOption && (
              <div className="fixed inset-0   backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">Flexi Benefit Option Details</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Head Code</p>
                        <p className="font-semibold">{selectedOption.headCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold">{selectedOption.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Option Type</p>
                        <p className="font-semibold capitalize">{selectedOption.optionType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedOption.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {selectedOption.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Description</p>
                      <p className="text-gray-800">{selectedOption.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedOption.unitValue && (
                        <div>
                          <p className="text-sm text-gray-600">Unit Value</p>
                          <p className="font-semibold">{formatCurrency(selectedOption.unitValue)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Min Limit</p>
                        <p className="font-semibold">{formatCurrency(selectedOption.minLimit)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Max Limit</p>
                        <p className="font-semibold">{formatCurrency(selectedOption.maxLimit)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Calculation Basis</p>
                      <p className="text-gray-800">{selectedOption.calculationBasis}</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <p className="text-sm font-semibold text-green-900 mb-1">Tax Benefit</p>
                      <p className="text-sm text-gray-700">{selectedOption.taxBenefit}</p>
                    </div>

                    {selectedOption.conditions && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <p className="text-sm font-semibold text-yellow-900 mb-1">Conditions</p>
                        <p className="text-sm text-gray-700">{selectedOption.conditions}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setIsViewOptionModalOpen(false)}
                      className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlexiBenefits;
