import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { ProtectedRoute } from "./Components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import PatientPortal from "./pages/Patient";
import DoctorLogin from "./pages/DoctorLogin";
import Doctor from "./pages/Doctor";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected: Patient */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute role="patient">
                <PatientPortal />
              </ProtectedRoute>
            }
          />

          {/* Protected: Doctor */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute role="doctor">
                <Doctor />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
