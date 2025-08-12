import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reduxEmployees: localStorage.getItem('reduxEmployees')? JSON.parse(localStorage.getItem('reduxEmployees')):  [],
  reduxEmployee : localStorage.getItem('reduxEmployee')? JSON.parse(localStorage.getItem('reduxEmployee')): null,
};

const employeesSlice = createSlice({
  name: "employees",
  initialState: initialState,
  reducers: {
    setReduxEmployees(state, value) {
      state.reduxEmployees = value.payload;
      localStorage.setItem("reduxEmployees",JSON.stringify(state.reduxEmployees));
      console.log("All employees :", state.reduxEmployees)
    },
    setReduxEmployee(state,value){
      state.reduxEmployee = value.payload;
      localStorage.setItem("reduxEmployee",JSON.stringify(state.reduxEmployee));
      console.log("Selected Employee is : ",state.reduxEmployee)
    }
  },
});

export const { setReduxEmployees , setReduxEmployee} = employeesSlice.actions;

export default employeesSlice.reducer;