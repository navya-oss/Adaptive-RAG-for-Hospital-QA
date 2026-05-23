import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Registration.css";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { loginDoctor } = useAuth();
  const [formData, setFormData] = useState({ doctorId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginDoctor(formData.doctorId, formData.password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Invalid Doctor ID or password");
      return;
    }

    navigate("/doctor");
  };

  return (
    <div className="register-container">
      <form onSubmit={handleLogin} className="register-form" style={{ maxWidth: 480 }}>
        <h2>👨‍⚕️ Doctor Login</h2>
        {error && <p className="error">{error}</p>}

        <label>Doctor ID</label>
        <input
          type="text"
          name="doctorId"
          placeholder="e.g. D201"
          value={formData.doctorId}
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
          <Link to="/" style={{ color: "#67afc0" }}>← Back to Home</Link>
        </p>
      </form>
    </div>
  );
}
