import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";

import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

import { logout, setUser } from "./redux/slices/authSlice";
import SharePage from "./components/SharePage";
const API_BASE_URL =  import.meta.env.VITE_BACKEND_URL;
const App = () => {
  const dispatch = useDispatch();

  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/me`, {
          withCredentials: true,
        });

        dispatch(setUser(res.data.user));
      } catch (err) {
        dispatch(logout());
      }
    };

    checkAuth();
  }, [dispatch]);

  
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "200px" }}>
        <h2>Checking session...</h2>
      </div>
    );
  }

  return (
    <Routes>
      {/* DEFAULT ROUTE */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" /> : <Navigate to="/signup" />
        }
      />

      {/* SIGNUP */}
      <Route
        path="/signup"
        element={
          user ? <Navigate to="/dashboard" /> : <SignUp />
        }
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" /> : <Login />
        }
      />

      {/* DASHBOARD (PROTECTED) */}
      <Route
        path="/dashboard"
        element={
          user ? <Dashboard /> : <Navigate to="/login" />
        }
      />
      <Route path="/share/:token" element={<SharePage/>} />
    </Routes>
  );
};

export default App;