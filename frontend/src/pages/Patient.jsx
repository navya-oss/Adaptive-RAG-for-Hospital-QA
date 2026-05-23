import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Patient.css";

const NODE_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUICK_QUESTIONS = [
  "What is my next appointment?",
  "What medicines am I taking?",
  "What are my lab results?",
  "Tell me about my disease",
  "What procedures did I have?",
  "What is my current status?",
  "Hospital visiting hours?",
  "How to book an appointment?",
];

export default function PatientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    // Welcome message
    setMessages([
      {
        sender: "bot",
        text: `Hello ${user.name || "Patient"}! 👋 I'm MedBot, your personal hospital assistant.\n\nI can help you with:\n• Your next appointment\n• Your medicines & treatment\n• Your lab results\n• General hospital information\n\nWhat would you like to know?`,
      },
    ]);
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFiles = (files) => {
    setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question) return;

    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${NODE_API}/ask`, {
        question,
        patientId: user?.userId || user?.patient_Id || user?.id || user?.email || "",
      });
      const answer = res.data?.answer || "No answer received.";
      setMessages((prev) => [...prev, { sender: "bot", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Cannot reach the backend server.\n\nMake sure:\n1. Node server is running on port 5000\n2. Flask RAG server is running on port 5001\n\nRun: node server.js  and  python rag_pipeline.py",
        },
      ]);
    }
    setLoading(false);
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s.includes("admit")) return "status-admitted";
    if (s.includes("discharge")) return "status-discharged";
    if (s.includes("treatment")) return "status-treatment";
    if (s.includes("follow")) return "status-followup";
    return "";
  };

  if (!user) return null;

  return (
    <div>
      {/* Top bar */}
      <div
        style={{
          background: "rgb(32,24,24)",
          borderBottom: "1px solid rgba(103,175,192,0.2)",
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 className="page-title" style={{ padding: 0, fontSize: 20 }}>
          🏥 Patient Portal
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#888" }}>
            👤 {user.name} {user.surname || ""} · {user.userId || user.id}
          </span>
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{
              padding: "6px 16px", background: "transparent",
              border: "1px solid #555", borderRadius: 7,
              color: "#aaa", cursor: "pointer", fontSize: 13, transition: "0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = "#ff6b6b"; e.target.style.color = "#ff6b6b"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "#555"; e.target.style.color = "#aaa"; }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="patient-portal">
        {/* ── LEFT PANEL ── */}
        <div className="records-section">
          <p className="greeting">Hello, {user.name}! 👋</p>

          {/* Patient Info Card */}
          <div className="patient-info-card">
            <h4>Your Medical Record</h4>
            {[
              ["Patient ID", user.userId || user.patient_Id || user.id],
              ["Name", `${user.name || ""} ${user.surname || ""}`.trim()],
              ["Age", user.age],
              ["Gender", user.gender === "M" ? "Male" : user.gender === "F" ? "Female" : user.gender],
              ["Hospital", user.hospital],
              ["Doctor", user.doctor],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div className="info-row" key={label}>
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>

          {/* Status & Disease */}
          {(user.disease || user.status) && (
            <div className="patient-info-card">
              <h4>Condition</h4>
              {user.disease && (
                <div className="info-row">
                  <span className="info-label">Disease</span>
                  <span className="info-value">{user.disease}</span>
                </div>
              )}
              {user.status && (
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className="info-value">
                    <span className={`status-badge ${getStatusClass(user.status)}`}>{user.status}</span>
                  </span>
                </div>
              )}
              {user.treatment && (
                <div className="info-row">
                  <span className="info-label">Treatment</span>
                  <span className="info-value">{user.treatment}</span>
                </div>
              )}
              {user.procedures && (
                <div className="info-row">
                  <span className="info-label">Procedures</span>
                  <span className="info-value">{user.procedures}</span>
                </div>
              )}
            </div>
          )}

          {/* Appointment */}
          {(user.appointment || user.next_appointment) && (
            <div className="patient-info-card">
              <h4>Appointments</h4>
              {user.appointment && (
                <div className="info-row">
                  <span className="info-label">Last Appt.</span>
                  <span className="info-value" style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {user.appointment}
                  </span>
                </div>
              )}
              {user.next_appointment && (
                <div className="info-row">
                  <span className="info-label">Next Appt.</span>
                  <span className="info-value" style={{ color: "#67afc0", fontFamily: "monospace", fontSize: 12 }}>
                    {user.next_appointment}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <h4 style={{ color: "#67afc0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", margin: "16px 0 10px", fontWeight: 700 }}>
            Upload Files
          </h4>
          <div
            className="upload-area"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            Drag & Drop files here
            <br />
            <label htmlFor="file-upload" className="upload-label">Choose File</label>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              style={{ display: "none" }}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <ul className="uploaded-files">
              {uploadedFiles.map((file, idx) => (
                <li key={idx}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          )}
        </div>

        {/* ── RIGHT CHAT PANEL ── */}
        <div className="chatbot-container">
          <div className="chat-header">
            <span>🤖</span>
            <div>
              <h3>MedBot — Your Health Assistant</h3>
              <p>Ask about appointments, medicines, reports, or general hospital info</p>
            </div>
          </div>

          <div className="chatbox">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                <div className="message-icon">
                  {msg.sender === "bot" ? "🤖" : "👤"}
                </div>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}

            {loading && (
              <div className="message bot">
                <div className="message-icon">🤖</div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestion chips */}
          <div className="quick-suggestions">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="suggestion-chip"
                onClick={() => sendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here…"
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              {loading ? "…" : "Send ↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
