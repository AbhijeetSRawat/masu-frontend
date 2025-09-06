// const BASE_URL = "http://localhost:4000"
const BASE_URL = "https://masu-backend.onrender.com"

// AUTH ENDPOINTS
export const endpoints = {
  LOGIN_API: BASE_URL + "/api/auth/login",
  FORGET_PASSWORD : BASE_URL + "/api/auth/forgot-password",
  RESET_PASSWORD : BASE_URL + "/api/auth/reset-password/"
  
}

//COMPANY ENDPOINTS
export const companyEndpoints = {
  REGISTER_API: BASE_URL + "/api/company/create",
  COMPANY_LIST_API:BASE_URL + "/api/company/getAllCompanies",
  PERMISSIONS_API : BASE_URL + "/api/company/updatePermissions",
  UPDATE_DETAILS_API : BASE_URL + "/api/company/updateCompanyDetails/",
  ADD_HR : BASE_URL + "/api/company/addHR",
  GET_ALL_MANAGER : BASE_URL + "/api/company/getManager/",
  EDIT_HR : BASE_URL + "/api/company/editHR/",
  GET_COMPANY_DETAILS : BASE_URL + "/api/company/getCompanyDetails/",
  DOWNLOAD_COMPANY_DETAILS : BASE_URL + "/api/company/"
} 

//SHIFT ENDPOINTS
export const shiftEndpoints = {
  ADD_SHIFT: BASE_URL + "/api/shift/add",
  UPDATE_SHIFT : BASE_URL + "/api/shift/update/",
  GET_ALL_SHIFTS : BASE_URL + "/api/shift/getAllShifts/",
}

//DEPARTMENT ENDPOINTS
export const departmentEndpoints = {
  ADD_DEPARTMENT: BASE_URL + "/api/department/create",
  UPDATE_DEPARTMENT : BASE_URL + "/api/department/edit/",
  GET_ALL_DEPARTMENTS : BASE_URL + "/api/department/getAll/",
}

//EMPLOYEE ENDPOINTS
export const employeeEndpoints = {
  ADD_EMPLOYEE : BASE_URL + "/api/employee/addEmployee",
  GET_ALL_EMPLOYEE_BY_COMPANY_ID : BASE_URL + "/api/employee/getallpagination/",
  EDIT_EMPLOYEE : BASE_URL + "/api/employee/edit/",
  CSV_EMPLOYEE_ADD : BASE_URL + "/api/employee/bulk-create",
  getEmployeeProfile : BASE_URL + "/api/employee/getemployee/",
  getEmployeeDocument : BASE_URL + "/api/employee/getEmployeeDocument/",
  updateEmployeeProfile : BASE_URL + "/api/employee/update/",
  monthWiseEmployees : BASE_URL + "/api/employee/monthWiseEmployees/",
  getAllNewJoiners : BASE_URL + "/api/employee/getallnewjoiners/",
  uploadDocument : BASE_URL + "/api/employee/uploadDocument/",
  makeDocumentInvalid : BASE_URL + "/api/employee/makeDocumentInValid/",
  makeDocumentValid : BASE_URL + "/api/employee/makeDocumentValid/",
}

//POLICIES ENDPOINTS
export const policiesEndpoints = {
  ADD_POLICY : BASE_URL + "/api/policies/add",
  GET_POLICIES : BASE_URL + "/api/policies/company/",
  GET_ONE_POLICY : BASE_URL + "/api/policies/",
  UPDATE_POLICY : BASE_URL + "/api/policies/update/",
  DELETE_POLICY : BASE_URL + "/api/policies/delete/"
}

//LEAVE ENDPOINTS
export const leaveEndpoints = {
  APPLY_LEAVE : BASE_URL + "/api/leave/leaves/apply",
  // GET_LEAVE : BASE_URL + "/api/leave/leaves/get/",
  // UPDATE_LEAVE_STATUS : BASE_URL + "/api/leave/update/",
  GET_EMPLOYEE_LEAVES : BASE_URL + "/api/leave/leaves/",
  // GET_COMPANY_LEAVES : BASE_URL + "/api/leave/getCompany/",
  // UPDATE_LEAVE : BASE_URL + "/api/leave/leaves/",
  approveLeave : BASE_URL + "/api/leave/leaves/",
  rejectLeave : BASE_URL + "/api/leave/leaves/",
  cancelLeave : BASE_URL + "/api/leave/leaves/",
  getCompanyLeaves : BASE_URL + "/api/leave/leaves/",
  getApprovedLeavesForCompany : BASE_URL + "/api/leave/approvedleaves/",
  getPendingLeavesForCompany : BASE_URL + "/api/leave/pendingleaves/",
  getCancelledLeavesForCompany : BASE_URL + "/api/leave/cancelledleaves/",
  getRejectedLeavesForCompany : BASE_URL + "/api/leave/rejectedleaves/",
  getRestLeaveofEmployee : BASE_URL + "/api/leave/",
  bulkUpdate : BASE_URL + "/api/leave/bulkupdate"
}

//REIMBURSEMENTS ENDPOINTS
export const reimbursementsEndpoints ={
  CREATE_REIMBURSEMENT : BASE_URL + "/api/reimbursements/",
  GET_COMPANY_REIMBURSEMENTS : BASE_URL + "/api/reimbursements/company/",
  UPDATE_REIMBURSEMENTS_STATUS : BASE_URL + "/api/reimbursements/",
  GET_EMPLOYEE_REIMBURSEMENTS : BASE_URL + "/api/reimbursements/employee/",
  BULK_UPDATE_REIMBURSEMENT_STATUS : BASE_URL + "/api/reimbursements/bulkupdate"
}

//REIMBURSEMENTS CATEGORY ENDPOINTS
export const reimbursementCategoryEndpoints = {
  CREATE_CATEGORY : BASE_URL + "/api/reimbursement-categories/",
  GET_ALL_CATEGORY : BASE_URL + "/api/reimbursement-categories/",
  UPDATE_CATEGORY : BASE_URL + "/api/reimbursement-categories/",
}

//TABLECUSTOMISATION
export const tablecustomisationEndpoints = {
  CREATE_TABLE_CUSTOMIZATION : BASE_URL + "/api/table-structures/",
  FETCH_TABLE_CUSTOMIZATION : BASE_URL + "/api/table-structures/",
  UPDATE_TABLE_CUSTOMIZATION : BASE_URL + "/api/table-structures/",
  DELETE_TABLE_CUSTOMIZATION : BASE_URL + "/api/table-structures/",
  
}

//leave-poilicy
export const leavepolicyendpoints = {
  createLeavePolicy : BASE_URL + "/api/leave-policy/",
  updateLeavePolicy : BASE_URL + "/api/leave-policy/",
  addLeaveType : BASE_URL + "/api/leave-policy/",
  updateLeaveType : BASE_URL + "/api/leave-policy/",
  removeLeaveType : BASE_URL + "/api/leave-policy/",
  getLeavePolicy : BASE_URL + "/api/leave-policy/company/",
  toggleLeaveTypeStatus : BASE_URL + "/api/leave-policy/"
}

//RESIGNATION ENDPOINTS

export const resignationEndpoints ={
  APPLY_FOR_RESIGNATION : BASE_URL + "/api/resignation/apply",
  WITHDRAW_RESIGNATION : BASE_URL + "/api/resignation/withdraw/",
  APPROVE_RESIGNATION : BASE_URL + "/api/resignation/approve",
  GET_RESIGNATION : BASE_URL + "/api/resignation/",
 GET_EMPLOYEE_RESIGNATION : BASE_URL + "/api/resignation/",
 REJECT_RESIGNATION : BASE_URL + "/api/resignation/reject",
 BULK_UPDATE : BASE_URL + "/api/resignation/bulkupdate"
}

//regularization endpoints

export const regularizationEndpoints = {
  getRegularizations : BASE_URL + "/api/regularization/",
  getRegularization : BASE_URL + "/api/regularization/",
  createRegularization : BASE_URL + "/api/regularization/",
  updateRegularization : BASE_URL + "/api/regularization/",
  deleteRegularization : BASE_URL + "/api/regularization/",
  bulkUpdateRegularizations : BASE_URL + "/api/regularization/bulkupdate"
} 

//subadmin endpoints

export const subadminEndpoints ={
  createSubAdmin : BASE_URL + "/api/sub-admin/createsubadmin",
  updatePermissions : BASE_URL + "/api/sub-admin/updatePermissions/",
  updateDetails : BASE_URL + "/api/sub-admin/updateDetails/",
  getSubAdmins : BASE_URL + "/api/sub-admin/getDetails/"
}