import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import clientsSlice from './slices/clientsSlice';
import productsSlice from './slices/productsSlice';
import ordersSlice from './slices/ordersSlice';
// import commentsSlice from './slices/commentsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    clients: clientsSlice,
    products: productsSlice,
    orders: ordersSlice,
    // comments: commentsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;