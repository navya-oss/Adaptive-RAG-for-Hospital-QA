import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const NODE_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user")) || null
  );
  const [doctor, setDoctor] = useState(
    JSON.parse(sessionStorage.getItem("doctor")) || null
  );
  const [admin, setAdmin] = useState(
    JSON.parse(sessionStorage.getItem("admin")) || null
  );

  // ── PATIENT REGISTRATION ──────────────────────────────
  const registerPatient = async (formData) => {
    try {
      const res = await axios.post(`${NODE_API}/register`, formData);
      if (res.data.success) {
        return { success: true, userId: res.data.userId };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Backend not reachable. Is the Node server running?",
      };
    }
  };

  // ── PATIENT LOGIN ─────────────────────────────────────
  const loginPatient = async (email, password) => {
    try {
      const res = await axios.post(`${NODE_API}/login/patient`, { email, password });
      if (res.data.status === "success") {
        const patient = res.data.patient;
        sessionStorage.setItem("user", JSON.stringify(patient));
        setUser(patient);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Cannot reach server. Is Node running on port 5000?",
      };
    }
  };

  // ── DOCTOR LOGIN ──────────────────────────────────────
  const loginDoctor = async (doctorId, password) => {
    try {
      const res = await axios.post(`${NODE_API}/login/doctor`, { doctorId, password });
      if (res.data.status === "success") {
        const doc = res.data.doctor;
        sessionStorage.setItem("doctor", JSON.stringify(doc));
        setDoctor(doc);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Cannot reach server. Is Node running on port 5000?",
      };
    }
  };

  // ── ADMIN LOGIN ───────────────────────────────────────
  const loginAdmin = async (adminId, password) => {
    try {
      const res = await axios.post(`${NODE_API}/login/admin`, { adminId, password });
      if (res.data.status === "success") {
        const adminData = res.data.admin;
        sessionStorage.setItem("admin", JSON.stringify(adminData));
        setAdmin(adminData);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Cannot reach server. Is Node running on port 5000?",
      };
    }
  };

  // ── LOGOUT ────────────────────────────────────────────
  const logout = () => {
    sessionStorage.clear();
    setUser(null);
    setDoctor(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctor,
        admin,
        registerPatient,
        loginPatient,
        loginDoctor,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
