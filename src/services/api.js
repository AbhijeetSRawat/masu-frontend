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
  ASSIGN_HR_MANAGER : BASE_URL + "/api/department/assignHrManager",
  UPDATE_HR_MANAGER : BASE_URL + "/api/department/updateHrManager",
  UPDATE_HR_MANAGER_DETAILS : BASE_URL + "/api/department/updateHRManagerDetails",
  GET_ALL : BASE_URL + "/api/department/getAll/",
  GET_HR_AND_MANAGER : BASE_URL + "/api/department/getHRandManager/",
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
  APPLY_LEAVE : BASE_URL + "/api/leave/apply",
  // GET_LEAVE : BASE_URL + "/api/leave/leaves/get/",
  // UPDATE_LEAVE_STATUS : BASE_URL + "/api/leave/update/",
  GET_EMPLOYEE_LEAVES : BASE_URL + "/api/leave/employee/leaves/",
  GET_MANAGER_LEAVES : BASE_URL + "/api/leave/manager/leaves/",
  GET_HR_LEAVES : BASE_URL + "/api/leave/hr/leaves/",
  GET_ADMIN_LEAVES : BASE_URL + "/api/leave/admin/leaves/",
  // GET_COMPANY_LEAVES : BASE_URL + "/api/leave/getCompany/",
  // UPDATE_LEAVE : BASE_URL + "/api/leave/leaves/",
  MANAGER_APPROVE : BASE_URL + "/api/leave/",
  HR_APPROVE : BASE_URL + "/api/leave/",
  ADMIN_APPROVE : BASE_URL + "/api/leave/",
  REJECT_LEAVE : BASE_URL + "/api/leave/",
  GET_PENDING_LEAVES_BY_LEVEL : BASE_URL + "/api/leave/pending/",
  CANCEL_LEAVE : BASE_URL + "/api/leave/",
  GET_CANCELLED_LEAVES_FOR_COMPANY : BASE_URL + "/api/leave/company/",
  bulkUpdate : BASE_URL + "/api/leave/bulk/update",
  getRestLeaveOfEmployee : BASE_URL + "/api/leave/"
}

//REIMBURSEMENTS ENDPOINTS
export const reimbursementsEndpoints ={
  applyReimbursement : BASE_URL + "/api/reimbursements/apply",
  managerApprove : BASE_URL + "/api/reimbursements/manager/approve/",
  hrApprove : BASE_URL + "/api/reimbursements/hr/approve/",
  adminApprove :  BASE_URL + "/api/reimbursements/admin/approve/",
  reject :  BASE_URL + "/api/reimbursements/reject/",
  bulkUpdate :  BASE_URL + "/api/reimbursements/bulk-update",
  getPendingReimbursementsByLevel :  BASE_URL + "/api/reimbursements/pending/",
  getReimbursementsForManager :  BASE_URL + "/api/reimbursements/manager/",
  getReimbursementsForHr :  BASE_URL + "/api/reimbursements/hr/",
  getReimbursementsForAdmin :  BASE_URL + "/api/reimbursements/admin/",
  getReimbursemtnsForEmployee :  BASE_URL + "/api/reimbursements/employee/",
  markAsPaid : BASE_URL + "/api/reimbursements/admin/mark-as-paid/"
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
  APPLY_FOR_RESIGNATION : BASE_URL + "/api/resignation/apply/",
  WITHDRAW_RESIGNATION : BASE_URL + "/api/resignation/withdraw/",
  GET_RESIGNATIONS_FOR_EMPLOYEE : BASE_URL + "/api/resignation/employee/",
  MANAGER_APPROVE_RESIGNATION : BASE_URL + "/api/resignation/manager-approval/",
  GET_RESIGNATION_FOR_MANAGER : BASE_URL + "/api/resignation/manager/",
  HR_APPROVE_RESIGNATION : BASE_URL + "/api/resignation/hr-approval/",
  GET_RESIGNATIONS_FOR_HR : BASE_URL + "/api/resignation/hr/hrId",
  ADMIN_APPROVAL_RESIGNATION : BASE_URL + "/api/resignation/admin-approval/",
  GET_RESIGNATIONS_FOR_ADMIN : BASE_URL + "/api/resignation/admin/",
  BULK_UPDATE_RESIGNATIONS : BASE_URL + "/api/resignation/bulk-update",
  REJECT_RESIGNATION : BASE_URL + "/api/resignation/reject/",
  GET_RESIGNATIONS: BASE_URL + "/api/resignation/"
}

//regularization endpoints

export const regularizationEndpoints = {
  getRegularizations : BASE_URL + "/api/regularization/",
  getRegularization : BASE_URL + "/api/regularization/",
  createRegularization : BASE_URL + "/api/regularization/",
  updateRegularization : BASE_URL + "/api/regularization/",
  deleteRegularization : BASE_URL + "/api/regularization/",
  bulkUpdateRegularizations : BASE_URL + "/api/regularization/bulk/update",
  managerApproveRegularization : BASE_URL + "/api/regularization/",
  hrApproveRegularization : BASE_URL + "/api/regularization/",
  adminApproveRegularization : BASE_URL + "/api/regularization/",
  rejectRegularization : BASE_URL + "/api/regularization/",
  getPendingRegularizationsByLevel : BASE_URL + "/api/regularization/pending/",
   getPendingRegularizationsForManager : BASE_URL + "/api/regularization/manager/",
    getPendingRegularizationsForHr : BASE_URL + "/api/regularization/hr/",
     getPendingRegularizationsForAdmin : BASE_URL + "/api/regularization/admin/",
} 

//subadmin endpoints

export const subadminEndpoints ={
  createSubAdmin : BASE_URL + "/api/sub-admin/createsubadmin",
  updatePermissions : BASE_URL + "/api/sub-admin/updatePermissions/",
  updateDetails : BASE_URL + "/api/sub-admin/updateDetails/",
  getSubAdmins : BASE_URL + "/api/sub-admin/getDetails/"
}

//PAYROLL ENDPOINTS
export const payrollEndpoints = {
  CALCULATE_PAYROLL: BASE_URL + "/api/payroll/calculatePayroll",
  DOWNLOAD_PAYSLIP_PDF: BASE_URL + "/api/payroll/downloadPaySlipPdf/",
  DOWNLOAD_PAYSLIP_EXCEL: BASE_URL + "/api/payroll/downloadPaySlipExcel/",
  GET_PAYROLL_HISTORY: BASE_URL + "/api/payroll/history/",
  GET_PAYROLL_REPORT: BASE_URL + "/api/payroll/report/",
  GET_MONTHLY_SALARY : BASE_URL + "/api/payroll/"
}

//ATTENDANCE ENDPOINTS
export const attendanceEndpoints = {
  getAttendances: `${BASE_URL}/api/attendance/`,
  createAttendance: `${BASE_URL}/api/attendance/`,
  getAttendance: `${BASE_URL}/api/attendance/`,
  getEmoployeesUnderHr : BASE_URL + '/api/attendance/employeeUnderHR/',
  bulkAttendance : BASE_URL + '/api/attendance/bulkattendance',
  getAttendanceByDate : BASE_URL + '/api/attendance/getbydate/',
  updateAttendance : BASE_URL + '/api/attendance/attendance/',
  bulkUpdateAttendance : BASE_URL + '/api/attendance/bulkupdateattendance'
};


