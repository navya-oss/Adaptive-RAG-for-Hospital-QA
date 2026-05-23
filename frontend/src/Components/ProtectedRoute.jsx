import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

export const ProtectedRoute = ({ children, role }) => {
  const { user, doctor, admin } = useAuth();

  if (role === "doctor" && !doctor) {
    return <Navigate to="/doctor-login" replace />;
  }
  if (role === "admin" && !admin) {
    return <Navigate to="/admin-login" replace />;
  }
  if (role === "patient" && !user) {
    return <Navigate to="/login" replace />;
  }
  // fallback: if no role specified, require patient login
  if (!role && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
