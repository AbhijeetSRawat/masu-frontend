import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  
  loading: false,
  company: localStorage.getItem('company')? JSON.parse(localStorage.getItem('company')):  null,
  permissions:localStorage.getItem('permissions')? JSON.parse(localStorage.getItem('permissions')):  [],
  subAdminPermissions : localStorage.getItem('subAdminPermissions')?  JSON.parse(localStorage.getItem('subAdminPermissions')):  null,
};

const permissionsSlice = createSlice({
  name: "permissions",
  initialState: initialState,
  reducers: {
    
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setCompany(state,value){
      state.company = value.payload;
      localStorage.setItem("company",JSON.stringify(state.company));
      console.log("company selected is : ",state.company); 
    },
    setPermissions(state, value) {
      state.permissions = value.payload;
      localStorage.setItem("permissions",JSON.stringify(state.permissions));
      console.log("All permissions :", state.permissions)
    },
    setSubAdminPermissions(state, value) {
      state.subAdminPermissions = value.payload;
      localStorage.setItem("SubAdminPermissions",JSON.stringify(state.subAdminPermissions));
      console.log("All sub-admin permissions :", state.subAdminPermissions)
    },
  },
});

export const { setLoading, setPermissions,setSubAdminPermissions, setCompany } = permissionsSlice.actions;

export default permissionsSlice.reducer;