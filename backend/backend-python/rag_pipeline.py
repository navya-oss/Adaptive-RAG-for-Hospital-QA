# backend/backend-python/rag_pipeline.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os, re, sys, traceback, json

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

app = Flask(__name__)
CORS(app)

MONGO_URI    = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient(MONGO_URI)
db           = mongo_client["hospital_system"]
patients_col = db["patients"]
doctors_col  = db["doctors"]

try:
    import anthropic
    _key = os.getenv("ANTHROPIC_API_KEY", "")
    if not _key:
        raise ValueError("ANTHROPIC_API_KEY not set")
    claude     = anthropic.Anthropic(api_key=_key)
    USE_CLAUDE = True
    print("✅ Anthropic Claude loaded")
except Exception as e:
    USE_CLAUDE = False
    print(f"⚠️  Claude not available: {e} — using rule-based fallback")

print("✅ Flask RAG server ready")

# ─────────────────────────────────────────────────────────────
#  NORMALIZE
# ─────────────────────────────────────────────────────────────
def normalize(doc):
    if not doc: return {}
    d = {k: v for k, v in doc.items() if k != "_id"}
    if not d.get("userId"):
        d["userId"] = d.get("patient_Id") or d.get("Patient_ID") or ""
    if not d.get("name") and d.get("Patient_Name"):
        d["name"] = d["Patient_Name"]
    name    = d.get("name", "")
    surname = d.get("surname", "")
    d["full_name"] = (f"{name} {surname}".strip()
                      if surname and surname.lower() not in name.lower()
                      else name)
    d["disease"]    = d.get("disease")    or d.get("Disease", "")
    d["status"]     = d.get("status")     or d.get("Current_Status", "")
    d["treatment"]  = d.get("treatment")  or d.get("Medicines", "")
    d["procedures"] = d.get("procedures") or d.get("Procedures/Surgeries", "")
    raw_dr = d.get("doctor") or d.get("Doctor_Name", "")
    while "Dr.Dr." in raw_dr or "Dr. Dr." in raw_dr:
        raw_dr = raw_dr.replace("Dr.Dr.", "Dr.").replace("Dr. Dr.", "Dr.")
    d["doctor"]           = raw_dr
    d["hospital"]         = d.get("hospital")         or d.get("Hospital_Name", "")
    d["appointment"]      = d.get("appointment")      or d.get("Appointment_Date", "")
    d["next_appointment"] = d.get("next_appointment") or d.get("Next_Appointment_Date", "")
    return d

def ask_claude(system, user_msg):
    if not USE_CLAUDE: return None
    try:
        r = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=700,
            system=system,
            messages=[{"role": "user", "content": user_msg}]
        )
        return r.content[0].text
    except Exception as e:
        print(f"Claude API error: {e}")
        return None

# ─────────────────────────────────────────────────────────────
#  SYSTEM PROMPTS FOR CLAUDE
# ─────────────────────────────────────────────────────────────
def build_patient_prompt(patient):
    p = normalize(patient)
    return f"""You are MedBot, a warm and caring hospital AI assistant.
You are talking with patient {p.get('full_name') or p.get('name', 'the patient')}.

THEIR COMPLETE MEDICAL RECORD:
- Patient ID: {p.get('userId','N/A')}
- Name: {p.get('full_name') or p.get('name','N/A')}
- Age: {p.get('age','N/A')} | Gender: {p.get('gender','N/A')}
- Hospital: {p.get('hospital','N/A')}
- Doctor: {p.get('doctor','N/A')}
- Disease: {p.get('disease','N/A')}
- Status: {p.get('status','N/A')}
- Medicines: {p.get('treatment','N/A')}
- Procedures: {p.get('procedures','N/A')}
- Last Appointment: {p.get('appointment','N/A')}
- Next Appointment: {p.get('next_appointment','N/A')}

HOSPITAL INFO: Visiting 9AM-5PM Mon-Sat, Emergency 24/7, Appointments via reception/helpline, Emergency call 108.

RULES: Be warm and conversational like a real human assistant. Answer naturally in 2-4 sentences.
Use the patient's first name. Use exact data from above for medical questions.
For general hospital questions answer helpfully. Never invent medical data."""

def build_doctor_prompt(ctx):
    pats = ctx.get("patients", [])
    lines = [f"- {normalize(p).get('full_name') or normalize(p).get('name')} ({normalize(p).get('userId')}) | "
             f"{normalize(p).get('disease')} | {normalize(p).get('status')} | "
             f"Next Appt: {normalize(p).get('next_appointment')} | "
             f"Treatment: {normalize(p).get('treatment')}"
             for p in pats]
    counts = {}
    for p in pats:
        s = normalize(p).get("status","?")
        counts[s] = counts.get(s,0)+1
    return f"""You are MedBot, a professional clinical AI assistant for {ctx.get('name','the doctor')}.

DOCTOR: {ctx.get('name')} | {ctx.get('specialization')} | {ctx.get('hospital')} | {ctx.get('experience')} yrs
DEPARTMENTS: {ctx.get('departments')}

PATIENTS ({len(pats)} total) — Status breakdown: {json.dumps(counts)}
{chr(10).join(lines) if lines else 'No patients assigned.'}

RULES: Be professional and conversational. Give exact numbers when asked counts.
For critical/serious = focus on admitted patients. Answer naturally, not robotically."""

def build_admin_prompt(ctx):
    docs = ctx.get("doctors", [])
    pats = ctx.get("patients", [])
    status_map, hosp_map, disease_map, doc_map = {}, {}, {}, {}
    for p in pats:
        n = normalize(p)
        s = n.get("status","?");   status_map[s]  = status_map.get(s,0)+1
        h = n.get("hospital","?"); hosp_map[h]    = hosp_map.get(h,0)+1
        d = n.get("disease","?");  disease_map[d] = disease_map.get(d,0)+1
        dr = n.get("doctor","?");  doc_map[dr]    = doc_map.get(dr,0)+1

    doc_lines = [f"- {d.get('name')} ({d.get('doctorId')}) | {d.get('specialization')} | "
                 f"{d.get('hospital')} | {d.get('experience')} yrs exp | "
                 f"{doc_map.get(d.get('name'),0)} patients" for d in docs]

    pat_lines = [f"- {normalize(p).get('full_name') or normalize(p).get('name')} "
                 f"({normalize(p).get('userId')}) | {normalize(p).get('disease')} | "
                 f"{normalize(p).get('status')} | {normalize(p).get('doctor')} | "
                 f"{normalize(p).get('hospital')}" for p in pats]

    return f"""You are MedBot Admin AI — a smart, conversational hospital management assistant with FULL system access.

SYSTEM STATS:
- Total Doctors: {len(docs)} | Total Patients: {len(pats)} | Hospitals: {len(hosp_map)}
- Patient Status: {json.dumps(status_map)}
- By Hospital: {json.dumps(hosp_map)}
- Top Diseases: {json.dumps(dict(sorted(disease_map.items(),key=lambda x:-x[1])[:8]))}

ALL DOCTORS:
{chr(10).join(doc_lines)}

ALL PATIENTS:
{chr(10).join(pat_lines)}

RULES:
- Respond like a smart, helpful management assistant — natural conversation, NOT robotic bullet dumps
- Give exact accurate numbers from the data above
- For "patients under treatment" → list patients with status "Under Treatment"
- For "admitted" → list patients with status "Admitted"
- For "doctors" → list all doctors with specialization and patient count
- Make useful observations and insights when relevant
- Keep responses clear, organized and professional"""

# ─────────────────────────────────────────────────────────────
#  FALLBACK PATIENT
# ─────────────────────────────────────────────────────────────
def fallback_patient(info, q_raw):
    q  = q_raw.lower()
    nm = (info.get("full_name") or info.get("name") or "there").split()[0]
    h  = info.get("hospital") or "your hospital"
    dr = info.get("doctor") or "your doctor"

    if any(k in q for k in ["how to book","book appoint","schedule appoint","make appoint","book an appoint"]):
        return (f"To book an appointment at {h}, {nm}:\n\n"
                f"• Visit the reception desk in person\n"
                f"• Call the hospital helpline\n"
                f"• Ask {dr} to schedule your next visit\n\n"
                f"Bring your Patient ID ({info.get('userId','')}) when you go.")

    if any(k in q for k in ["next appoint","my appointment","when is my","appointment date"]):
        na = info.get("next_appointment")
        if na: return f"Your next appointment is on {na}, {nm}! Please arrive 15 minutes early and bring your Patient ID."
        return f"No upcoming appointment is scheduled yet. Please contact {h} to book one."

    if any(k in q for k in ["medicine","medication","drug","tablet","prescription","what am i taking","what medicines"]):
        t = info.get("treatment")
        if t: return f"You're currently prescribed: {t}.\n\nTake them exactly as directed by {dr} and don't stop without consulting first."
        return f"No medicine details are on record for you yet. Please ask {dr}."

    if any(k in q for k in ["lab","report","result","blood","urine","cbc","test result"]):
        return (f"Your lab reports are maintained at {h}.\n\n"
                f"Collect them from reception with your Patient ID ({info.get('userId','')}) "
                f"or ask {dr} at your next visit on {info.get('next_appointment','N/A')}.")

    if any(k in q for k in ["procedure","surgery","operation","scan","mri","ct"]):
        p = info.get("procedures","")
        if p and p.lower() not in ("none",""):
            return f"Your recorded procedure(s): {p}."
        return "No procedures are currently recorded for you."

    if any(k in q for k in ["disease","condition","diagnosis","illness","what do i have","tell me about"]):
        d = info.get("disease","")
        if d:
            return (f"You've been diagnosed with {d}, {nm}.\n\n"
                    f"• Status: {info.get('status','N/A')}\n"
                    f"• Doctor: {dr}\n"
                    f"• Treatment: {info.get('treatment','N/A')}")
        return "No diagnosis on record yet. Please consult your doctor."

    if any(k in q for k in ["status","how am i","current","progress","treatment going"]):
        return (f"Here's your current health summary, {nm}:\n\n"
                f"• Condition: {info.get('disease','N/A')}\n"
                f"• Status: {info.get('status','N/A')}\n"
                f"• Treatment: {info.get('treatment','N/A')}\n"
                f"• Doctor: {dr}\n"
                f"• Next Appointment: {info.get('next_appointment','N/A')}")

    if any(k in q for k in ["visiting hour","hospital hour","open","timing","working hour"]):
        return (f"Visiting hours at {h}:\n\n"
                f"• General Ward: 9:00 AM – 5:00 PM, Mon–Sat\n"
                f"• ICU: 10:00 AM–12:00 PM & 4:00–6:00 PM\n"
                f"• Emergency: Open 24/7")

    if any(k in q for k in ["emergency","ambulance","urgent"]):
        return "For emergencies call 108 (free) or go straight to the Emergency ward — open 24/7."

    if any(k in q for k in ["fee","cost","bill","charge","price","how much"]):
        return "Costs vary by procedure. Contact the billing department for a detailed estimate."

    if any(k in q for k in ["doctor","physician","consultant","who is my doctor"]):
        return f"Your consulting doctor is {dr} at {h}."

    lines = [f"Hi {nm}! Here's your medical summary:\n"]
    for label, val in [("Condition", info.get("disease")), ("Status", info.get("status")),
                       ("Doctor", dr), ("Treatment", info.get("treatment")),
                       ("Next Appointment", info.get("next_appointment"))]:
        if val and str(val).lower() not in ("none",""):
            lines.append(f"• {label}: {val}")
    return "\n".join(lines)

# ─────────────────────────────────────────────────────────────
#  FALLBACK DOCTOR
# ─────────────────────────────────────────────────────────────
def fallback_doctor(q_raw, ctx):
    q    = q_raw.lower()
    pats = ctx.get("patients",[])

    if any(k in q for k in ["how many","count","total patient","number of"]):
        a = sum(1 for p in pats if "admit"     in str(normalize(p).get("status","")).lower())
        t = sum(1 for p in pats if "treatment" in str(normalize(p).get("status","")).lower())
        d = sum(1 for p in pats if "discharg"  in str(normalize(p).get("status","")).lower())
        f = sum(1 for p in pats if "follow"    in str(normalize(p).get("status","")).lower())
        return (f"You have {len(pats)} patients assigned to you.\n\n"
                f"• Admitted: {a}\n• Under Treatment: {t}\n• Discharged: {d}\n• Follow-up: {f}")

    if any(k in q for k in ["list","all patient","my patient","show all","show patient"]):
        if not pats: return "No patients assigned to you yet."
        lines = [f"Your {len(pats)} patients:\n"]
        for p in pats:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — {n.get('disease')} — {n.get('status')}")
        return "\n".join(lines)

    if any(k in q for k in ["critical","serious","admitted","in ward","emergency"]):
        sub = [p for p in pats if "admit" in str(normalize(p).get("status","")).lower()]
        if not sub: return "None of your patients are currently admitted."
        lines = [f"{len(sub)} admitted patient(s):\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — {n.get('disease')} — Treatment: {n.get('treatment','N/A')}")
        return "\n".join(lines)

    if any(k in q for k in ["under treatment","active treatment","currently treating","treatment"]):
        sub = [p for p in pats if "treatment" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No patients currently under active treatment."
        lines = [f"{len(sub)} patient(s) under treatment:\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — {n.get('disease')} — {n.get('treatment','N/A')}")
        return "\n".join(lines)

    if any(k in q for k in ["discharged","discharge","sent home"]):
        sub = [p for p in pats if "discharg" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No patients have been discharged yet."
        lines = [f"{len(sub)} discharged patient(s):\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — {n.get('disease')}")
        return "\n".join(lines)

    if any(k in q for k in ["follow-up","follow up","followup"]):
        sub = [p for p in pats if "follow" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No patients on follow-up currently."
        lines = [f"{len(sub)} patient(s) on follow-up:\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — {n.get('disease')}")
        return "\n".join(lines)

    if any(k in q for k in ["appointment","upcoming","schedule","next visit"]):
        with_appt = sorted([p for p in pats if normalize(p).get("next_appointment")],
                           key=lambda p: normalize(p).get("next_appointment",""))
        if not with_appt: return "No upcoming appointments found."
        lines = ["Upcoming appointments:\n"]
        for p in with_appt[:10]:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — {n.get('next_appointment')} — {n.get('disease')}")
        return "\n".join(lines)

    if any(k in q for k in ["qualification","degree","experience","specialist","my info","about me"]):
        return (f"{ctx.get('name')}\n\n"
                f"• Specialization: {ctx.get('specialization','N/A')}\n"
                f"• Hospital: {ctx.get('hospital','N/A')}\n"
                f"• Experience: {ctx.get('experience','N/A')} years\n"
                f"• Departments: {ctx.get('departments','N/A')}")

    for p in pats:
        n     = normalize(p)
        pid   = str(n.get("userId","")).lower()
        pname = str(n.get("name","")).lower()
        words = [w for w in q.split() if len(w) > 2]
        skip  = {"what","show","tell","give","list","find","about","patient","the","who","how","when","which","my","me"}
        if pid in q or any(w in pname for w in words if w not in skip):
            return fallback_patient(n, q_raw)

    return (f"I can help with your {len(pats)} patients. Try asking:\n"
            f"• 'How many patients do I have?'\n"
            f"• 'List all my patients'\n"
            f"• 'Which patients are admitted?'\n"
            f"• 'Patients under treatment'\n"
            f"• 'Show upcoming appointments'\n"
            f"Or ask about a specific patient by name.")

# ─────────────────────────────────────────────────────────────
#  FALLBACK ADMIN — fully fixed, correct order
# ─────────────────────────────────────────────────────────────
def fallback_admin(q_raw, ctx):
    q    = q_raw.lower()
    docs = ctx.get("doctors",  [])
    pats = ctx.get("patients", [])

    status_map, hosp_map, disease_map = {}, {}, {}
    for p in pats:
        n = normalize(p)
        s = n.get("status","Unknown"); status_map[s] = status_map.get(s,0)+1
        h = n.get("hospital","?");     hosp_map[h]   = hosp_map.get(h,0)+1
        d = n.get("disease","?");      disease_map[d] = disease_map.get(d,0)+1

    # ── 1. DOCTOR WITH MOST PATIENTS (must be FIRST before doctor list) ──────
    if any(k in q for k in ["most patient","top doctor","busiest","highest",
                              "which doctor","doctor with most","rank"]):
        doc_counts = {}
        for p in pats:
            d = normalize(p).get("doctor","?")
            doc_counts[d] = doc_counts.get(d,0)+1
        lines = ["Doctors ranked by number of patients:\n"]
        for d,c in sorted(doc_counts.items(), key=lambda x:-x[1]):
            lines.append(f"• {d}: {c} patients")
        return "\n".join(lines)

    # ── 2. HOSPITALS (must be BEFORE overview so "list all hospitals" works) ──
    if any(k in q for k in ["hospital","list hospital","all hospital","show hospital"]):
        lines = ["Patients by hospital:\n"]
        for h,c in sorted(hosp_map.items(), key=lambda x:-x[1]):
            lines.append(f"• {h}: {c} patient(s)")
        return "\n".join(lines)

    # ── 3. DOCTORS LIST (must be BEFORE overview) ────────────────────────────
    if any(k in q for k in ["list doctor","all doctor","show doctor",
                              "specialization","by specialization","list all doctor"]):
        lines = [f"All {len(docs)} doctors:\n"]
        for d in docs:
            pc = sum(1 for p in pats if normalize(p).get("doctor")==d.get("name"))
            lines.append(f"• {d.get('name')} ({d.get('doctorId')}) — "
                         f"{d.get('specialization')} — "
                         f"{d.get('hospital')} — "
                         f"{d.get('experience')} yrs — "
                         f"{pc} patients")
        return "\n".join(lines)

    # ── 4. ALL PATIENTS LIST ─────────────────────────────────────────────────
    if any(k in q for k in ["list patient","all patient","show patient","patient list"]):
        lines = [f"All {len(pats)} patients:\n"]
        for p in pats:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — "
                         f"{n.get('disease')} — {n.get('status')} — {n.get('hospital')}")
        return "\n".join(lines)

    # ── 5. UNDER TREATMENT ───────────────────────────────────────────────────
    if any(k in q for k in ["under treatment","patients under treatment",
                              "active treatment","currently treating","being treated",
                              "treatment"]):
        sub = [p for p in pats if "treatment" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No patients are currently under treatment."
        lines = [f"{len(sub)} patients currently under treatment:\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — "
                         f"{n.get('disease')} — {n.get('doctor')} — {n.get('hospital')}")
        return "\n".join(lines)

    # ── 6. ADMITTED ──────────────────────────────────────────────────────────
    if any(k in q for k in ["admitted","in ward","currently admitted","who is admitted"]):
        sub = [p for p in pats if "admit" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No patients are currently admitted."
        lines = [f"{len(sub)} patients currently admitted:\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — "
                         f"{n.get('disease')} — {n.get('doctor')} — {n.get('hospital')}")
        return "\n".join(lines)

    # ── 7. DISCHARGED ────────────────────────────────────────────────────────
    if any(k in q for k in ["discharged","discharge","sent home","released"]):
        sub = [p for p in pats if "discharg" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No discharged patients found."
        lines = [f"{len(sub)} discharged patients:\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — "
                         f"{n.get('disease')} — {n.get('doctor')}")
        return "\n".join(lines)

    # ── 8. FOLLOW-UP ─────────────────────────────────────────────────────────
    if any(k in q for k in ["follow-up","follow up","followup","monitoring"]):
        sub = [p for p in pats if "follow" in str(normalize(p).get("status","")).lower()]
        if not sub: return "No patients on follow-up currently."
        lines = [f"{len(sub)} patients on follow-up:\n"]
        for p in sub:
            n = normalize(p)
            lines.append(f"• {n.get('full_name') or n.get('name')} ({n.get('userId')}) — "
                         f"{n.get('disease')} — {n.get('doctor')}")
        return "\n".join(lines)

    # ── 9. OVERVIEW / STATS (after all specific checks) ──────────────────────
    if any(k in q for k in ["total","how many","summary","overview","count","stats"]):
        return (f"System Overview:\n\n"
                f"• Total Doctors: {len(docs)}\n"
                f"• Total Patients: {len(pats)}\n"
                f"• Hospitals: {len(hosp_map)}\n"
                f"• Admitted: {status_map.get('Admitted',0)}\n"
                f"• Under Treatment: {status_map.get('Under Treatment',0)}\n"
                f"• Discharged: {status_map.get('Discharged',0)}\n"
                f"• Follow-up: {status_map.get('Follow-up',0)}")

    # ── 10. DISEASE BREAKDOWN ────────────────────────────────────────────────
    if any(k in q for k in ["disease","condition","illness","diagnos",
                              "common disease","most common"]):
        lines = ["Disease distribution:\n"]
        for d,c in sorted(disease_map.items(), key=lambda x:-x[1]):
            lines.append(f"• {d}: {c} patient(s)")
        return "\n".join(lines)

    # ── 11. SPECIFIC DOCTOR LOOKUP ───────────────────────────────────────────
    for d in docs:
        dname = d.get("name","").lower()
        did   = d.get("doctorId","").lower()
        if dname in q or did in q:
            pc      = sum(1 for p in pats if normalize(p).get("doctor")==d.get("name"))
            my_pats = [p for p in pats if normalize(p).get("doctor")==d.get("name")]
            lines   = [f"{d.get('name')} ({d.get('doctorId')}):\n",
                       f"• Specialization: {d.get('specialization')}",
                       f"• Hospital: {d.get('hospital')}",
                       f"• Experience: {d.get('experience')} years",
                       f"• Total Patients: {pc}\n",
                       "Patients:"]
            for p in my_pats:
                n = normalize(p)
                lines.append(f"  - {n.get('full_name') or n.get('name')} "
                             f"({n.get('userId')}) — {n.get('disease')} — {n.get('status')}")
            return "\n".join(lines)

    # ── 12. SPECIFIC PATIENT LOOKUP ──────────────────────────────────────────
    for p in pats:
        n     = normalize(p)
        pid   = str(n.get("userId","")).lower()
        pname = str(n.get("name","")).lower()
        if pid in q or pname in q:
            return (f"Patient: {n.get('full_name') or n.get('name')} ({n.get('userId')})\n\n"
                    f"• Disease: {n.get('disease','N/A')}\n"
                    f"• Status: {n.get('status','N/A')}\n"
                    f"• Doctor: {n.get('doctor','N/A')}\n"
                    f"• Hospital: {n.get('hospital','N/A')}\n"
                    f"• Treatment: {n.get('treatment','N/A')}\n"
                    f"• Next Appointment: {n.get('next_appointment','N/A')}")

    # ── 13. HOSPITAL INFO ────────────────────────────────────────────────────
    if any(k in q for k in ["visiting hour","timing","open","emergency",
                              "contact","phone","fee","book","appointment"]):
        return ("Hospital Information:\n\n"
                "• Visiting Hours: 9:00 AM – 5:00 PM, Mon–Sat\n"
                "• ICU Visits: 10:00 AM–12:00 PM & 4:00–6:00 PM\n"
                "• Emergency: 24/7 | Call 108\n"
                "• Appointments: Visit reception or call helpline")

    # ── 14. DEFAULT HELP ─────────────────────────────────────────────────────
    return (f"I have full access to all hospital data — {len(docs)} doctors and {len(pats)} patients.\n\n"
            f"You can ask me:\n"
            f"• 'Total doctors and patients' — system overview\n"
            f"• 'List all hospitals' — {len(hosp_map)} hospitals\n"
            f"• 'Doctors by specialization' — all {len(docs)} doctors\n"
            f"• 'Which patients are admitted?' — {status_map.get('Admitted',0)} currently\n"
            f"• 'Patients under treatment' — {status_map.get('Under Treatment',0)} currently\n"
            f"• 'Doctor with most patients' — ranking\n"
            f"• 'Disease breakdown' — distribution\n"
            f"• Any specific doctor or patient name")

# ─────────────────────────────────────────────────────────────
#  MAIN RAG ROUTE
# ─────────────────────────────────────────────────────────────
@app.route("/rag", methods=["POST"])
def rag():
    try:
        data           = request.get_json() or {}
        question       = (data.get("question")    or "").strip()
        patient_id     = (data.get("patientId")   or "").strip()
        doctor_context = data.get("doctorContext")
        admin_context  = data.get("adminContext")

        if not question:
            return jsonify({"error": "No question provided"}), 400

        # ── ADMIN ─────────────────────────────────────────────
        if admin_context:
            if USE_CLAUDE:
                ans = ask_claude(build_admin_prompt(admin_context), question)
                if ans: return jsonify({"question": question, "answer": ans, "role": "admin"})
            return jsonify({"question": question,
                            "answer": fallback_admin(question, admin_context),
                            "role": "admin"})

        # ── DOCTOR ────────────────────────────────────────────
        if doctor_context:
            if USE_CLAUDE:
                ans = ask_claude(build_doctor_prompt(doctor_context), question)
                if ans: return jsonify({"question": question, "answer": ans, "role": "doctor"})
            return jsonify({"question": question,
                            "answer": fallback_doctor(question, doctor_context),
                            "role": "doctor"})

        # ── PATIENT ───────────────────────────────────────────
        if patient_id:
            pid = patient_id.strip().upper()
            if not pid.startswith("P") and pid.isdigit(): pid = f"P{pid}"

            found = patients_col.find_one({"$or": [
                {"userId": pid}, {"patient_Id": pid}, {"Patient_ID": pid},
                {"email": {"$regex": f"^{re.escape(patient_id)}$", "$options": "i"}},
            ]})

            if not found:
                num = re.sub(r"[^0-9]", "", pid)
                if num:
                    for d in patients_col.find({}):
                        for cid in [str(d.get("userId","")),
                                    str(d.get("patient_Id","")),
                                    str(d.get("Patient_ID",""))]:
                            if cid and num in cid: found = d; break
                        if found: break

            if found:
                info = normalize(found)
                if USE_CLAUDE:
                    ans = ask_claude(build_patient_prompt(found), question)
                    if ans: return jsonify({"question": question, "answer": ans, "personalized": True})
                return jsonify({"question": question,
                                "answer": fallback_patient(info, question),
                                "personalized": True})

            return jsonify({"question": question,
                            "answer": f"I couldn't find a record for '{patient_id}'. Please check your ID or contact hospital reception.",
                            "personalized": False})

        # ── GENERAL ───────────────────────────────────────────
        gen_system = ("You are MedBot, a helpful hospital assistant. "
                      "Answer general hospital questions warmly and concisely. "
                      "Visiting hours: 9AM-5PM Mon-Sat. Emergency: 24/7. "
                      "Appointments: visit reception or call helpline. Emergency: call 108.")
        if USE_CLAUDE:
            ans = ask_claude(gen_system, question)
            if ans: return jsonify({"question": question, "answer": ans})

        return jsonify({"question": question,
                        "answer": ("I'm MedBot! I can help with visiting hours, appointment booking, "
                                   "and general hospital info. For personal medical questions, "
                                   "please log in with your Patient ID.")})

    except Exception as e:
        print("❌ RAG error:", e)
        traceback.print_exc()
        return jsonify({"error": "RAG pipeline error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)