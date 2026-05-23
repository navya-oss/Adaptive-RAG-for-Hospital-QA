# 🏥 Adaptive RAG for Hospital QA — MedBot

An AI-powered multi-role hospital chatbot system built with React, Node.js, Python Flask, MongoDB, and the Anthropic Claude API. MedBot provides personalized, conversational answers to patients, doctors, and hospital administrators.

---

## 🌟 Features

### 👤 Patient Portal
- Personalized chatbot with full medical record access
- Answers questions about appointments, medicines, lab results, procedures
- Answers general hospital questions (visiting hours, booking, emergency)
- File upload section for medical documents
- Status tracking (Admitted, Under Treatment, Discharged, Follow-up)

### 👨‍⚕️ Doctor Dashboard
- Clinical AI assistant with access to all assigned patients
- Patient list with expandable details (disease, treatment, appointments)
- Answers: "How many patients?", "Who is admitted?", "Upcoming appointments?"
- Department and qualification display

### 🛡️ Admin Dashboard
- Full system monitoring with live stats
- Visual bar charts: patients by hospital, patients by status
- Searchable tables for all doctors and patients
- AI assistant for system-wide queries and analytics

---

## 🧠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, React Router |
| Backend API | Node.js, Express.js |
| AI/RAG Pipeline | Python, Flask, Anthropic Claude API |
| Database | MongoDB |
| Styling | Custom CSS (dark theme) |

---

## 🗂️ Project Structure

```
hospital-qa/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── Login.jsx        # Patient login
│   │   │   ├── Registration.jsx # Patient registration
│   │   │   ├── Patient.jsx      # Patient portal + chatbot
│   │   │   ├── DoctorLogin.jsx  # Doctor login
│   │   │   ├── Doctor.jsx       # Doctor dashboard + chatbot
│   │   │   ├── AdminLogin.jsx   # Admin login
│   │   │   └── AdminDashboard.jsx # Admin panel + chatbot
│   │   ├── Context/
│   │   │   └── AuthContext.jsx  # Auth state management
│   │   └── Components/
│   │       └── ProtectedRoute.jsx
│   └── .env
├── backend/
│   ├── backend-node/            # Express API
│   │   ├── server.js            # All API routes
│   │   ├── seed_db.js           # Database seeder
│   │   └── .env
│   └── backend-python/          # Flask RAG pipeline
│       ├── rag_pipeline.py      # AI chatbot logic
│       └── requirements.txt
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- Python 3.9+
- MongoDB (running locally)

### Step 1 — Clone the repository
```bash
git clone https://github.com/navya-oss/Adaptive-RAG-for-Hospital-QA.git
cd Adaptive-RAG-for-Hospital-QA
```

### Step 2 — Set up environment variables

**`backend/backend-node/.env`**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/
FLASK_URL=http://127.0.0.1:5001
```

**`backend/backend-python/.env`**
```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
MONGO_URI=mongodb://localhost:27017/
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000
```

### Step 3 — Seed the database (run once)
```bash
cd backend/backend-node
npm install
node seed_db.js
```

### Step 4 — Start all services

Open 4 separate terminals:

**Terminal 1 — MongoDB**
```bash
mongod
```

**Terminal 2 — Node Backend**
```bash
cd backend/backend-node
node server.js
```

**Terminal 3 — Python RAG**
```bash
cd backend/backend-python
pip install -r requirements.txt
py rag_pipeline.py
```

**Terminal 4 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Credentials

| Role | ID / Email | Password |
|---|---|---|
| Patient | sanjay.reddy@email.com | pass300 |
| Patient | shreya.gupta@email.com | pass301 |
| Doctor | D201 | pass201! |
| Doctor | D200–D204 | pass200!–pass204! |
| Admin | admin001 | admin123 |

---

## 🤖 How the AI Works

1. User sends a question from the frontend
2. React sends it to Node.js `/ask` endpoint with role context
3. Node.js fetches relevant data from MongoDB and builds context
4. Context + question is forwarded to Flask RAG pipeline
5. Flask calls **Anthropic Claude API** with the full context as system prompt
6. Claude responds naturally and conversationally
7. Response is returned to the frontend

If the Anthropic API key is not set, the system falls back to an intelligent rule-based response engine.

---

## 📊 Sample Questions

**Patient asks:**
- "What is my next appointment?"
- "What medicines am I taking?"
- "Tell me about my disease"
- "Hospital visiting hours?"

**Doctor asks:**
- "How many patients do I have?"
- "Which patients are admitted?"
- "Show upcoming appointments"
- "Any critical patients?"

**Admin asks:**
- "Total doctors and patients"
- "Patients under treatment"
- "Doctor with most patients"
- "List all hospitals"
- "Disease breakdown"

---

## 👩‍💻 Developer

**Navya Kallubavikampa**
B.Tech Computer Engineering (AI) — Marwadi University, 2026
CGPA: 7.93

---

## 📄 License

This project is for academic and educational purposes.
