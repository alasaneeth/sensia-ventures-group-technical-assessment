// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "antd";
import { useSelector } from "react-redux";
import Sidebar from "./components/Layout/Sidebar";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Clients from "./pages/Clients/Cleints";
import Products from "./pages/Products/Products";
import Orders from "./pages/Orders/Orders";
import Comments from "./pages/Comments/Comments";
import Users from "./pages/Users/Users";
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


const { Content } = Layout;

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div>
      <Layout className="min-h-screen">
        {isAuthenticated && <Sidebar />}
        <Layout className={isAuthenticated ? "ml-0 lg:ml-64" : ""}>
          <Content className="min-h-screen bg-gray-50">
            <Routes>
              <Route
                path="/login"
                element={
                  !isAuthenticated ? <Login /> : <Navigate to="/dashboard" />
                }
              />
              <Route
                path="/register"
                element={
                  !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
                }
              />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/clients"
                element={
                  isAuthenticated ? <Clients /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/products"
                element={
                  isAuthenticated ? <Products /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/orders"
                element={
                  isAuthenticated ? <Orders /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/comments"
                element={
                  isAuthenticated ? <Comments /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/users"
                element={isAuthenticated ? <Users /> : <Navigate to="/login" />}
              />
              <Route
                path="/"
                element={
                  <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
                }
              />
            </Routes>
          </Content>
        </Layout>
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
