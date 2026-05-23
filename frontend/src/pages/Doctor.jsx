import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Doctor.css";

const NODE_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUICK_QUESTIONS = [
  "How many patients do I have?",
  "List all my patients",
  "Which patients are admitted?",
  "Patients under treatment",
  "Show upcoming appointments",
  "Any critical patients?",
];

export default function Doctor() {
  const { doctor, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [myPatients, setMyPatients] = useState([]);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!doctor) { navigate("/doctor-login"); return; }
    fetchMyPatients();
  }, [doctor]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchMyPatients = async () => {
    try {
      const res = await axios.get(`${NODE_API}/admin/details`);
      if (res.data.success) {
        const all = res.data.patients || [];
        const mine = all.filter(
          (p) =>
            p.doctor === doctor.name ||
            p.doctor_id === doctor.doctorId ||
            p.Doctor_Name === doctor.name
        );
        setMyPatients(mine);

        // Set welcome message after we know patient count
        setMessages([
          {
            sender: "bot",
            text: `Good day, ${doctor.name}! 👨‍⚕️\n\nYour caseload summary:\n• Total assigned patients: ${mine.length}\n• Admitted: ${mine.filter((p) => p.status === "Admitted").length}\n• Under Treatment: ${mine.filter((p) => p.status === "Under Treatment").length}\n• Discharged: ${mine.filter((p) => p.status === "Discharged").length}\n\nAsk me anything about your patients, appointments, or conditions.`,
          },
        ]);
      }
    } catch {
      setMessages([
        {
          sender: "bot",
          text: `Hello Dr. ${doctor.name}! 👨‍⚕️\n\nI couldn't load patient data from the server — make sure Node.js is running on port 5000.\n\nYou can still ask me general clinical questions.`,
        },
      ]);
    }
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
        doctorId: doctor?.doctorId,
      });
      const answer = res.data?.answer || "No answer received.";
      setMessages((prev) => [...prev, { sender: "bot", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Cannot reach the backend.\n\nMake sure:\n1. Node server is running on port 5000 (node server.js)\n2. Flask RAG is running on port 5001 (python rag_pipeline.py)",
        },
      ]);
    }
    setLoading(false);
  };

  const getStatusStyle = (status) => {
    if (!status) return {};
    const s = status.toLowerCase();
    if (s.includes("admit")) return { background: "rgba(251,191,36,.12)", color: "#fbbf24" };
    if (s.includes("discharge")) return { background: "rgba(63,185,80,.12)", color: "#3fb950" };
    if (s.includes("treatment")) return { background: "rgba(88,166,255,.12)", color: "#58a6ff" };
    if (s.includes("follow")) return { background: "rgba(188,140,255,.12)", color: "#bc8cff" };
    return {};
  };

  if (!doctor) return null;

  const initials = doctor.name
    .replace("Dr. ", "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="doctor-dashboard">
      {/* Topbar */}
      <div className="doctor-topbar">
        <h2>👨‍⚕️ Doctor Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#888" }}>
            {doctor.name} · {doctor.doctorId}
          </span>
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{
              padding: "6px 16px", background: "transparent",
              border: "1px solid #555", borderRadius: 7,
              color: "#aaa", cursor: "pointer", fontSize: 13,
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = "#ff6b6b"; e.target.style.color = "#ff6b6b"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "#555"; e.target.style.color = "#aaa"; }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="doctor-body">
        {/* ── LEFT PANEL ── */}
        <div className="doctor-panel">
          <div className="doctor-avatar">{initials}</div>
          <div className="doctor-name">{doctor.name}</div>
          <div className="doctor-spec">{doctor.specialization}</div>
          <div className="doctor-meta">
            {doctor.hospital && <div>🏥 {doctor.hospital}</div>}
            {doctor.experience && <div>⏱ {doctor.experience} years experience</div>}
            {doctor.qualification && <div>🎓 {doctor.qualification}</div>}
          </div>

          {/* Departments */}
          {doctor.departments && (
            <>
              <div className="panel-section-title">Departments</div>
              <div className="dept-tags">
                {(doctor.departments.split(/[;,]/)).map((d) => (
                  <span key={d.trim()} className="dept-tag">{d.trim()}</span>
                ))}
              </div>
            </>
          )}

          {/* My Patients */}
          <div className="panel-section-title">My Patients</div>
          <div className="patient-count-chip">🩺 {myPatients.length} Patients</div>

          <div className="patient-mini-list">
            {myPatients.length === 0 ? (
              <p style={{ fontSize: 12, color: "#666" }}>
                No patients loaded. Check server connection.
              </p>
            ) : (
              myPatients.map((p) => {
                const pid = p.userId || p.patient_Id || p.Patient_ID || p.id;
                const isOpen = expandedPatient === pid;
                return (
                  <div
                    key={pid}
                    className={`patient-mini-item ${isOpen ? "expanded" : ""}`}
                    onClick={() => setExpandedPatient(isOpen ? null : pid)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className="patient-mini-name">{p.name}</div>
                        <div className="patient-mini-id">{pid}</div>
                      </div>
                      <span
                        style={{
                          padding: "2px 8px", borderRadius: 12,
                          fontSize: 11, fontWeight: 700,
                          ...getStatusStyle(p.status),
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="patient-mini-sub">{p.disease}</div>

                    {isOpen && (
                      <div className="patient-mini-detail">
                        <div><b>Age:</b> {p.age} | <b>Gender:</b> {p.gender}</div>
                        <div><b>Hospital:</b> {p.hospital}</div>
                        {p.treatment && <div><b>Treatment:</b> {p.treatment}</div>}
                        {p.procedures && <div><b>Procedures:</b> {p.procedures}</div>}
                        <div><b>Last Appt:</b> {p.appointment}</div>
                        <div><b>Next Appt:</b> <span style={{ color: "#2dd4bf" }}>{p.next_appointment}</span></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── CHAT PANEL ── */}
        <div className="doctor-chat-wrap">
          <div className="doctor-chat-header">
            <span>🤖</span>
            <div>
              <h3>MedBot — Clinical Assistant</h3>
              <p>Ask about your patients, appointments, conditions, lab results</p>
            </div>
          </div>

          <div className="doctor-chatbox">
            {messages.map((msg, i) => (
              <div key={i} className={`doctor-msg-row ${msg.sender}`}>
                <div className="doctor-msg-icon">
                  {msg.sender === "bot" ? "🤖" : "👨‍⚕️"}
                </div>
                <div className={`doctor-bubble ${msg.sender}`}>{msg.text}</div>
              </div>
            ))}

            {loading && (
              <div className="doctor-msg-row">
                <div className="doctor-msg-icon">🤖</div>
                <div className="doctor-bubble bot">
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="doctor-quick-chips">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="doctor-chip"
                onClick={() => sendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="doctor-chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about patients, appointments, clinical data…"
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
