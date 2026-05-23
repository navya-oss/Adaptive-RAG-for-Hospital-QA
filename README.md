# Hospital QA System — Setup Guide

## Project Structure

```
hospital-qa-rag-js/
├── frontend/                   ← React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── Context/
│   │   │   └── AuthContext.jsx
│   │   ├── Components/
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── Home.jsx / Home.css
│   │       ├── Login.jsx
│   │       ├── Registration.jsx / Registration.css
│   │       ├── Patient.jsx / Patient.css
│   │       ├── DoctorLogin.jsx
│   │       ├── Doctor.jsx / Doctor.css
│   │       ├── AdminLogin.jsx
│   │       ├── AdminDashboard.jsx / Admin.css
│   └── .env
├── backend/
│   ├── backend-node/
│   │   ├── server.js           ← Express API
│   │   ├── seed_db.js          ← DB seeder (run once)
│   │   ├── package.json
│   │   └── .env
│   └── backend-python/
│       ├── rag_pipeline.py     ← Flask + FAISS + Flan-T5
│       └── requirements.txt
```

---

## Prerequisites

- Node.js v18+
- Python 3.9+
- MongoDB (running locally)

---

## Step 1 — Start MongoDB

```bash
mongod
```

---

## Step 2 — Seed the Database (run ONCE)

```bash
cd backend/backend-node
npm install
node seed_db.js
```

This inserts all 20 patients, 5 doctors, and 1 admin.

---

## Step 3 — Start Node Backend

```bash
cd backend/backend-node
npm start
# Runs on http://localhost:5000
```

---

## Step 4 — Start Python RAG Backend

```bash
cd backend/backend-python
pip install -r requirements.txt
python rag_pipeline.py
# Runs on http://localhost:5001
# First run downloads AI models (~500MB) — wait for "Ready!"
```

---

## Step 5 — Start Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Login Credentials

| Role    | ID       | Password   |
|---------|----------|------------|
| Patient | P300     | pass300    |
| Patient | P301     | pass301    |
| ...     | P302–P319| pass302–319|
| Doctor  | D201     | pass201!   |
| Doctor  | D200–D204| pass200!–204!|
| Admin   | admin001 | admin123   |

---

## What Each Portal Does

### Patient Portal (/patient)
- See full medical record: disease, medicines, procedures, lab results, appointments
- Chatbot answers personal questions about their own record
- Quick-ask chips for common queries
- File upload section

### Doctor Dashboard (/doctor)
- See doctor profile, qualifications, departments
- Clickable patient list with expandable details
- Chatbot knows all assigned patients
- Ask: "How many patients?", "Who is admitted?", "Show P307 details"

### Admin Dashboard (/admin-dashboard)
- Stats cards: total doctors, patients, admitted, discharged etc.
- Bar charts: patients by hospital and by status
- AI chatbot with full system access
- Searchable tables for all doctors and patients

---

## Troubleshooting

**"Cannot reach backend"**
→ Make sure `node server.js` is running on port 5000

**"Failed to reach Flask"**
→ Make sure `python rag_pipeline.py` is running on port 5001

**Patient not found after registration**
→ Use the email you registered with to login (not patient ID)

**Models downloading slowly**
→ First run of `rag_pipeline.py` downloads ~500MB of AI models. Wait for "Ready!" message.
