import { combineReducers } from "@reduxjs/toolkit"

import authReducer from "../slices/authSlice"
import allCompanyReducer from "../slices/allCompanySlice"
import permissionsReducer from "../slices/companyPermission"
import shiftsReducer from "../slices/shiftSlice"
import managersReducer from "../slices/manager"
import departmentsReducer from "../slices/departments"
import employeesReducer from "../slices/employee"

const rootReducer = combineReducers({
  auth: authReducer,
  allCompany: allCompanyReducer,
  permissions: permissionsReducer,
  shifts:shiftsReducer,
  managers:managersReducer,
  departments:departmentsReducer,
  employees:employeesReducer,
})

export default rootReducer