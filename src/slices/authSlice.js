import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  signupData:localStorage.getItem('signupdata')? JSON.parse(localStorage.getItem('signupdata')): null,
  loading: false,
  role:localStorage.getItem('role')? JSON.parse(localStorage.getItem('role')):null,
  token:localStorage.getItem('token')? JSON.parse(localStorage.getItem('token')):null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setSignupData(state, value) {
      state.signupData = value.payload;
      localStorage.setItem("signupdata",JSON.stringify(state.signupData));
      console.log("+.+.+.+.+.",state.signupData);
    },
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setRole(state,value){
      state.role = value.payload;
      localStorage.setItem("role",JSON.stringify(state.role));
      console.log("role is : ",state.role)
    
    },
    setToken(state, value) {
      state.token = value.payload;
      localStorage.setItem("token",JSON.stringify(state.token));
      console.log("Token:", state.token)
    },
  },
});

export const { setSignupData, setLoading,setRole, setToken } = authSlice.actions;

export default authSlice.reducer;