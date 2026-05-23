import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Registration.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginAdmin(adminId, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Invalid Admin ID or Password");
      return;
    }

    navigate("/admin-dashboard");
  };

  return (
    <div className="register-container">
      <form onSubmit={handleLogin} className="register-form" style={{ maxWidth: 480 }}>
        <h2>🛡️ Admin Login</h2>
        {error && <p className="error">{error}</p>}

        <label>Admin ID</label>
        <input
          type="text"
          placeholder="e.g. admin001"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
