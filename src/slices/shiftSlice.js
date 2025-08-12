import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  
  loading: false,
  company: localStorage.getItem('shiftCompany')? JSON.parse(localStorage.getItem('shiftCompany')):  null,
  reduxShifts: localStorage.getItem('reduxShifts')? JSON.parse(localStorage.getItem('reduxShifts')):  [],
};

const shiftsSlice = createSlice({
  name: "shifts",
  initialState: initialState,
  reducers: {
    
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setCompany(state,value){
      state.company = value.payload;
      localStorage.setItem("shiftCompany",JSON.stringify(state.company));
      console.log("company selected is : ",state.company); 
    },
    setReduxShifts(state, value) {
      state.reduxShifts = value.payload;
      localStorage.setItem("reduxShifts",JSON.stringify(state.reduxShifts));
      console.log("All shifts :", state.reduxShifts)
    },
  },
});

export const { setLoading, setReduxShifts, setCompany } = shiftsSlice.actions;

export default shiftsSlice.reducer;