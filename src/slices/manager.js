import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reduxManagers: localStorage.getItem('reduxMangagers')? JSON.parse(localStorage.getItem('reduxMangagers')):  [],
};

const managersSlice = createSlice({
  name: "managers",
  initialState: initialState,
  reducers: {
    setReduxManagers(state, value) {
      state.reduxManagers = value.payload;
      localStorage.setItem("reduxManagers",JSON.stringify(state.reduxManagers));
      console.log("All managers :", state.reduxManagers)
    },
  },
});

export const { setReduxManagers} = managersSlice.actions;

export default managersSlice.reducer;