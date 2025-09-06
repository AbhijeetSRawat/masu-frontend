import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../slices/companyPermission";
import { apiConnector } from "../services/apiConnector";
import { resignationEndpoints } from "../services/api";
import toast from "react-hot-toast";
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeHeader from "../components/EmployeeHeader";

const { APPLY_FOR_RESIGNATION, WITHDRAW_RESIGNATION, GET_EMPLOYEE_RESIGNATION } = resignationEndpoints;

const EmployeeResignation = () => {
  const company = useSelector((state) => state.permissions.company);
  const user = useSelector((state) => state.employees.reduxEmployee);
  const loading = useSelector((state) => state.permissions.loading);
  const token = useSelector(state => state.auth.token);
  const dispatch = useDispatch();

  const [resignations, setResignations] = useState([]);
  const [hasResignation, setHasResignation] = useState(false);
  const [currentResignation, setCurrentResignation] = useState(null);
  const [canApplyNew, setCanApplyNew] = useState(true);
  const [showWithdrawButton, setShowWithdrawButton] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resignationForm, setResignationForm] = useState({
    resignationDate: "",
    reason: "",
    feedback: ""
  });

  // Get current resignation status
  const getResignationData = async () => {
    try {
      dispatch(setLoading(true));
      const res = await apiConnector("GET", `${GET_EMPLOYEE_RESIGNATION}${user.employeeId}`, null, {
        "Authorization": `Bearer ${token}`
      });

      console.log(res);
      
      if (res.data.hasResignation && res.data.resignations.length > 0) {
        const allResignations = res.data.resignations;
        setResignations(allResignations);
        setHasResignation(true);
        
        // Find current active resignation (pending or approved)
        const activeResignation = allResignations.find(r => 
          r.status === 'pending' || r.status === 'approved'
        );
        
        if (activeResignation) {
          setCurrentResignation(activeResignation);
          setCanApplyNew(false);
          setShowWithdrawButton(activeResignation.status === 'pending');
        } else {
          setCurrentResignation(null);
          setCanApplyNew(true);
          setShowWithdrawButton(false);
        }
      } else {
        setHasResignation(false);
        setResignations([]);
        setCurrentResignation(null);
        setCanApplyNew(true);
        setShowWithdrawButton(false);
      }
    } catch (error) {
      console.log("Error fetching resignation data:", error);
      setHasResignation(false);
      setResignations([]);
      setCurrentResignation(null);
      setCanApplyNew(true);
      setShowWithdrawButton(false);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Apply for resignation
  const handleApplyResignation = async (e) => {
    e.preventDefault();
    
    if (!resignationForm.resignationDate || !resignationForm.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      dispatch(setLoading(true));
      const res = await apiConnector("POST", APPLY_FOR_RESIGNATION, resignationForm, {
        "Authorization": `Bearer ${token}`
      });
      
      toast.success("Resignation applied successfully!");
      setIsApplyModalOpen(false);
      setResignationForm({ resignationDate: "", reason: "", feedback: "" });
      getResignationData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply resignation");
      console.log(error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Withdraw resignation
  const handleWithdrawResignation = async () => {
    if (!window.confirm("Are you sure you want to withdraw your resignation?")) {
      return;
    }

    try {
      dispatch(setLoading(true));
      const res = await apiConnector("PATCH", `${WITHDRAW_RESIGNATION}${currentResignation._id}`, {}, {
        "Authorization": `Bearer ${token}`
      });
      
      toast.success("Resignation withdrawn successfully!");
      getResignationData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to withdraw resignation");
      console.log(error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResignationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    if (user) {
      getResignationData();
    }
  }, [user]);

  return (
    <div className="flex">
      <EmployeeSidebar />
      <div className="w-full lg:ml-[20vw] lg:w-[80vw]">
        <EmployeeHeader />

        {loading ? (
          <div className="h-[92vh] flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="w-full flex justify-center text-3xl font-bold text-gray-800 py-4">
              My Resignation
            </div>

            <div className="px-6 mt-4">
              <div className="max-w-6xl mx-auto">
                
                {/* Current Active Resignation Section */}
                {currentResignation && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Current Resignation</h2>
                        <p className="text-sm text-gray-600 mt-1">Active resignation application</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${getStatusColor(currentResignation.status)}`}>
                        {currentResignation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Application Date
                          </label>
                          <p className="text-gray-900">
                            {formatDate(currentResignation.createdAt)}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resignation Date
                          </label>
                          <p className="text-gray-900">
                            {formatDate(currentResignation.resignationDate)}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proposed Last Working Date
                          </label>
                          <p className="text-gray-900">
                            {formatDate(currentResignation.proposedLastWorkingDate)}
                          </p>
                        </div>

                        {currentResignation.actualLastWorkingDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Actual Last Working Date
                            </label>
                            <p className="text-gray-900">
                              {formatDate(currentResignation.actualLastWorkingDate)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Resignation
                          </label>
                          <p className="text-gray-900 p-3 bg-gray-50 rounded border">
                            {currentResignation.reason}
                          </p>
                        </div>

                        {currentResignation.feedback && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Additional Feedback
                            </label>
                            <p className="text-gray-900 p-3 bg-gray-50 rounded border">
                              {currentResignation.feedback}
                            </p>
                          </div>
                        )}

                        {currentResignation.approvalDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {currentResignation.status === 'rejected' ? 'Rejection Date' : 'Approval Date'}
                            </label>
                            <p className="text-gray-900">
                              {formatDate(currentResignation.approvalDate)}
                            </p>
                          </div>
                        )}

                        {/* ✅ NEW: Show approver/rejector information */}
                        {currentResignation.approvedBy && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {currentResignation.status === 'rejected' ? 'Rejected By' : 'Approved By'}
                            </label>
                            <div className="p-3 bg-gray-50 rounded border">
                              <p className="text-gray-900 font-medium">
                                {currentResignation.approvedBy.profile?.firstName && currentResignation.approvedBy.profile?.lastName
                                  ? `${currentResignation.approvedBy.profile.firstName} ${currentResignation.approvedBy.profile.lastName}`
                                  : "Administrator"}
                              </p>
                              {currentResignation.approvedBy.profile?.designation && (
                                <p className="text-sm text-gray-600">
                                  {currentResignation.approvedBy.profile.designation}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ✅ NEW: Show rejection reason if status is rejected */}
                    {currentResignation.status === 'rejected' && currentResignation.rejectionReason && (
                      <div className="mt-6 pt-6 border-t">
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Rejection Reason
                        </label>
                        <div className="bg-red-50 border border-red-200 rounded p-4">
                          <p className="text-red-800 font-medium mb-2">{currentResignation.rejectionReason}</p>
                          {currentResignation.approvedBy && (
                            <div className="pt-2 border-t border-red-200">
                              <p className="text-sm text-red-600">
                                <span className="font-medium">Rejected by:</span> {currentResignation.approvedBy.profile?.firstName && currentResignation.approvedBy.profile?.lastName
                                  ? `${currentResignation.approvedBy.profile.firstName} ${currentResignation.approvedBy.profile.lastName}`
                                  : "Administrator"}
                                {currentResignation.approvalDate && (
                                  <span className="ml-2">
                                    on {formatDate(currentResignation.approvalDate)}
                                  </span>
                                )}
                              </p>
                              {currentResignation.approvedBy.profile?.designation && (
                                <p className="text-xs text-red-500 mt-1">
                                  {currentResignation.approvedBy.profile.designation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Section */}
                    <div className="mt-6 pt-6 border-t">
                      {currentResignation.status === 'pending' && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            Your resignation is pending approval from HR/Admin.
                          </p>
                          {showWithdrawButton && (
                            <button
                              onClick={handleWithdrawResignation}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                            >
                              Withdraw Resignation
                            </button>
                          )}
                        </div>
                      )}

                      {currentResignation.status === 'approved' && (
                        <div className="bg-green-50 border border-green-200 rounded p-4">
                          <div className="flex">
                            <svg className="flex-shrink-0 h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                Resignation Approved
                              </h3>
                              <p className="text-sm text-green-700 mt-1">
                                Your resignation has been approved. Please coordinate with HR for the exit process.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ✅ NEW: Rejection status message */}
                      {currentResignation.status === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded p-4">
                          <div className="flex">
                            <svg className="flex-shrink-0 h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Resignation Rejected
                              </h3>
                              <p className="text-sm text-red-700 mt-1">
                                Your resignation has been rejected. Please review the rejection reason above and contact HR if you have any questions.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Apply for New Resignation Section */}
                {canApplyNew && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="text-center">
                      <div className="mb-4">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {hasResignation ? "Apply for New Resignation" : "No Active Resignation"}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {hasResignation 
                          ? "You don't have any active resignation application. You can apply for a new resignation if needed."
                          : "You haven't applied for resignation yet. If you're planning to leave, you can submit your resignation application here."
                        }
                      </p>
                      <button
                        onClick={() => setIsApplyModalOpen(true)}
                        className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        Apply for Resignation
                      </button>
                    </div>
                  </div>
                )}

                {/* Previous Resignations History */}
                {hasResignation && resignations.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Resignation History</h3>
                    
                    {resignations.length === 0 ? (
                      <p className="text-gray-600 text-center py-4">No resignation history found.</p>
                    ) : (
                      <div className="space-y-4">
                        {resignations.map((resignation, index) => (
                          <div 
                            key={resignation._id} 
                            className={`border rounded-lg p-4 ${
                              resignation._id === currentResignation?._id 
                                ? 'bg-blue-50 border-blue-200' 
                                : resignation.status === 'rejected'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600">
                                  #{resignations.length - index}
                                </span>
                                {resignation._id === currentResignation?._id && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                    Current
                                  </span>
                                )}
                                {/* ✅ NEW: Rejection indicator */}
                                {resignation.status === 'rejected' && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                    Rejected
                                  </span>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(resignation.status)}`}>
                                {resignation.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Applied:</span>
                                <span className="ml-2 text-gray-900">{formatDate(resignation.createdAt)}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Resignation Date:</span>
                                <span className="ml-2 text-gray-900">{formatDate(resignation.resignationDate)}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Last Working Date:</span>
                                <span className="ml-2 text-gray-900">
                                  {resignation.actualLastWorkingDate 
                                    ? formatDate(resignation.actualLastWorkingDate)
                                    : formatDate(resignation.proposedLastWorkingDate)
                                  }
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <span className="font-medium text-gray-700 text-sm">Reason:</span>
                              <p className="text-gray-900 text-sm mt-1 p-2 bg-white rounded border">
                                {resignation.reason}
                              </p>
                            </div>

                            {resignation.feedback && (
                              <div className="mt-2">
                                <span className="font-medium text-gray-700 text-sm">Feedback:</span>
                                <p className="text-gray-900 text-sm mt-1 p-2 bg-white rounded border">
                                  {resignation.feedback}
                                </p>
                              </div>
                            )}

                            {/* ✅ NEW: Show rejection reason in history */}
                            {resignation.status === 'rejected' && resignation.rejectionReason && (
                              <div className="mt-2">
                                <span className="font-medium text-red-700 text-sm">
                                  <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Rejection Reason:
                                </span>
                                <p className="text-red-800 text-sm mt-1 p-2 bg-red-50 rounded border border-red-200">
                                  {resignation.rejectionReason}
                                </p>
                                {resignation.approvedBy && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Rejected by: {resignation.approvedBy.profile?.firstName && resignation.approvedBy.profile?.lastName
                                      ? `${resignation.approvedBy.profile.firstName} ${resignation.approvedBy.profile.lastName}`
                                      : "Administrator"}
                                  </p>
                                )}
                              </div>
                            )}

                            {resignation.approvalDate && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium text-gray-700">
                                  {resignation.status === 'rejected' ? 'Rejected on:' : 'Approved on:'}
                                </span>
                                <span className="ml-2 text-gray-900">{formatDate(resignation.approvalDate)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Apply Resignation Modal */}
        {isApplyModalOpen && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Apply for Resignation</h2>
              
              <form onSubmit={handleApplyResignation}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resignation Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="resignationDate"
                      value={resignationForm.resignationDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the date you wish to submit your resignation
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Resignation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="reason"
                      value={resignationForm.reason}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide your reason for resignation..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Feedback (Optional)
                    </label>
                    <textarea
                      name="feedback"
                      value={resignationForm.feedback}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional feedback or comments..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <div className="flex">
                      <svg className="flex-shrink-0 h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Important Information
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Your last working date will be calculated based on your notice period. 
                          This application will be sent to HR/Admin for approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      setResignationForm({ resignationDate: "", reason: "", feedback: "" });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Resignation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeResignation;
