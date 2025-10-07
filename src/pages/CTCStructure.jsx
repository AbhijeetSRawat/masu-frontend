import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import toast from "react-hot-toast";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { ctcEndpoints, employeeEndpoints } from "../services/api";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";
import ManagerHeader from "../components/ManagerHeader";
import ManagerSidebar from "../components/ManagerSidebar";
import HRSidebar from "../components/HRSidebar";
import HRHeader from "../components/HRHeader";

const {
  getCTCTemplate,
  createOrUpdateCTCTemplate,
  getAllCTCAnnexures,
  getCTCByEmployee,
  createCTCAnnexure,
  bulkCreateCTC,
  updateCTCAnnexure,
  getFlexiEligibleEmployees,
  getCTCBreakdown
} = ctcEndpoints;

const { GET_ALL_EMPLOYEE_BY_COMPANY_ID } = employeeEndpoints;

const CTCStructure = () => {
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const role = useSelector(state => state.auth.role);
  const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions);
  
  const [activeTab, setActiveTab] = useState("template");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const [ctcTemplate, setCTCTemplate] = useState(null);
  const [ctcAnnexures, setCTCAnnexures] = useState([]);
  const [selectedAnnexure, setSelectedAnnexure] = useState(null);
  const [flexiEligibleEmployees, setFlexiEligibleEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [isCreateAnnexureModalOpen, setIsCreateAnnexureModalOpen] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const [isUpdateAnnexureModalOpen, setIsUpdateAnnexureModalOpen] = useState(false);
  const [editMode, setEditMode] = useState('basic');
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    pageSize: 10
  });

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.permissions.loading);

  // Default salary heads
  const defaultSalaryHeads = [
    { name: 'Basic', calculationType: 'percentage', calculationValue: 40, calculationBasis: '40% of CTC', exemptionLimit: 'Nil', isTaxable: true, order: 1 },
    { name: 'HRA', calculationType: 'percentage', calculationValue: 20, calculationBasis: '20% of CTC', exemptionLimit: 'Actual Basic, 40%/50% of Basic, Rent Paid-10% of Basic - Whichever is lower', isTaxable: true, order: 2 },
    { name: 'Special City Allowance', calculationType: 'percentage', calculationValue: 16, calculationBasis: '16% of CTC', exemptionLimit: 'Fully Taxable', isTaxable: true, order: 3 },
    { name: 'Education Allowance', calculationType: 'fixed', calculationValue: 200, calculationBasis: 'Fixed', exemptionLimit: '10000', isTaxable: true, order: 4 },
    { name: 'Other Allowance', calculationType: 'formula', calculationBasis: 'Balancing Figure', exemptionLimit: 'Fully Taxable', isTaxable: true, order: 5 },
    { name: 'Leave Travel Assistance', calculationType: 'slab', calculationBasis: 'As per slab', exemptionLimit: 'Exempt twice in a block of 4 years', isTaxable: false, order: 6 },
    { name: 'Fuel & Maintenance Reimbursement', calculationType: 'slab', calculationBasis: 'As per slab', exemptionLimit: 'Rs 1800/- for <1600cc, Rs 2400/- for >1600cc', isTaxable: false, order: 7 },
    { name: 'Bonus', calculationType: 'formula', calculationBasis: 'MIN(25000,BASIC PM)', exemptionLimit: 'Non payable head', isTaxable: false, order: 8 },
    { name: 'Company Contribution to PF', calculationType: 'fixed', calculationValue: 21600, calculationBasis: 'Rs 1800/- per month', exemptionLimit: '', isTaxable: false, order: 9 },
    { name: 'Gratuity', calculationType: 'percentage', calculationValue: 4.81, calculationBasis: '4.81% of Basic', exemptionLimit: '', isTaxable: false, order: 10 },
    { name: 'Company Contribution to ESIC', calculationType: 'percentage', calculationValue: 3.25, calculationBasis: '3.25% of Gross salary', exemptionLimit: '', isTaxable: false, order: 11 },
    { name: 'Employee Contribution to PF', calculationType: 'fixed', calculationValue: 21600, calculationBasis: 'Rs 1800/- per month', exemptionLimit: '', isTaxable: false, order: 12 },
    { name: 'Employee Contribution to ESIC', calculationType: 'percentage', calculationValue: 0.75, calculationBasis: '0.75% of Gross salary', exemptionLimit: '', isTaxable: false, order: 13 },
    { name: 'Professional Tax', calculationType: 'fixed', calculationValue: 0, calculationBasis: 'As per State PT Slab', exemptionLimit: '', isTaxable: false, order: 14 }
  ];

  const defaultSlabs = [
    { slabType: 'LTA', salaryMin: 700000, salaryMax: 1000000, value: 30000, description: 'Leave Travel Assistance' },
    { slabType: 'LTA', salaryMin: 1000000, salaryMax: 1500000, value: 40000, description: 'Leave Travel Assistance' },
    { slabType: 'LTA', salaryMin: 1500000, salaryMax: 3000000, value: 50000, description: 'Leave Travel Assistance' },
    { slabType: 'LTA', salaryMin: 3000000, salaryMax: 999999999, value: 60000, description: 'Leave Travel Assistance' },
    { slabType: 'Fuel', salaryMin: 0, salaryMax: 700000, value: 25000, description: 'Fuel & Maintenance' },
    { slabType: 'Fuel', salaryMin: 700000, salaryMax: 1000000, value: 24000, description: 'Fuel & Maintenance' },
    { slabType: 'Fuel', salaryMin: 1000000, salaryMax: 1500000, value: 24000, description: 'Fuel & Maintenance' },
    { slabType: 'Fuel', salaryMin: 1500000, salaryMax: 3000000, value: 24000, description: 'Fuel & Maintenance' },
    { slabType: 'Fuel', salaryMin: 3000000, salaryMax: 999999999, value: 39600, description: 'Fuel & Maintenance' }
  ];

  // Form states
  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    financialYear: "",
    salaryHeads: [],
    slabs: []
  });

  const [annexureForm, setAnnexureForm] = useState({
    employee: "",
    annualCTC: "",
    financialYear: "",
    includeFlexiBenefits: false
  });

  const [bulkForm, setBulkForm] = useState({
    employees: [{ employeeId: "", annualCTC: "" }]
  });

  const [updateForm, setUpdateForm] = useState({
    annualCTC: "",
    financialYear: "",
    includeFlexiBenefits: false
  });

  // Fetch employees function
  const fetchEmployees = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiConnector(
        "GET",
        `${GET_ALL_EMPLOYEE_BY_COMPANY_ID}${company._id}?page=1&limit=1000`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      if (response.data) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Unable to fetch employees!");
      setEmployees([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch CTC Template
  const fetchCTCTemplate = async () => {
    try {
      dispatch(setLoading(true));
      const url = getCTCTemplate.replace(":companyId", company._id);
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      if (result.data) {
        setCTCTemplate(result.data);
        toast.success("CTC template fetched successfully!");
      }
    } catch (error) {
      console.error("Error fetching CTC template:", error);
      if (error.response?.status === 404) {
        toast.error("No CTC template found. Please create one.");
        setCTCTemplate(null);
      } else {
        toast.error("Unable to fetch CTC template!");
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch CTC Annexures
  const fetchCTCAnnexures = async (page = 1) => {
    try {
      dispatch(setLoading(true));
      const url = getAllCTCAnnexures.replace(":companyId", company._id);
      
      const result = await apiConnector(
        "GET", 
        `${url}?pageNumber=${page}&pageSize=${pagination.pageSize}`, 
        null, 
        {
          Authorization: `Bearer ${token}`,
        }
      );

      console.log(result)

      if (result.data) {
        setCTCAnnexures(result.data.annexures || []);
        setPagination({
          page: result.data.page,
          pages: result.data.pages,
          total: result.data.total,
          pageSize: pagination.pageSize,
        });
        toast.success("CTC annexures fetched successfully!");
      }
    } catch (error) {
      console.error("Error fetching CTC annexures:", error);
      toast.error("Unable to fetch CTC annexures!");
      setCTCAnnexures([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch Flexi Eligible Employees
  const fetchFlexiEligibleEmployees = async () => {
    try {
      dispatch(setLoading(true));
      const url = getFlexiEligibleEmployees.replace(":companyId", company._id);
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      console.log("result of flexi eligible employees : ",result)

      if (result.data?.success) {
        setFlexiEligibleEmployees(result.data.data.employees || []);
        toast.success("Flexi eligible employees fetched successfully!");
      }
    } catch (error) {
      console.error("Error fetching flexi eligible employees:", error);
      toast.error("Unable to fetch flexi eligible employees!");
      setFlexiEligibleEmployees([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Template functions
  const handleOpenCreateModal = () => {
    if (!ctcTemplate) {
      setTemplateForm({
        templateName: "",
        financialYear: "",
        salaryHeads: [...defaultSalaryHeads],
        slabs: [...defaultSlabs]
      });
    } else {
      setTemplateForm({
        templateName: ctcTemplate.templateName || "",
        financialYear: ctcTemplate.financialYear || "",
        salaryHeads: ctcTemplate.salaryHeads ? [...ctcTemplate.salaryHeads] : [...defaultSalaryHeads],
        slabs: ctcTemplate.slabs ? [...ctcTemplate.slabs] : [...defaultSlabs]
      });
    }
    setIsEditTemplateModalOpen(true);
    setEditMode('basic');
  };

  const resetToDefaults = () => {
    setTemplateForm({
      ...templateForm,
      salaryHeads: [...defaultSalaryHeads],
      slabs: [...defaultSlabs]
    });
    toast.success("Reset to default values");
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (!templateForm.financialYear.trim()) {
      toast.error("Please enter a financial year");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        templateName: templateForm.templateName,
        financialYear: templateForm.financialYear,
        companyId: company._id,
        salaryHeads: templateForm.salaryHeads,
        slabs: templateForm.slabs
      };

      const result = await apiConnector(
        "POST",
        createOrUpdateCTCTemplate,
        payload,
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (result.data) {
        toast.success("CTC template saved successfully!");
        setCTCTemplate(result.data);
        setIsEditTemplateModalOpen(false);
        setEditMode('basic');
        fetchCTCTemplate();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save CTC template");
    } finally {
      dispatch(setLoading(false));
    }
  };

  // CTC Annexure functions
  const handleCreateAnnexure = async () => {
    if (!annexureForm.employee) {
      toast.error("Please select an employee");
      return;
    }

    if (!annexureForm.annualCTC) {
      toast.error("Please enter annual CTC");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        employee: annexureForm.employee,
        annualCTC: parseFloat(annexureForm.annualCTC),
        financialYear: annexureForm.financialYear || ctcTemplate?.financialYear,
        includeFlexiBenefits: annexureForm.includeFlexiBenefits,
        companyId: company._id
      };

      const result = await apiConnector(
        "POST",
        createCTCAnnexure,
        payload,
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (result.data?.success) {
        toast.success("CTC annexure created successfully!");
        setIsCreateAnnexureModalOpen(false);
        setAnnexureForm({
          employee: "",
          annualCTC: "",
          financialYear: "",
          includeFlexiBenefits: false
        });
        fetchCTCAnnexures();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create CTC annexure");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateAnnexure = async () => {
    if (!selectedAnnexure || !updateForm.annualCTC) {
      toast.error("Please enter valid CTC amount");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const url = updateCTCAnnexure
        .replace(":ctcAnnexureId", selectedAnnexure._id)
        .replace(":companyId", company._id);
      
      const payload = {
        annualCTC: parseFloat(updateForm.annualCTC),
        financialYear: updateForm.financialYear,
        includeFlexiBenefits: updateForm.includeFlexiBenefits
      };

      const result = await apiConnector(
        "PUT",
        url,
        payload,
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (result.data?.success) {
        toast.success("CTC annexure updated successfully!");
        setIsUpdateAnnexureModalOpen(false);
        setSelectedAnnexure(null);
        fetchCTCAnnexures();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update CTC annexure");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleViewAnnexure = async (annexure) => {
    try {
      dispatch(setLoading(true));
      const url = getCTCByEmployee
        .replace(":employeeId", annexure.employee._id || annexure.employee)
        .replace(":companyId", company._id);
      
      const result = await apiConnector("GET", url, null, {
        Authorization: `Bearer ${token}`,
      });

      console.log("result is : ",result.data.data)

      if (result.data) {
        setSelectedAnnexure(result.data.data);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch CTC details!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleBulkCreate = async () => {
    const validEmployees = bulkForm.employees.filter(emp => emp.employeeId && emp.annualCTC);
    
    if (validEmployees.length === 0) {
      toast.error("Please add at least one valid employee");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const url = bulkCreateCTC.replace(":companyId", company._id);
      const payload = { employees: validEmployees };
      console.log(payload)

      const result = await apiConnector(
        "POST",
        url,
        payload,
        {
          Authorization: `Bearer ${token}`
        }
      );

      if (result.data) {
        const { success, failed } = result.data;
        toast.success(`Bulk create completed! Success: ${success.length}, Failed: ${failed.length}`);
        setIsBulkCreateModalOpen(false);
        setBulkForm({ employees: [{ employeeId: "", annualCTC: "" }] });
        fetchCTCAnnexures();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create bulk CTC annexures");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCTCAnnexures(newPage);
    }
  };

  // Template management functions
  const handleAddSalaryHead = () => {
    const newHead = {
      name: '',
      calculationType: 'fixed',
      calculationValue: 0,
      calculationBasis: '',
      exemptionLimit: '',
      isTaxable: true,
      order: templateForm.salaryHeads.length + 1
    };
    setTemplateForm({
      ...templateForm,
      salaryHeads: [...templateForm.salaryHeads, newHead]
    });
  };

  const handleUpdateSalaryHead = (index, field, value) => {
    const updatedHeads = [...templateForm.salaryHeads];
    updatedHeads[index] = { ...updatedHeads[index], [field]: value };
    setTemplateForm({ ...templateForm, salaryHeads: updatedHeads });
  };

  const handleRemoveSalaryHead = (index) => {
    const updatedHeads = templateForm.salaryHeads.filter((_, i) => i !== index);
    setTemplateForm({ ...templateForm, salaryHeads: updatedHeads });
  };

  const handleAddSlab = () => {
    const newSlab = {
      slabType: 'LTA',
      salaryMin: 0,
      salaryMax: 0,
      value: 0,
      description: ''
    };
    setTemplateForm({
      ...templateForm,
      slabs: [...templateForm.slabs, newSlab]
    });
  };

  const handleUpdateSlab = (index, field, value) => {
    const updatedSlabs = [...templateForm.slabs];
    updatedSlabs[index] = { ...updatedSlabs[index], [field]: value };
    setTemplateForm({ ...templateForm, slabs: updatedSlabs });
  };

  const handleRemoveSlab = (index) => {
    const updatedSlabs = templateForm.slabs.filter((_, i) => i !== index);
    setTemplateForm({ ...templateForm, slabs: updatedSlabs });
  };

  // Bulk form management
  const addBulkEmployee = () => {
    setBulkForm({
      employees: [...bulkForm.employees, { employeeId: "", annualCTC: "" }]
    });
  };

  const updateBulkEmployee = (index, field, value) => {
    const updatedEmployees = [...bulkForm.employees];
    updatedEmployees[index] = { ...updatedEmployees[index], [field]: value };
    setBulkForm({ employees: updatedEmployees });
  };

  const removeBulkEmployee = (index) => {
    const updatedEmployees = bulkForm.employees.filter((_, i) => i !== index);
    setBulkForm({ employees: updatedEmployees });
  };

  useEffect(() => {
    if (company?._id && token) {
      if (activeTab === "template") {
        fetchCTCTemplate();
      } else if (activeTab === "annexures") {
        fetchEmployees();
        if (activeSubTab === "list") {
          fetchCTCAnnexures(1);
        } else if (activeSubTab === "eligible") {
          fetchFlexiEligibleEmployees();
        } else if (activeSubTab === "create") {
          if (employees.length === 0) {
            fetchEmployees();
          }
        }
      }
    }
  }, [activeTab, activeSubTab, company?._id, token]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

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
              {/* Main Tab Navigation */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActiveTab("template")}
                  className={`px-6 py-2 rounded font-semibold ${
                    activeTab === "template"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  CTC Template
                </button>
                <button
                  onClick={() => setActiveTab("annexures")}
                  className={`px-6 py-2 rounded font-semibold ${
                    activeTab === "annexures"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  CTC Annexures
                </button>
              </div>

              {/* Template Tab */}
              {activeTab === "template" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">CTC Template Configuration</h2>
                    <button
                      onClick={handleOpenCreateModal}
                      className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                    >
                      {ctcTemplate ? "Edit Template" : "Create Template"}
                    </button>
                  </div>

                  {ctcTemplate ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm text-gray-600">Template Name</p>
                          <p className="font-semibold">{ctcTemplate.templateName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Financial Year</p>
                          <p className="font-semibold">{ctcTemplate.financialYear}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Salary Heads</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left">Order</th>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Type</th>
                                <th className="px-4 py-2 text-left">Value</th>
                                <th className="px-4 py-2 text-left">Basis</th>
                                <th className="px-4 py-2 text-left">Taxable</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ctcTemplate.salaryHeads?.sort((a, b) => a.order - b.order).map((head, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-2">{head.order}</td>
                                  <td className="px-4 py-2 font-medium">{head.name}</td>
                                  <td className="px-4 py-2 capitalize">{head.calculationType}</td>
                                  <td className="px-4 py-2">
                                    {head.calculationValue 
                                      ? (head.calculationType === 'percentage' 
                                        ? `${head.calculationValue}%` 
                                        : formatCurrency(head.calculationValue))
                                      : '—'}
                                  </td>
                                  <td className="px-4 py-2 text-sm">{head.calculationBasis}</td>
                                  <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      head.isTaxable 
                                        ? "bg-red-100 text-red-700" 
                                        : "bg-green-100 text-green-700"
                                    }`}>
                                      {head.isTaxable ? "Yes" : "No"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Salary Slabs</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left">Type</th>
                                <th className="px-4 py-2 text-left">Min Salary</th>
                                <th className="px-4 py-2 text-left">Max Salary</th>
                                <th className="px-4 py-2 text-left">Value</th>
                                <th className="px-4 py-2 text-left">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ctcTemplate.slabs?.map((slab, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium">{slab.slabType}</td>
                                  <td className="px-4 py-2">{formatCurrency(slab.salaryMin)}</td>
                                  <td className="px-4 py-2">{formatCurrency(slab.salaryMax)}</td>
                                  <td className="px-4 py-2">{formatCurrency(slab.value)}</td>
                                  <td className="px-4 py-2">{slab.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No CTC template configured yet</p>
                      <p className="text-sm mt-2">Click "Create Template" to set up your company's CTC structure</p>
                    </div>
                  )}
                </div>
              )}

              {/* Annexures Tab */}
              {activeTab === "annexures" && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex gap-3 mb-6 border-b">
                    <button
                      onClick={() => setActiveSubTab("list")}
                      className={`px-4 py-2 font-medium ${
                        activeSubTab === "list"
                          ? 'border-b-2 border-blue-900 text-blue-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All Annexures
                    </button>
                    <button
                      onClick={() => setActiveSubTab("create")}
                      className={`px-4 py-2 font-medium ${
                        activeSubTab === "create"
                          ? 'border-b-2 border-blue-900 text-blue-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Create Annexure
                    </button>
                  
                  </div>

                  {/* Annexures List */}
                  {activeSubTab === "list" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Employee CTC Annexures</h2>
                        <button
                          onClick={() => setIsBulkCreateModalOpen(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        >
                          Bulk Create
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm text-left">
                          <thead className="bg-blue-900 text-white">
                            <tr>
                              <th className="px-4 py-2">Sr.</th>
                              <th className="px-4 py-2">Employee Name</th>
                              <th className="px-4 py-2">Employee ID</th>
                              <th className="px-4 py-2">Department</th>
                              <th className="px-4 py-2">Annual CTC</th>
                              <th className="px-4 py-2">Flexi Benefits</th>
                              <th className="px-4 py-2">Financial Year</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ctcAnnexures.length === 0 ? (
                              <tr>
                                <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                  No CTC annexures found
                                </td>
                              </tr>
                            ) : (
                              ctcAnnexures.map((annexure, index) => (
                                <tr key={annexure._id} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-2">
                                    {(pagination.page - 1) * pagination.pageSize + index + 1}
                                  </td>
                                  <td className="px-4 py-2">
                                    {annexure.employee?.user?.profile?.firstName + " " + annexure.employee?.user?.profile?.lastName || "—"}
                                  </td>
                                  <td className="px-4 py-2">{annexure.employee?.employmentDetails?.employeeId || "—"}</td>
                                  <td className="px-4 py-2">{annexure.employee?.employmentDetails?.department?.name || "—"}</td>
                                  <td className="px-4 py-2 font-semibold">
                                    {formatCurrency(annexure.annualCTC)}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    {annexure.hasFlexiBenefits ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                        {formatCurrency(annexure.totalFlexiAmount)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2">{annexure.financialYear}</td>
                                  <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      annexure.status === 'Active' 
                                        ? "bg-green-100 text-green-700"
                                        : annexure.status === 'Approved'
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {annexure.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                                          handleViewAnnexure(annexure)
                                                            
                                                        }}  
                                        className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors text-xs"
                                      >
                                        View
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedAnnexure(annexure);
                                        
                                          setUpdateForm({
                                            annualCTC: annexure.annualCTC,
                                            financialYear: annexure.financialYear,
                                            includeFlexiBenefits: annexure.hasFlexiBenefits
                                          });
                                          setIsUpdateAnnexureModalOpen(true);
                                        }}
                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-xs"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {pagination.pages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Previous
                          </button>
                          
                          <span className="text-sm text-gray-600">
                            Page {pagination.page} of {pagination.pages}
                          </span>
                          
                          <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create Annexure Form */}
                  {activeSubTab === "create" && (
                    <div className="max-w-2xl">
                      <h2 className="text-xl font-bold text-gray-800 mb-6">Create Employee CTC Annexure</h2>
                      
                      {!ctcTemplate ? (
                        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                          <p className="text-red-700">
                            ⚠️ Please create a CTC template first before creating employee annexures.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Employee *
                            </label>
                            <select
                              value={annexureForm.employee}
                              onChange={(e) => setAnnexureForm({...annexureForm, employee: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Employee</option>
                              {employees.map((emp) => (
                                <option key={emp._id} value={emp._id}>
                                  {emp.user?.profile?.firstName} {emp.user?.profile?.lastName} ({emp.employmentDetails?.employeeId})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Annual CTC (₹) *
                            </label>
                            <input
                              type="number"
                              value={annexureForm.annualCTC}
                              onChange={(e) => setAnnexureForm({...annexureForm, annualCTC: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="1200000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Financial Year
                            </label>
                            <input
                              type="text"
                              value={annexureForm.financialYear || ctcTemplate?.financialYear}
                              onChange={(e) => setAnnexureForm({...annexureForm, financialYear: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="2024-2025"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="includeFlexiBenefits"
                              checked={annexureForm.includeFlexiBenefits}
                              onChange={(e) => setAnnexureForm({...annexureForm, includeFlexiBenefits: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="includeFlexiBenefits" className="text-sm text-gray-700">
                              Include Flexi Benefits (30% of Basic Salary)
                            </label>
                          </div>

                          {annexureForm.includeFlexiBenefits && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Flexi Benefits Preview</h4>
                              <p className="text-sm text-gray-700">
                                Estimated flexi benefits: <strong>{formatCurrency((parseFloat(annexureForm.annualCTC) || 0) * 0.4 * 0.3)}</strong>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Calculated as 30% of Basic Salary (40% of CTC)
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={handleCreateAnnexure}
                              disabled={loading}
                              className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                            >
                              {loading ? "Creating..." : "Create Annexure"}
                            </button>
                            <button
                              onClick={() => setAnnexureForm({
                                employee: "",
                                annualCTC: "",
                                financialYear: "",
                                includeFlexiBenefits: false
                              })}
                              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                 
                </div>
              )}
            </div>

            {/* Template Edit Modal */}
            {isEditTemplateModalOpen && (
              <div className="fixed inset-0   bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">
                      {ctcTemplate ? "Edit CTC Template" : "Create CTC Template"}
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
                        onClick={() => setEditMode('salaryHeads')}
                        className={`px-4 py-2 font-medium ${
                          editMode === 'salaryHeads'
                            ? 'border-b-2 border-blue-900 text-blue-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Salary Heads ({templateForm.salaryHeads.length})
                      </button>
                      <button
                        onClick={() => setEditMode('slabs')}
                        className={`px-4 py-2 font-medium ${
                          editMode === 'slabs'
                            ? 'border-b-2 border-blue-900 text-blue-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Salary Slabs ({templateForm.slabs.length})
                      </button>
                    </div>

                    {editMode === 'basic' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name
                          </label>
                          <input
                            type="text"
                            value={templateForm.templateName}
                            onChange={(e) => setTemplateForm({...templateForm, templateName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Standard CTC Template"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Financial Year
                          </label>
                          <input
                            type="text"
                            value={templateForm.financialYear}
                            onChange={(e) => setTemplateForm({...templateForm, financialYear: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="2024-2025"
                          />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Template Configuration</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {ctcTemplate 
                              ? "Use the tabs above to edit salary heads and slabs."
                              : "Creating a new template will include default salary heads and slabs. You can customize them using the tabs above."}
                          </p>
                          <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• Current Salary Heads: {templateForm.salaryHeads.length}</li>
                            <li>• Current Slabs: {templateForm.slabs.length}</li>
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

                    {editMode === 'salaryHeads' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Salary Heads Configuration</h3>
                          <button
                            onClick={handleAddSalaryHead}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            + Add Salary Head
                          </button>
                        </div>

                        {templateForm.salaryHeads.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No salary heads configured. Click "Add Salary Head" to create one.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {templateForm.salaryHeads.map((head, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                      type="text"
                                      value={head.name}
                                      onChange={(e) => handleUpdateSalaryHead(index, 'name', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., Basic"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Calculation Type *</label>
                                    <select
                                      value={head.calculationType}
                                      onChange={(e) => handleUpdateSalaryHead(index, 'calculationType', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="percentage">Percentage</option>
                                      <option value="fixed">Fixed Amount</option>
                                      <option value="slab">Slab-based</option>
                                      <option value="formula">Formula</option>
                                    </select>
                                  </div>

                                  {(head.calculationType === 'percentage' || head.calculationType === 'fixed') && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        {head.calculationType === 'percentage' ? 'Percentage Value' : 'Fixed Amount'}
                                      </label>
                                      <input
                                        type="number"
                                        value={head.calculationValue || 0}
                                        onChange={(e) => handleUpdateSalaryHead(index, 'calculationValue', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={head.calculationType === 'percentage' ? 'e.g., 40' : 'e.g., 21600'}
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Calculation Basis</label>
                                    <input
                                      type="text"
                                      value={head.calculationBasis}
                                      onChange={(e) => handleUpdateSalaryHead(index, 'calculationBasis', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 40% of CTC"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Exemption Limit</label>
                                    <input
                                      type="text"
                                      value={head.exemptionLimit}
                                      onChange={(e) => handleUpdateSalaryHead(index, 'exemptionLimit', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., Nil"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                                    <input
                                      type="number"
                                      value={head.order}
                                      onChange={(e) => handleUpdateSalaryHead(index, 'order', parseInt(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={head.isTaxable}
                                        onChange={(e) => handleUpdateSalaryHead(index, 'isTaxable', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      Taxable
                                    </label>

                                    <button
                                      onClick={() => handleRemoveSalaryHead(index)}
                                      className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
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

                    {editMode === 'slabs' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Salary Slabs Configuration</h3>
                          <button
                            onClick={handleAddSlab}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            + Add Slab
                          </button>
                        </div>

                        {templateForm.slabs.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No slabs configured. Click "Add Slab" to create one.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {templateForm.slabs.map((slab, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Slab Type *</label>
                                    <select
                                      value={slab.slabType}
                                      onChange={(e) => handleUpdateSlab(index, 'slabType', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="LTA">LTA</option>
                                      <option value="Fuel">Fuel</option>
                                      <option value="Gift">Gift</option>
                                      <option value="Telephone">Telephone</option>
                                      <option value="TechnicalBook">Technical Book</option>
                                      <option value="Meal">Meal</option>
                                      <option value="Washing">Washing</option>
                                      <option value="OtherReimbursement">Other Reimbursement</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Salary (₹) *</label>
                                    <input
                                      type="number"
                                      value={slab.salaryMin}
                                      onChange={(e) => handleUpdateSlab(index, 'salaryMin', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 700000"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Salary (₹) *</label>
                                    <input
                                      type="number"
                                      value={slab.salaryMax}
                                      onChange={(e) => handleUpdateSlab(index, 'salaryMax', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 1000000"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Value (₹) *</label>
                                    <input
                                      type="number"
                                      value={slab.value}
                                      onChange={(e) => handleUpdateSlab(index, 'value', parseFloat(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., 30000"
                                    />
                                  </div>

                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                      type="text"
                                      value={slab.description}
                                      onChange={(e) => handleUpdateSlab(index, 'description', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="e.g., Leave Travel Assistance"
                                    />
                                  </div>

                                  <div className="col-span-2 flex justify-end">
                                    <button
                                      onClick={() => handleRemoveSlab(index)}
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
                        setIsEditTemplateModalOpen(false);
                        setEditMode('basic');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Template"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Create Modal */}
            {isBulkCreateModalOpen && (
              <div className="fixed inset-0   bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">Bulk Create CTC Annexures</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {bulkForm.employees.map((emp, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Employee ID *</label>
                              <input
                                type="text"
                                value={emp.employeeId}
                                onChange={(e) => updateBulkEmployee(index, 'employeeId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="EMP001"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Annual CTC (₹) *</label>
                              <input
                                type="number"
                                value={emp.annualCTC}
                                onChange={(e) => updateBulkEmployee(index, 'annualCTC', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1200000"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => removeBulkEmployee(index)}
                                disabled={bulkForm.employees.length === 1}
                                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addBulkEmployee}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded hover:border-gray-400 transition-colors text-gray-600"
                      >
                        + Add Another Employee
                      </button>
                    </div>
                  </div>

                  <div className="border-t p-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsBulkCreateModalOpen(false);
                        setBulkForm({ employees: [{ employeeId: "", annualCTC: "" }] });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkCreate}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create All"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Update Annexure Modal */}
            {isUpdateAnnexureModalOpen && selectedAnnexure && (
              <div className="fixed inset-0   bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl">
                  <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">Update CTC Annexure</h2>
                    <p className="text-gray-600 mt-1">
                      Employee: {selectedAnnexure.employee?.name} ({selectedAnnexure.employee?.employeeId})
                    </p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual CTC (₹) *
                      </label>
                      <input
                        type="number"
                        value={updateForm.annualCTC}
                        onChange={(e) => setUpdateForm({...updateForm, annualCTC: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Financial Year
                      </label>
                      <input
                        type="text"
                        value={updateForm.financialYear}
                        onChange={(e) => setUpdateForm({...updateForm, financialYear: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="updateIncludeFlexiBenefits"
                        checked={updateForm.includeFlexiBenefits}
                        onChange={(e) => setUpdateForm({...updateForm, includeFlexiBenefits: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="updateIncludeFlexiBenefits" className="text-sm text-gray-700">
                        Include Flexi Benefits
                      </label>
                    </div>
                  </div>

                  <div className="border-t p-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsUpdateAnnexureModalOpen(false);
                        setSelectedAnnexure(null);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateAnnexure}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Annexure"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View Annexure Modal */}
            {isViewModalOpen && selectedAnnexure && (
              <div className="fixed inset-0   backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">CTC Annexure Details</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Employee Name</p>
                        <p className="font-semibold">
                          {selectedAnnexure.employee?.user?.profile?.firstName + " " + selectedAnnexure.employee?.user?.profile?.lastName }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Employee ID</p>
                        <p className="font-semibold">
                          {selectedAnnexure.employee?.employmentDetails?.employeeId  }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Annual CTC</p>
                        <p className="font-semibold text-lg text-blue-900">
                          {formatCurrency(selectedAnnexure.data?.annualCTC || selectedAnnexure.annualCTC)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Financial Year</p>
                        <p className="font-semibold">
                          {selectedAnnexure.data?.financialYear || selectedAnnexure.financialYear}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Template</p>
                        <p className="font-semibold">
                          {selectedAnnexure.data?.template?.templateName || selectedAnnexure.template?.templateName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          (selectedAnnexure.data?.status || selectedAnnexure.status) === 'Active' 
                            ? "bg-green-100 text-green-700"
                            : (selectedAnnexure.data?.status || selectedAnnexure.status) === 'Approved'
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {selectedAnnexure.data?.status || selectedAnnexure.status}
                        </span>
                      </div>
                    </div>

                    {(selectedAnnexure.data?.hasFlexiBenefits || selectedAnnexure.hasFlexiBenefits) && (
                      <div className="bg-green-50 border border-green-200 rounded p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Flexi Benefits Enabled</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Flexi Amount</p>
                            <p className="font-semibold text-green-700">
                              {formatCurrency(selectedAnnexure.data?.totalFlexiAmount || selectedAnnexure.totalFlexiAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Flexi Status</p>
                            <p className="font-semibold">
                              {selectedAnnexure.data?.flexiDeclaration ? "Declared" : "Not Declared"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Monthly Breakup</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left">Salary Head</th>
                              <th className="px-4 py-2 text-right">Monthly (₹)</th>
                              <th className="px-4 py-2 text-right">Annual (₹)</th>
                              <th className="px-4 py-2 text-left">Calculation Basis</th>
                              <th className="px-4 py-2 text-left">Flexi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedAnnexure.data?.monthlyBreakup || selectedAnnexure.monthlyBreakup || []).map((item, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-2 font-medium">
                                  {item.salaryHead}
                                  {item.isSlabBased && (
                                    <span className="ml-2 text-xs text-blue-600">({item.slabType})</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right">{formatCurrency(item.monthlyAmount)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(item.annualAmount)}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{item.calculationBasis}</td>
                                <td className="px-4 py-2 text-center">
                                  {item.isFlexiComponent ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                      Yes
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {(selectedAnnexure.data?.summary || selectedAnnexure.summary) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Summary</h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded">
                          <div>
                            <p className="text-sm text-gray-600">Fixed Salary</p>
                            <p className="font-semibold">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).fixedSalary)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Flexi Benefits</p>
                            <p className="font-semibold">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).flexiBenefits || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Reimbursement</p>
                            <p className="font-semibold">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).reimbursement)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Benefits</p>
                            <p className="font-semibold">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).benefits)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Gross Earning</p>
                            <p className="font-semibold">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).totalGrossEarning)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Deductions</p>
                            <p className="font-semibold text-red-600">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).totalDeductions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Net Salary</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency((selectedAnnexure.data?.summary || selectedAnnexure.summary).netSalary)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t p-6 flex justify-end">
                    <button
                      onClick={() => setIsViewModalOpen(false)}
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

export default CTCStructure;
