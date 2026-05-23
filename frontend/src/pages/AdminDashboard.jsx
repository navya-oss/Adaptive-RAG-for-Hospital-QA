import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import "./Admin.css";

const NODE_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUICK_QUESTIONS = [
  "Total doctors and patients",
  "List all hospitals",
  "Which patients are admitted?",
  "Doctors by specialization",
  "Patients under treatment",
  "Doctor with most patients",
];

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [patSearch, setPatSearch] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!admin) { navigate("/admin-login"); return; }
    fetchData();
  }, [admin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, detailsRes] = await Promise.all([
        axios.get(`${NODE_API}/admin/stats`),
        axios.get(`${NODE_API}/admin/details`),
      ]);

      const docs = detailsRes.data.doctors || [];
      const pats = detailsRes.data.patients || [];
      setDoctors(docs);
      setPatients(pats);

      const statusMap = pats.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      setMessages([
        {
          sender: "bot",
          text: `Welcome, ${admin?.name || "Admin"}! 🛡️\n\nSystem is online:\n• Doctors: ${docs.length}\n• Patients: ${pats.length}\n• Admitted: ${statusMap["Admitted"] || 0}\n• Under Treatment: ${statusMap["Under Treatment"] || 0}\n• Discharged: ${statusMap["Discharged"] || 0}\n\nAsk me anything about the hospital system.`,
        },
      ]);
    } catch {
      setMessages([
        {
          sender: "bot",
          text: "⚠️ Could not load system data. Make sure the Node server is running on port 5000.\n\nRun: node server.js",
        },
      ]);
    }
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question) return;

    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await axios.post(`${NODE_API}/ask`, {
        question,
        adminId: admin?.adminId,
        patientId: "",
      });
      const answer = res.data?.answer || "No answer received.";
      setMessages((prev) => [...prev, { sender: "bot", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Cannot reach the AI backend.\n\nMake sure:\n1. Node server running on port 5000\n2. Flask RAG running on port 5001",
        },
      ]);
    }
    setChatLoading(false);
  };

  // ── Analytics ──
  const statusMap = patients.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const hospMap = patients.reduce((acc, p) => {
    const h = p.hospital || "Unknown";
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {});

  const hospEntries = Object.entries(hospMap).sort((a, b) => b[1] - a[1]);
  const statusEntries = Object.entries(statusMap).sort((a, b) => b[1] - a[1]);
  const maxHosp = Math.max(...hospEntries.map(([, v]) => v), 1);
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);

  const statusFillClass = (s) => {
    if (!s) return "";
    const l = s.toLowerCase();
    if (l.includes("admit")) return "amber";
    if (l.includes("discharge")) return "green";
    return "";
  };

  const statusPillClass = (s) => {
    if (!s) return "";
    const l = s.toLowerCase();
    if (l.includes("admit")) return "sp-admitted";
    if (l.includes("discharge")) return "sp-discharged";
    if (l.includes("treatment")) return "sp-treatment";
    if (l.includes("follow")) return "sp-followup";
    return "";
  };

  // ── Filtered tables ──
  const filteredDocs = doctors.filter((d) => {
    const q = docSearch.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.doctorId || "").toLowerCase().includes(q) ||
      (d.specialization || "").toLowerCase().includes(q) ||
      (d.hospital || "").toLowerCase().includes(q)
    );
  });

  const filteredPats = patients.filter((p) => {
    const q = patSearch.toLowerCase();
    const pid = (p.userId || p.patient_Id || p.Patient_ID || "").toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      pid.includes(q) ||
      (p.disease || "").toLowerCase().includes(q) ||
      (p.hospital || "").toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q) ||
      (p.doctor || "").toLowerCase().includes(q)
    );
  });

  if (!admin) return null;

  return (
    <div className="admin-dashboard">
      {/* Topbar */}
      <div className="admin-topbar">
        <h2>🛡️ Admin Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#888" }}>
            {admin.name} · {admin.adminId}
          </span>
          <button
            className="logout-btn"
            onClick={() => { logout(); navigate("/"); }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="admin-body">
        {/* ── STATS CARDS ── */}
        <div className="stats-grid">
          {[
            { label: "Total Doctors",     val: doctors.length,                       cls: "c-teal"   },
            { label: "Total Patients",    val: patients.length,                      cls: "c-blue"   },
            { label: "Admitted",          val: statusMap["Admitted"] || 0,           cls: "c-amber"  },
            { label: "Under Treatment",   val: statusMap["Under Treatment"] || 0,    cls: "c-purple" },
            { label: "Discharged",        val: statusMap["Discharged"] || 0,         cls: "c-green"  },
            { label: "Follow-up",         val: statusMap["Follow-up"] || 0,          cls: "c-red"    },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="stat-num">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── BAR CHARTS ── */}
        <div className="admin-two-col">
          <div className="admin-card">
            <h3>📊 Patients by Hospital</h3>
            {hospEntries.map(([h, c]) => (
              <div key={h} className="bar-row">
                <div className="bar-label" title={h}>{h}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c / maxHosp) * 100}%` }} />
                </div>
                <div className="bar-count">{c}</div>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <h3>📈 Patients by Status</h3>
            {statusEntries.map(([s, c]) => (
              <div key={s} className="bar-row">
                <div className="bar-label">{s}</div>
                <div className="bar-track">
                  <div className={`bar-fill ${statusFillClass(s)}`} style={{ width: `${(c / maxStatus) * 100}%` }} />
                </div>
                <div className="bar-count">{c}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ADMIN CHATBOT ── */}
        <div className="admin-chat-card">
          <div className="admin-chat-header">
            <span>🤖</span>
            <h3>Admin AI Assistant — Full System Access</h3>
            <span style={{ fontSize: 12, color: "#888" }}>
              {patients.length} patients · {doctors.length} doctors loaded
            </span>
          </div>

          <div className="admin-chat-quick">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                className="admin-chip"
                onClick={() => sendMessage(q)}
                disabled={chatLoading}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="admin-chat-msgs">
            {messages.map((msg, i) => (
              <div key={i} className={`admin-msg-row ${msg.sender}`}>
                <div className="admin-msg-icon">
                  {msg.sender === "bot" ? "🤖" : "🛡️"}
                </div>
                <div className={`admin-bubble ${msg.sender}`}>{msg.text}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="admin-msg-row">
                <div className="admin-msg-icon">🤖</div>
                <div className="admin-bubble bot">
                  <div className="typing-indicator" style={{ padding: "4px 0" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#666", animation: "blink 1.2s infinite", display: "inline-block", margin: "0 2px" }} />
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#666", animation: "blink 1.2s infinite", animationDelay: "0.2s", display: "inline-block", margin: "0 2px" }} />
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#666", animation: "blink 1.2s infinite", animationDelay: "0.4s", display: "inline-block", margin: "0 2px" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="admin-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about doctors, patients, statistics, system monitoring…"
              onKeyDown={(e) => e.key === "Enter" && !chatLoading && sendMessage()}
              disabled={chatLoading}
            />
            <button
              className="admin-send-btn"
              onClick={() => sendMessage()}
              disabled={chatLoading || !input.trim()}
            >
              {chatLoading ? "…" : "↑ Ask"}
            </button>
          </div>
        </div>

        {/* ── DOCTORS TABLE ── */}
        <div className="admin-table-section">
          <h3>
            👨‍⚕️ All Doctors{" "}
            <span style={{ color: "#666", fontWeight: 400, fontSize: 12 }}>
              ({filteredDocs.length} of {doctors.length})
            </span>
          </h3>
          <input
            className="search-bar"
            placeholder="Search doctors by name, ID, specialization, hospital…"
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
          />
          <table>
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Hospital</th>
                <th>Experience</th>
                <th>Patients</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#555" }}>
                    {loading ? "Loading…" : "No doctors found"}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((d) => {
                  const patCount = patients.filter(
                    (p) => p.doctor === d.name || p.doctor_id === d.doctorId
                  ).length;
                  return (
                    <tr key={d.doctorId || d._id}>
                      <td className="tbl-id tbl-blue">{d.doctorId}</td>
                      <td style={{ color: "#ddd", fontWeight: 500 }}>{d.name}</td>
                      <td>{d.specialization}</td>
                      <td>{d.hospital}</td>
                      <td>{d.experience} yrs</td>
                      <td>
                        <span
                          style={{
                            background: "rgba(45,212,191,.12)",
                            color: "#2dd4bf",
                            padding: "2px 9px",
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {patCount}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PATIENTS TABLE ── */}
        <div className="admin-table-section">
          <h3>
            🏥 All Patients{" "}
            <span style={{ color: "#666", fontWeight: 400, fontSize: 12 }}>
              ({filteredPats.length} of {patients.length})
            </span>
          </h3>
          <input
            className="search-bar"
            placeholder="Search by name, ID, disease, hospital, doctor, status…"
            value={patSearch}
            onChange={(e) => setPatSearch(e.target.value)}
          />
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Disease</th>
                <th>Status</th>
                <th>Doctor</th>
                <th>Hospital</th>
                <th>Next Appointment</th>
              </tr>
            </thead>
            <tbody>
              {filteredPats.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20, color: "#555" }}>
                    {loading ? "Loading…" : "No patients found"}
                  </td>
                </tr>
              ) : (
                filteredPats.map((p) => {
                  const pid = p.userId || p.patient_Id || p.Patient_ID;
                  const gender = p.gender === "M" ? "M" : p.gender === "F" ? "F" : p.gender;
                  return (
                    <tr key={pid || p._id}>
                      <td className="tbl-id tbl-teal">{pid}</td>
                      <td style={{ color: "#ddd", fontWeight: 500 }}>{p.name}</td>
                      <td>{p.age}</td>
                      <td>{p.disease}</td>
                      <td>
                        <span className={`status-pill ${statusPillClass(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{p.doctor}</td>
                      <td>{p.hospital}</td>
                      <td
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#2dd4bf",
                        }}
                      >
                        {p.next_appointment || p.appointment}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
