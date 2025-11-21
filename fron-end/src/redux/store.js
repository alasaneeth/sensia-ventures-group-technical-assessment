import { configureStore } from '@reduxjs/toolkit';
import offersReducer from './stateSlices/offersSlice';
import authReducer from './stateSlices/auth';
import companyBrandFilterReducer from './stateSlices/companyBrandFilter';

export const store = configureStore({
  reducer: {
    offers: offersReducer,
    auth: authReducer,
    companyBrandFilter: companyBrandFilterReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
