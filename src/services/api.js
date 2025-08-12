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
  GET_COMPANY_DETAILS : BASE_URL + "/api/company/getCompanyDetails/"
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
  updateEmployeeProfile : BASE_URL + "/api/employee/update/"
}

//POLICIES ENDPOINTS
export const policiesEndpoints = {
  ADD_POLICY : BASE_URL + "/api/policies/add",
  GET_POLICIES : BASE_URL + "/api/policies/company/",
  GET_ONE_POLICY : BASE_URL + "/api/policies/",
  UPDATE_POLICY : BASE_URL + "/api/policies/update/",
}

//LEAVE ENDPOINTS
export const leaveEndpoints = {
  APPLY_LEAVE : BASE_URL + "/api/leave/apply",
  GET_LEAVE : BASE_URL + "/api/leave/get/",
  UPDATE_LEAVE_STATUS : BASE_URL + "/api/leave/update/",
  GET_EMPLOYEE_LEAVES : BASE_URL + "/api/leave/employee/",
  GET_COMPANY_LEAVES : BASE_URL + "/api/leave/getCompany/",
  UPDATE_LEAVE : BASE_URL + "/api/leave/leaves/",
}

//REIMBURSEMENTS ENDPOINTS
export const reimbursementsEndpoints ={
  CREATE_REIMBURSEMENT : BASE_URL + "/api/reimbursements/",
  GET_COMPANY_REIMBURSEMENTS : BASE_URL + "/api/reimbursements/company/",
  UPDATE_REIMBURSEMENTS_STATUS : BASE_URL + "/api/reimbursements/",
  GET_EMPLOYEE_REIMBURSEMENTS : BASE_URL + "/api/reimbursements/employee/" 
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