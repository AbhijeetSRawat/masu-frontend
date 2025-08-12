import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  
  loading: false,
  allCompany:localStorage.getItem('allCompany')? JSON.parse(localStorage.getItem('allCompany')):[],
};

const allCompanySlice = createSlice({
  name: "allCompany",
  initialState: initialState,
  reducers: {
    
    setLoading(state, value) {
      state.loading = value.payload;
    },
    setAllCompany(state, value) {
      state.allCompany = value.payload;
      localStorage.setItem("allCompany",JSON.stringify(state.allCompany))
      console.log("All companies:", state.allCompany)
    },
  },
});

export const { setLoading, setAllCompany } = allCompanySlice.actions;

export default allCompanySlice.reducer;