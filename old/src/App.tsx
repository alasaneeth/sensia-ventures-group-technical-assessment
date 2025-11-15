import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUser } from './store/slices/authSlice';
import AppLayout from './components/Layout/AppLayout';
import Login from './components/pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
import ClientsList from './components/pages/Clients/ClientsList';
// import ProductsList from './pages/Products/ProductsList';
// import OrdersList from './pages/Orders/OrdersList';
// import CommentsList from './pages/Comments/CommentsList';
// import UsersList from './pages/Users/UsersList';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token]);

  return (
    <ConfigProvider>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          {/* <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} /> */}
          <Route path="/" element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/dashboard" />} />
            {/* <Route path="dashboard" element={<Dashboard />} /> */}
            <Route path="clients" element={<ClientsList />} />
            {/* <Route path="products" element={<ProductsList />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="comments" element={<CommentsList />} />
            <Route path="users" element={<UsersList />} /> */}
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;