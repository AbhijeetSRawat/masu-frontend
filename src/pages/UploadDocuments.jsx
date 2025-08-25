import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { employeeEndpoints } from '../services/api';
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";

import { Upload, X, FileText, AlertCircle, CheckCircle,  Eye } from 'lucide-react';
import { apiConnector } from '../services/apiConnector';
import { setLoading } from '../slices/authSlice';

const { uploadDocument, getEmployeeDocument } = employeeEndpoints;

const UploadDocuments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const employee = useSelector((state) => state.employees.reduxEmployee);
  const role = useSelector((state) => state.auth.role);
  const token = useSelector(state => state.auth.token)
  const company = useSelector((state) => state.permissions.company);

  const loading = useSelector(state => state.auth.loading)
  
  // Single document input instead of array
  const [documentInput, setDocumentInput] = useState({
    documentName: '',
    files: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Add this state for required documents
  const [requiredDocuments, setRequiredDocuments] = useState([]);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  const validateFile = (file) => {
    const errors = [];
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name} exceeds 2MB size limit`);
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name} has invalid file type. Only JPEG, PNG, and PDF are allowed`);
    }
    
    return errors;
  };

  const getDocuments = async () => {
    try {
      dispatch(setLoading(true));

      const response = await apiConnector("GET", getEmployeeDocument + employee.employeeId, null, {
        "Authorization": `Bearer ${token}`
      });
      
      console.log("documents response: ", response);
      
      if (response.data.success && response.data.documents) {
        setExistingDocuments(response.data.documents);
      }
    } catch (error) {
      console.log("Error fetching documents:", error);
      toast.error('Failed to fetch existing documents');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDocumentNameChange = (name) => {
    setDocumentInput(prev => ({ ...prev, documentName: name }));
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const allErrors = [];
    
    files.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        allErrors.push(...fileErrors);
      }
    });
    
    // Show errors if any files are invalid
    if (allErrors.length > 0) {
      toast.error(allErrors.join('\n'));
    }
    
    // Add valid files to existing files (accumulate multiple files for same document)
    if (validFiles.length > 0) {
      setDocumentInput(prev => ({ 
        ...prev, 
        files: [...prev.files, ...validFiles] 
      }));
      
      toast.success(`${validFiles.length} file(s) added to ${documentInput.documentName || 'document'}`);
    }
    
    // Always clear the input to allow re-selecting same files
    event.target.value = '';
  };

  const removeFile = (fileIndex) => {
    setDocumentInput(prev => {
      const newFiles = [...prev.files];
      newFiles.splice(fileIndex, 1);
      return { ...prev, files: newFiles };
    });
  };

  const isDocumentUploaded = (documentName) => {
    return existingDocuments.some(doc => 
      doc.name.toLowerCase().trim() === documentName.toLowerCase().trim()
    );
  };

  const handleUploadDocument = async () => {
  const { documentName, files } = documentInput;

  if (!documentName.trim()) {
    toast.error('Please enter a document name');
    return;
  }

  if (!files || files.length === 0) {
    toast.error(`Please select files for ${documentName}`);
    return;
  }

  // Check if document exists and is valid
  const existingDoc = existingDocuments.find(doc => 
    doc.name.toLowerCase().trim() === documentName.toLowerCase().trim()
  );
  
  if (existingDoc?.isValid) {
    toast.error('Cannot modify a verified document');
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append('documentName', documentName.trim());

    // ✅ Always treat files as an array
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
      formData.append('files', file);
    });

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 15, 90));
    }, 200);

    const response = await apiConnector(
      "PUT",
      `${uploadDocument}${employee.employeeId}`,
      formData,
      {
        "Authorization": `Bearer ${token}`
      }
    );

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (response.data.success) {
      toast.success(response.data.message);
      setExistingDocuments(response.data.documents);
      setDocumentInput({ documentName: '', files: [] });

      setTimeout(() => {
        setUploadProgress(0);
      }, 1500);
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);

    let errorMessage = 'Upload failed. Please try again.';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.status === 413) {
      errorMessage = 'File size too large. Please reduce file size and try again.';
    }

    toast.error(errorMessage);
    setUploadProgress(0);
  } finally {
    setIsUploading(false);
  }
};


  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const previewFile = (file) => {
    console.log("file is : ", file);
    setPreviewDocument({ url: file.url, type: file.type });
  };

  const closePreview = () => {
    setPreviewDocument(null);
  };

  const handleDeleteDocument = async (documentName) => {
    // TODO: Implement delete functionality
    console.log('Delete document:', documentName);
    toast.info('Delete functionality to be implemented');
  };

  // Add this function to check empty documents
  const checkEmptyDocuments = () => {
    const emptyDocs = existingDocuments.filter(doc => !doc.files || doc.files.length === 0);
    if (emptyDocs.length > 0) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-yellow-700 font-medium">Required Documents Missing</p>
              <p className="text-yellow-600 text-sm mt-1">
                Please upload files for the following documents:
              </p>
              <ul className="list-disc list-inside text-yellow-600 text-sm mt-1">
                {emptyDocs.map((doc, index) => (
                  <li key={index}>{doc.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Update the document name dropdown to use required documents
  const documentNameInput = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Document Type Name *
      </label>
      <select
        value={documentInput.documentName}
        onChange={(e) => handleDocumentNameChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={isUploading}
      >
        <option value="">Select Document Type</option>
        {existingDocuments.map((doc, index) => (
          // Show document in dropdown if it's not valid or pending
          (!doc.files || doc.files.length === 0 || !doc.isValid) && (
            <option key={index} value={doc.name}>
              {doc.name} {doc.validatedBy ? '(Invalid)' : doc.files?.length > 0 ? '(Pending)' : '(Required)'}
            </option>
          )
        ))}
      </select>
    </div>
  );

  useEffect(() => {
    if (employee?.employeeId) {
      getDocuments();
    }
  }, [employee?.employeeId]);

  if (!employee) {
    return (
      <div className="flex">
        <EmployeeSidebar />
        <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
          <EmployeeHeader />
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Not Found</h3>
              <p className="text-gray-500">Please select an employee to upload documents.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:w-[80vw] lg:ml-[20vw]">
        <EmployeeHeader />
        
        <div className="p-6">
          {/* Add the warning message for empty documents */}
          {checkEmptyDocuments()}

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Upload</h1>
            <p className="text-gray-600">
              Employee: {employee.user?.name} ({employee.employmentDetails?.employeeId})
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <p>Max file size: 2MB per file • Allowed types: JPEG, PNG, PDF</p>
              <p className="text-blue-600 font-medium">📄 Each document type can have multiple files (e.g., front & back of Aadhar card)</p>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h2>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Replace the text input with the select dropdown */}
                {documentNameInput()}

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Files for this Document *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can select multiple files or add more files later. Files will be added to this document type.
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading {documentInput.documentName} ({documentInput.files.length} files)...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Selected Files */}
              {documentInput.files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Files for {documentInput.documentName || 'this document'} ({documentInput.files.length}):
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {documentInput.files.map((file, fileIndex) => (
                      <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          onClick={() => removeFile(fileIndex)}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={isUploading}
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleUploadDocument}
                  disabled={isUploading || !documentInput.documentName.trim() || documentInput.files.length === 0}
                  className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                    isUploading || !documentInput.documentName.trim() || documentInput.files.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : `Upload ${documentInput.documentName || 'Document'}`}
                  {documentInput.files.length > 0 && ` (${documentInput.files.length} files)`}
                </button>
              </div>
            </div>
          </div>

          {/* Existing Documents */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading documents...</div>
              </div>
            </div>
          ) : existingDocuments.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
              
              <div className="grid gap-4">
                {existingDocuments.map((document, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">
                        {document.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {document.files?.length} file(s)
                        </span>
                        {document.isValid ? (
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            Verified ✓
                          </span>
                        ) : document.validatedBy ? (
                          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                            Invalid ✗
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      {document.files?.map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(file.type)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                File {fileIndex + 1}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded: {formatDate(file.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => previewFile(file)}
                              className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                              title="Preview file"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Only show delete button for invalid documents or admin/hr users */}
                            {(!document.isValid || role === 'admin' || role === 'hr') && (
                              <button
                                onClick={() => handleDeleteDocument(document.name)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                title="Delete document"
                              >
                                
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h3>
                <p className="text-gray-500">Upload your first document using the form above.</p>
              </div>
            </div>
          )}

          {/* File Preview Modal */}
          {previewDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl bg-opacity-75">
              <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-medium">Document Preview</h3>
                  <button
                    onClick={closePreview}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-4">
                  {previewDocument.type === 'application/pdf' ? (
                    <iframe
                      src={previewDocument.url}
                      className="w-full h-96"
                      title="PDF Preview"
                    />
                  ) : (
                    <img
                      src={previewDocument.url}
                      alt="Document Preview"
                      className="max-w-full max-h-96 object-contain mx-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDocuments;