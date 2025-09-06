import React, { useState } from "react";
import { useSelector } from "react-redux";
import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import { employeeEndpoints } from "../services/api";
import * as XLSX from 'xlsx';
import { apiConnector } from "../services/apiConnector";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { monthWiseEmployees } = employeeEndpoints;

const EmployeeMasterReport = () => {
  const loading = useSelector(state => state.permissions.loading);
 const token = useSelector(state => state.auth.token)
  const company = useSelector((state) => state.permissions.company); 

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)
  
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1, // Current month
    year: new Date().getFullYear() // Current year
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value)
    }));
  };

  const fetchEmployees = async () => {
    try {
      setIsGenerating(true);
      
      // Build the URL with path parameters based on your route structure
      // Route: /monthWiseEmployees/:year/:month/:companyId
      const apiUrl = `${monthWiseEmployees}${formData.year}/${formData.month}/${company._id}`;
      
      console.log('API URL:', apiUrl);
      console.log('Request params:', {
        year: formData.year,
        month: formData.month,
        companyId: company._id
      });
      
      

      const data = await apiConnector('GET',apiUrl,null,{
        'Authorization': `Bearer ${token}`,
      })

      
        console.log(data)
      


      
    
        setEmployees(data.data.employees || []);
        setReportGenerated(true);
        
        if (data.employees?.length === 0) {
          toast.error(`No employees found for ${months.find(m => m.value === formData.month)?.label} ${formData.year}`);
        }
     
    } catch (error) {
      console.error('Error fetching employees:', error);
      
      
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatBoolean = (value) => {
    return value ? 'Yes' : 'No';
  };

  const prepareExcelData = () => {
    return employees.map((employee, index) => ({
      "Sr.no.": index + 1,
      "employeeId": employee.employmentDetails?.employeeId || '',
      "fullName": employee.user ? `${employee.user.profile?.firstName || ''} ${employee.user.profile?.lastName || ''}`.trim() : '',
      "gender": employee.personalDetails?.gender || '',
      "status": employee.employmentDetails?.status || '',
      "dateOfBirth": formatDate(employee.personalDetails?.dateOfBirth),
      "dateOfJoining": formatDate(employee.employmentDetails?.joiningDate),
      "resignationDate": formatDate(employee.employmentDetails?.resignationDate),
      "lastWorkingDate": formatDate(employee.employmentDetails?.lastWorkingDate),
      "department": employee.user?.profile?.department || employee.employmentDetails?.department || '',
      "designation": employee.user?.profile?.designation || employee.employmentDetails?.designation || '',
      "employmentType": employee.employmentDetails?.employmentType || '',
      "workLocation": employee.employmentDetails?.workLocation || '',
      "city": employee.personalDetails?.city || '',
      "state": employee.personalDetails?.state || '',
      "panNo": employee.personalDetails?.panNo || '',
      "aadharNo": employee.personalDetails?.aadharNo || '',
      "uanNo": employee.personalDetails?.uanNo || '',
      "esicNo": employee.personalDetails?.esicNo || '',
      "bankAccountNo": employee.personalDetails?.bankAccountNo || '',
      "ifscCode": employee.personalDetails?.ifscCode || '',
      "officialEmail": employee.user?.email || '',
      "personalEmail": employee.personalDetails?.personalEmail || '',
      "officialMobile": employee.user?.profile?.phone || employee.personalDetails?.officialMobile || '',
      "personalMobile": employee.personalDetails?.personalMobile || '',
      "costCenter": employee.employmentDetails?.costCenter || '',
      "businessArea": employee.employmentDetails?.businessArea || '',
      "pfFlag": formatBoolean(employee.employmentDetails?.pfFlag),
      "esicFlag": formatBoolean(employee.employmentDetails?.esicFlag),
      "ptFlag": formatBoolean(employee.employmentDetails?.ptFlag)
    }));
  };

  const downloadExcel = () => {
    try {
      const excelData = prepareExcelData();
      
      if (excelData.length === 0) {
        alert('No data available to download');
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },  // Sr.no.
        { wch: 15 }, // employeeId
        { wch: 25 }, // fullName
        { wch: 10 }, // gender
        { wch: 12 }, // status
        { wch: 15 }, // dateOfBirth
        { wch: 15 }, // dateOfJoining
        { wch: 15 }, // resignationDate
        { wch: 15 }, // lastWorkingDate
        { wch: 20 }, // department
        { wch: 20 }, // designation
        { wch: 15 }, // employmentType
        { wch: 20 }, // workLocation
        { wch: 15 }, // city
        { wch: 15 }, // state
        { wch: 15 }, // panNo
        { wch: 15 }, // aadharNo
        { wch: 15 }, // uanNo
        { wch: 15 }, // esicNo
        { wch: 20 }, // bankAccountNo
        { wch: 15 }, // ifscCode
        { wch: 30 }, // officialEmail
        { wch: 30 }, // personalEmail
        { wch: 15 }, // officialMobile
        { wch: 15 }, // personalMobile
        { wch: 15 }, // costCenter
        { wch: 15 }, // businessArea
        { wch: 10 }, // pfFlag
        { wch: 10 }, // esicFlag
        { wch: 10 }  // ptFlag
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Master Report');

      // Generate filename
      const monthName = months.find(m => m.value === formData.month)?.label || formData.month;
      const filename = `Employee_Master_Report_${monthName}_${formData.year}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Error generating Excel file');
    }
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
          <div className="flex w-[full] h-[92vh] justify-center items-center">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Employee Master Report
              </h1>

              {/* Form Section */}
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Generate Report
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Month
                      </label>
                      <select
                        name="month"
                        value={formData.month}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isGenerating}
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Year
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2020"
                        max="2030"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isGenerating}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={fetchEmployees}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGenerating ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </span>
                        ) : (
                          'Generate Report'
                        )}
                      </button>
                    </div>

                    {reportGenerated && employees.length > 0 && (
                      <div className="flex items-end">
                        <button
                          onClick={downloadExcel}
                          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        >
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Excel
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {reportGenerated && (
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      Report Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                        <div className="text-sm text-gray-600">Total Employees</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {months.find(m => m.value === formData.month)?.label}
                        </div>
                        <div className="text-sm text-gray-600">Selected Month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formData.year}</div>
                        <div className="text-sm text-gray-600">Selected Year</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee List Preview */}
              {reportGenerated && employees.length > 0 && (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Employee List Preview (First 10 records)
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.No.</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employees.slice(0, 10).map((employee, index) => (
                          <tr key={employee._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.employmentDetails?.employeeId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.user ? `${employee.user.profile?.firstName || ''} ${employee.user.profile?.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.user?.profile?.department || employee.employmentDetails?.department || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.user?.profile?.designation || employee.employmentDetails?.designation || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(employee.employmentDetails?.joiningDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                employee.employmentDetails?.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : employee.employmentDetails?.status === 'inactive'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {employee.employmentDetails?.status || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {employees.length > 10 && (
                      <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600">
                        Showing 10 of {employees.length} employees. Download Excel file for complete data.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {reportGenerated && employees.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">
                    No employees found for the selected month and year.
                  </div>
                  <div className="text-gray-400 text-sm mt-2">
                    Try selecting a different month or year.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeMasterReport;