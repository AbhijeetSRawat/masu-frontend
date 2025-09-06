import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import AdminSidebar from "../components/AdminSidebar";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { reimbursementsEndpoints } from "../services/api";
import toast from "react-hot-toast";
import AdminHeader from "../components/AdminHeader";
import SubAdminSidebar from "../components/SubAdminSidebar";
import SubAdminHeader from "../components/SubAdminHeader";

const { 
  GET_COMPANY_REIMBURSEMENTS, 
  UPDATE_REIMBURSEMENTS_STATUS,
  BULK_UPDATE_REIMBURSEMENT_STATUS
} = reimbursementsEndpoints;

const ReimbursementReport = () => {
  const loading = useSelector((state) => state.permissions.loading);
  const company = useSelector((state) => state.permissions.company);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

    const role = useSelector( state => state.auth.role)
    const subAdminPermissions = useSelector(state => state.permissions.subAdminPermissions)

  const [allReimbursements, setAllReimbursements] = useState([]); // Store all data
  const [selectedStatus, setSelectedStatus] = useState(""); // Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [bulkAction, setBulkAction] = useState(""); // 'approved', 'rejected', or 'paid'
  const [bulkReason, setBulkReason] = useState("");

  // Properly filter data using useMemo
  const filteredReimbursements = useMemo(() => {
    if (!selectedStatus || selectedStatus === "") {
      return allReimbursements;
    }
    return allReimbursements.filter(item => item.status === selectedStatus);
  }, [selectedStatus, allReimbursements]);

  // Paginate the filtered data
  const paginatedReimbursements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReimbursements.slice(startIndex, endIndex);
  }, [filteredReimbursements, currentPage, itemsPerPage]);

  // Update pagination info when filtered data changes
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredReimbursements.length / itemsPerPage);
    setTotalPages(newTotalPages);
    setTotalCount(filteredReimbursements.length);
    
    // Reset to page 1 if current page is beyond new total pages
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
    
    // Reset selections when filter changes
    setSelectedIds([]);
    setSelectAll(false);
  }, [filteredReimbursements, itemsPerPage, currentPage]);

  // Fetch all reimbursements data
  const getCompanyReimbursements = async () => {
    try {
      dispatch(setLoading(true));

      console.log("reimbursement token is : ", token);

      const result = await apiConnector(
        "GET", 
        `${GET_COMPANY_REIMBURSEMENTS}${company._id}`, 
        null, 
        {
          Authorization: `Bearer ${token}`,
        }
      );
      
      setAllReimbursements(result.data.data || []); // Store all data
      setCurrentPage(1); // Reset to first page
      console.log(result);
      toast.success("Reimbursements fetched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Unable to fetch reimbursements!");
      setAllReimbursements([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    const newStatus = status === "all" ? "" : status;
    setSelectedStatus(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Handle individual selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      // Update selectAll state based on selection
      setSelectAll(newSelection.length === paginatedReimbursements.length);
      return newSelection;
    });
  };

  // Handle select all for current page
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const currentPageIds = paginatedReimbursements.map(item => item._id);
      setSelectedIds(currentPageIds);
      setSelectAll(true);
    }
  };

  // Open bulk modal
  const openBulkModal = (action) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one reimbursement");
      return;
    }
    setBulkAction(action);
    setBulkReason("");
    setIsBulkModalOpen(true);
  };

  // Handle bulk action
  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one reimbursement");
      return;
    }

    if (bulkAction === 'rejected' && !bulkReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      dispatch(setLoading(true));
      
      const payload = {
        ids: selectedIds,
        status: bulkAction,
        ...(bulkAction === 'rejected' && { reason: bulkReason })
      };

      const response = await apiConnector(
        "PATCH",
        BULK_UPDATE_REIMBURSEMENT_STATUS,
        payload,
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      toast.success(`${selectedIds.length} reimbursements ${bulkAction} successfully!`);
      setSelectedIds([]);
      setSelectAll(false);
      setIsBulkModalOpen(false);
      setBulkReason("");
      getCompanyReimbursements(); // Refresh data
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${bulkAction} reimbursements`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update individual status
  const updateStatus = async (newStatus) => {
    try {
      dispatch(setLoading(true));
      
      const response = await apiConnector(
        "PUT",
        `${UPDATE_REIMBURSEMENTS_STATUS}${selectedReimbursement._id}`,
        { status: newStatus },
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      );

      console.log(response);
      toast.success(`Status updated to ${newStatus}`);
      getCompanyReimbursements(); // Refresh data
      setIsViewModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'paid': return 'text-blue-600 bg-blue-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  useEffect(() => {
    if (company?._id && token) {
      getCompanyReimbursements();
    }
  }, [company, token]);

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


        <div className="px-6 mt-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Reimbursement Management</h1>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {["All", "Pending", "Approved", "Paid", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status.toLowerCase())}
                className={`px-4 py-2 rounded border ${
                  selectedStatus === (status === "All" ? "" : status.toLowerCase())
                    ? "bg-blue-900 text-white"
                    : "bg-white text-blue-900 border-blue-900"
                } hover:opacity-90 transition`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Items per page selector and stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Show:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">entries</span>
            </div>
            
            <div className="text-sm text-gray-700">
              {selectedStatus && (
                <span className="mr-4">
                  Filtered: <span className="font-medium">{filteredReimbursements.length}</span> {selectedStatus} items
                </span>
              )}
              Total: <span className="font-medium">{allReimbursements.length}</span> entries
            </div>
          </div>

          {/* Bulk Action Buttons */}
          {selectedIds.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-800 font-medium">
                  {selectedIds.length} reimbursement{selectedIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openBulkModal('approved')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => openBulkModal('rejected')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => openBulkModal('paid')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => {
                    setSelectedIds([]);
                    setSelectAll(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-[70vh]">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Reimbursements Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Sr. No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedReimbursements.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-lg font-medium">
                                No {selectedStatus || 'reimbursements'} found
                              </p>
                              <p className="text-sm">
                                {selectedStatus 
                                  ? `No ${selectedStatus} reimbursement requests match your current filters.`
                                  : 'No reimbursement requests available.'
                                }
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedReimbursements.map((item, index) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item._id)}
                                onChange={() => toggleSelection(item._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.category?.name || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">
                                  {item.employee?.user?.profile?.firstName} {item.employee?.user?.profile?.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.employee?.user?.profile?.email || item.employee?.user?.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{item.amount?.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(item.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition-colors"
                                onClick={() => {
                                  setSelectedReimbursement(item);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    {/* Mobile pagination */}
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    
                    {/* Desktop pagination */}
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                          <span className="font-medium">{totalCount}</span> results
                          {selectedStatus && <span className="ml-2 text-blue-600">({selectedStatus} filter applied)</span>}
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + Math.max(1, currentPage - 2);
                            if (page > totalPages) return null;
                            
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bulk Action Modal */}
        {isBulkModalOpen && (
          <div className="fixed inset-0    bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Bulk {bulkAction === 'approved' ? 'Approve' : bulkAction === 'rejected' ? 'Reject' : 'Mark as Paid'} Reimbursements
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="font-semibold text-gray-800">
                  You are about to {bulkAction === 'approved' ? 'approve' : bulkAction === 'rejected' ? 'reject' : 'mark as paid'} {selectedIds.length} reimbursement{selectedIds.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. Please confirm your decision.
                </p>
              </div>

              {bulkAction === 'rejected' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Bulk Rejection Reason <span className="text-red-500"> *</span>
                    </label>
                    <textarea
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter rejection reason for all selected reimbursements..."
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={loading || (bulkAction === 'rejected' && !bulkReason.trim())}
                  className={`px-6 py-2 rounded transition-colors disabled:opacity-50 ${
                    bulkAction === 'approved'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : bulkAction === 'rejected'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {loading ? "Processing..." : `Confirm ${bulkAction === 'approved' ? 'Approve' : bulkAction === 'rejected' ? 'Reject' : 'Mark as Paid'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View/Details Modal */}
        {isViewModalOpen && selectedReimbursement && (
          <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Reimbursement Details</h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Employee Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Employee Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">
                      {selectedReimbursement.employee?.user?.profile?.firstName} {selectedReimbursement.employee?.user?.profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedReimbursement.employee?.user?.profile?.email || selectedReimbursement.employee?.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <p className="text-gray-900">{selectedReimbursement.employee?.employmentDetails?.department || "N/A"}</p>
                  </div>
                </div>

                {/* Reimbursement Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Reimbursement Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900">{selectedReimbursement.category?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <p className="text-gray-900 font-bold text-lg">₹{selectedReimbursement.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-gray-900">{new Date(selectedReimbursement.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedReimbursement.status)}`}>
                      {selectedReimbursement.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedReimbursement.description && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <div className="bg-gray-50 border rounded p-3">
                      <p className="text-gray-900">{selectedReimbursement.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt */}
              {selectedReimbursement.receiptUrl && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                    <div className="border rounded p-3 bg-gray-50">
                      <a 
                        href={selectedReimbursement.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        📄 View Receipt Document
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>

                {selectedReimbursement.status === "pending" && (
                  <>
                    <button
                      className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                      onClick={() => updateStatus("approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                      onClick={() => updateStatus("rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedReimbursement.status === "approved" && (
                  <button
                    className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-900 transition-colors"
                    onClick={() => updateStatus("paid")}
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReimbursementReport;
