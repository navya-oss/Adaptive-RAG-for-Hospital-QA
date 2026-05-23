import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Registration.css";

export default function Registration() {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    address: "",
    state: "",
    phone: "",
    password: "",
    age: "",
    gender: "",
    hospital: "",
    disease: "",
    treatment: "",
    procedures: "",
    doctor: "",
    appointment: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await registerPatient(formData);
    setLoading(false);

    if (!result.success) {
      setIsError(true);
      setMessage("❌ " + result.message);
      return;
    }

    setIsError(false);
    setMessage(`✅ Registration successful! Your Patient ID: ${result.userId}`);
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="register-container">
      <div className="top-login">
        Already have an account? <Link to="/login">Login</Link>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <h2>🏥 Patient Registration</h2>

        {message && (
          <p className={isError ? "error" : "success-msg"}>{message}</p>
        )}

        {/* Personal Info */}
        <div className="section-title">Personal Information</div>
        <div className="form-row">
          <div>
            <label>First Name *</label>
            <input type="text" name="name" placeholder="John" onChange={handleChange} required />
          </div>
          <div>
            <label>Surname *</label>
            <input type="text" name="surname" placeholder="Doe" onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Age</label>
            <input type="number" name="age" placeholder="25" onChange={handleChange} />
          </div>
          <div>
            <label>Gender</label>
            <select name="gender" onChange={handleChange}>
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <label>Email *</label>
        <input type="email" name="email" placeholder="john@example.com" onChange={handleChange} required />

        <label>Phone Number</label>
        <input type="tel" name="phone" placeholder="+91-9876543210" onChange={handleChange} />

        <label>Address</label>
        <textarea name="address" placeholder="Street, City" onChange={handleChange} />

        <div className="form-row">
          <div>
            <label>State</label>
            <input type="text" name="state" placeholder="Telangana" onChange={handleChange} />
          </div>
          <div>
            <label>Password *</label>
            <input type="password" name="password" placeholder="Enter password" onChange={handleChange} required />
          </div>
        </div>

        {/* Medical Info */}
        <div className="section-title">Medical Information</div>

        <label>Hospital Name</label>
        <input type="text" name="hospital" placeholder="e.g. CityCare Medical Centre" onChange={handleChange} />

        <label>Disease / Condition</label>
        <input type="text" name="disease" placeholder="e.g. Hypertension" onChange={handleChange} />

        <label>Prescribed Treatment / Medicines</label>
        <input type="text" name="treatment" placeholder="e.g. Metformin, Aspirin" onChange={handleChange} />

        <label>Procedures / Surgeries</label>
        <input type="text" name="procedures" placeholder="e.g. MRI Scan" onChange={handleChange} />

        <label>Consulting Doctor</label>
        <input type="text" name="doctor" placeholder="e.g. Dr. Ravi Kumar" onChange={handleChange} />

        <label>Appointment Date</label>
        <input type="date" name="appointment" onChange={handleChange} />

        <button type="submit" disabled={loading}>
          {loading ? "Registering…" : "Register →"}
        </button>
      </form>
    </div>
  );
}
