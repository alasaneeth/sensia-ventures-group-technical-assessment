import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedCompanyIds: [],
    selectedBrandIds: [],
    companies: [],
    brands: [],
    isInitialized: false,
};

const companyBrandFilterSlice = createSlice({
    name: "companyBrandFilter",
    initialState,
    reducers: {
        setSelectedCompanyIds: (state, action) => {
            state.selectedCompanyIds = action.payload;
        },
        setSelectedBrandIds: (state, action) => {
            state.selectedBrandIds = action.payload;
        },
        setCompanies: (state, action) => {
            state.companies = action.payload;
        },
        setBrands: (state, action) => {
            state.brands = action.payload;
        },
        setInitialized: (state, action) => {
            state.isInitialized = action.payload;
        },
        resetFilters: (state) => {
            state.selectedCompanyIds = [];
            state.selectedBrandIds = [];
            state.isInitialized = false;
        },
    },
});

export const {
    setSelectedCompanyIds,
    setSelectedBrandIds,
    setCompanies,
    setBrands,
    setInitialized,
    resetFilters,
} = companyBrandFilterSlice.actions;

export default companyBrandFilterSlice.reducer;

