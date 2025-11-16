// src/store/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import clientReducer from './slices/clientSlice'
import productReducer from './slices/productSlice'
import orderReducer from './slices/orderSlice'
import commentReducer from './slices/commentSlice'
import userReducer from './slices/userSlice'

export default configureStore({
  reducer: {
    auth: authReducer,
    clients: clientReducer,
    products: productReducer,
    orders: orderReducer,
    comments: commentReducer,
    users: userReducer,
  },
})