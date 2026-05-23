import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Registration.css";

export default function PatientLogin() {
  const navigate = useNavigate();
  const { loginPatient } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginPatient(formData.email, formData.password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/patient");
  };

  return (
    <div className="register-container">
      <div className="top-login">
        New patient? <Link to="/register">Register</Link>
      </div>

      <form onSubmit={handleLogin} className="register-form" style={{ maxWidth: 480 }}>
        <h2>🏥 Patient Login</h2>
        {error && <p className="error">{error}</p>}

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Login →"}
        </button>

        <p style={{ textAlign: "center", marginTop: 16, color: "#aaa", fontSize: 13 }}>
          <Link to="/doctor-login" style={{ color: "#67afc0" }}>Doctor Login</Link>
          {" · "}
          <Link to="/admin-login" style={{ color: "#67afc0" }}>Admin Login</Link>
          {" · "}
          <Link to="/" style={{ color: "#67afc0" }}>Home</Link>
        </p>
      </form>
    </div>
  );
}
