import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reduxDepartments: localStorage.getItem('reduxDepartments')? JSON.parse(localStorage.getItem('reduxDepartments')):  [],
};

const departmentsSlice = createSlice({
  name: "departments",
  initialState: initialState,
  reducers: {
    setReduxDepartments(state, value) {
      state.reduxDepartments = value.payload;
      localStorage.setItem("reduxDepartments",JSON.stringify(state.reduxDepartments));
      console.log("All departments :", state.reduxDepartments)
    },
  },
});

export const { setReduxDepartments} = departmentsSlice.actions;

export default departmentsSlice.reducer;