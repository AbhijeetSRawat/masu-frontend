import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import EmployeeSidebar from '../components/EmployeeSidebar';
import EmployeeHeader from '../components/EmployeeHeader';
import { apiConnector } from '../services/apiConnector';
import { payrollEndpoints, employeeEndpoints } from '../services/api';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaClock, FaTimesCircle, FaFileAlt, FaDownload, FaEye, FaInfoCircle } from 'react-icons/fa';

const ApprovalStatus = () => {
  const [declarationStatus, setDeclarationStatus] = useState({
    submitted: false,
    submittedDate: null,
    status: 'Not Submitted',
    approvedBy: null,
    approvedDate: null,
    comments: 'No declaration submitted yet',
    documents: []
  });

  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const employee = useSelector((state) => state.employees.reduxEmployee);

  useEffect(() => {
    if (employee?._id) {
      fetchEmployeeData();
      fetchApprovalStatus();
    }
  }, [employee]);

  const fetchEmployeeData = async () => {
    try {
      const response = await apiConnector(
        "GET",
        `${employeeEndpoints.getEmployeeProfile}${employee._id}`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data?.employee) {
        setEmployeeData(response.data.employee);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to fetch employee data');
    }
  };

  const fetchApprovalStatus = async () => {
    try {
      setLoading(true);
      
      // Check if there's any payroll data (which indicates declaration was submitted)
      const response = await apiConnector(
        "GET",
        `${payrollEndpoints.GET_PAYROLL_HISTORY}${employee._id}?page=1&limit=1`,
        null,
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      if (response.data.payrollHistory && response.data.payrollHistory.length > 0) {
        const payrollData = response.data.payrollHistory[0];
        setDeclarationStatus({
          submitted: true,
          submittedDate: payrollData.createdAt,
          status: 'Under Review',
          approvedBy: 'HR Manager',
          approvedDate: null,
          comments: 'Declaration submitted and under review',
          documents: generateDocumentStatus(payrollData)
        });
      } else {
        setDeclarationStatus({
          submitted: false,
          submittedDate: null,
          status: 'Not Submitted',
          approvedBy: null,
          approvedDate: null,
          comments: 'No declaration submitted yet',
          documents: []
        });
      }
    } catch (error) {
      console.error('Error fetching approval status:', error);
      toast.error('Failed to fetch approval status');
    } finally {
      setLoading(false);
    }
  };

  const generateDocumentStatus = (payrollData) => {
    const documents = [];
    
    // Check if investment declaration exists
    if (payrollData.input_snapshot?.investment_declaration) {
      const declaration = payrollData.input_snapshot.investment_declaration;
      
      // Add documents based on what was declared
      if (declaration.providentFund > 0) {
        documents.push({
          id: 1,
          name: 'Provident Fund Statement',
          type: 'PDF',
          status: 'Under Review',
          submittedDate: payrollData.createdAt,
          approvedDate: null,
          size: '245 KB'
        });
      }
      
      if (declaration.elss > 0) {
        documents.push({
          id: 2,
          name: 'ELSS Investment Proof',
          type: 'PDF',
          status: 'Under Review',
          submittedDate: payrollData.createdAt,
          approvedDate: null,
          size: '1.2 MB'
        });
      }
      
      if (declaration.lifeInsurance > 0) {
        documents.push({
          id: 3,
          name: 'Life Insurance Premium Receipt',
          type: 'PDF',
          status: 'Under Review',
          submittedDate: payrollData.createdAt,
          approvedDate: null,
          size: '890 KB'
        });
      }
      
      if (declaration.medicalInsuranceSelf > 0) {
        documents.push({
          id: 4,
          name: 'Medical Insurance Certificate',
          type: 'PDF',
          status: 'Under Review',
          submittedDate: payrollData.createdAt,
          approvedDate: null,
          size: '567 KB'
        });
      }
      
      if (declaration.homeLoanPrincipal > 0) {
        documents.push({
          id: 5,
          name: 'Home Loan Statement',
          type: 'PDF',
          status: 'Under Review',
          submittedDate: payrollData.createdAt,
          approvedDate: null,
          size: '1.1 MB'
        });
      }
    }
    
    return documents;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'Under Review':
        return <FaClock className="text-yellow-500" />;
      case 'Rejected':
        return <FaTimesCircle className="text-red-500" />;
      case 'Pending':
        return <FaFileAlt className="text-gray-400" />;
      default:
        return <FaFileAlt className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadDocument = (document) => {
    // In a real implementation, this would download the actual document
    console.log('Downloading document:', document.name);
  };

  const viewDocument = (document) => {
    // In a real implementation, this would open the document in a viewer
    console.log('Viewing document:', document.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <EmployeeSidebar />
        <div className="lg:ml-[20vw]">
          <EmployeeHeader />
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading approval status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <EmployeeSidebar />
      <div className="lg:ml-[20vw]">
        <EmployeeHeader />
        
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <FaCheckCircle className="text-green-600" />
                  Investment Approval Status
                </h1>
                <p className="text-gray-600">Track the status of your investment declarations and document approvals</p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className={`rounded-lg p-4 ${
                  declarationStatus.status === 'Approved' ? 'bg-green-50' :
                  declarationStatus.status === 'Under Review' ? 'bg-yellow-50' :
                  declarationStatus.status === 'Rejected' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(declarationStatus.status)}
                    <span className="font-semibold">Overall Status</span>
                  </div>
                  <p className={`text-lg font-bold mt-1 ${
                    declarationStatus.status === 'Approved' ? 'text-green-600' :
                    declarationStatus.status === 'Under Review' ? 'text-yellow-600' :
                    declarationStatus.status === 'Rejected' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {declarationStatus.status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Declaration Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FaFileAlt className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Submitted Date</span>
                </div>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {formatDate(declarationStatus.submittedDate)}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-600" />
                  <span className="font-semibold text-green-800">Approved By</span>
                </div>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {declarationStatus.approvedBy}
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FaClock className="text-purple-600" />
                  <span className="font-semibold text-purple-800">Approved Date</span>
                </div>
                <p className="text-lg font-bold text-purple-600 mt-1">
                  {declarationStatus.approvedDate ? formatDate(declarationStatus.approvedDate) : 'Pending'}
                </p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FaInfoCircle className="text-orange-600" />
                  <span className="font-semibold text-orange-800">Comments</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  {declarationStatus.comments}
                </p>
              </div>
            </div>
          </div>

          {/* Document Status Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Document Status</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {declarationStatus.documents.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaFileAlt className="text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {getStatusIcon(document.status)}
                          <span className="ml-1">{document.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(document.submittedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(document.approvedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.size || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {document.submittedDate && (
                            <>
                              <button
                                onClick={() => viewDocument(document)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Document"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => downloadDocument(document)}
                                className="text-green-600 hover:text-green-900"
                                title="Download Document"
                              >
                                <FaDownload />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Legend */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                <span className="text-sm text-gray-600">Approved - Document verified and accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-yellow-500" />
                <span className="text-sm text-gray-600">Under Review - Being verified by HR</span>
              </div>
              <div className="flex items-center gap-2">
                <FaTimesCircle className="text-red-500" />
                <span className="text-sm text-gray-600">Rejected - Needs resubmission</span>
              </div>
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-gray-400" />
                <span className="text-sm text-gray-600">Pending - Not yet submitted</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {declarationStatus.status !== 'Approved' && (
            <div className="mt-6 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Next Steps</h3>
              <div className="space-y-2 text-blue-700">
                {declarationStatus.status === 'Under Review' && (
                  <p>• Your documents are being reviewed by the HR team</p>
                )}
                {declarationStatus.status === 'Rejected' && (
                  <>
                    <p>• Please resubmit the rejected documents with correct information</p>
                    <p>• Contact HR for specific requirements</p>
                  </>
                )}
                {declarationStatus.status === 'Pending' && (
                  <p>• Please submit all required documents to complete your declaration</p>
                )}
                <p>• You will be notified via email once the review is complete</p>
                <p>• Contact HR if you have any questions about the approval process</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalStatus;
