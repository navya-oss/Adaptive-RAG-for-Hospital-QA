// seed_db.js — Run once to populate MongoDB
// Usage: node seed_db.js

import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/");
await client.connect();
console.log("✅ Connected to MongoDB");

const db = client.db("hospital_system");

// ── CLEAR existing data ──────────────────────────────────────
await db.collection("patients").deleteMany({});
await db.collection("doctors").deleteMany({});
await db.collection("admins").deleteMany({});
console.log("🧹 Cleared existing collections");

// ── DOCTORS ──────────────────────────────────────────────────
const doctors = [
  { doctorId:"D200", name:"Dr. Asha Reddy",   specialization:"Radiology",       departments:"Radiology, General Medicine, Orthopedics, Endocrinology, Cardiology", hospital:"Lotus MultiSpeciality Hospital", experience:"26", qualification:"MD Radiology, FRCR",            password:"pass200!" },
  { doctorId:"D201", name:"Dr. Ravi Kumar",   specialization:"Neurology",       departments:"Neurology, Radiology, Psychiatry, Pulmonology, Gastroenterology",       hospital:"CityCare Medical Centre",        experience:"5",  qualification:"MD Neurology, DM",               password:"pass201!" },
  { doctorId:"D202", name:"Dr. Neha Sharma",  specialization:"General Medicine", departments:"General Medicine, Pulmonology, Cardiology, Gastroenterology, Neurology", hospital:"Prima Diagnostic & Care",       experience:"27", qualification:"MBBS, MD General Medicine, DNB",  password:"pass202!" },
  { doctorId:"D203", name:"Dr. Kiran Rao",    specialization:"Endocrinology",   departments:"Endocrinology, Neurology, Psychiatry, Radiology, Cardiology",            hospital:"RiverSide Healthcare",           experience:"16", qualification:"MD Endocrinology, DM, FACE",     password:"pass203!" },
  { doctorId:"D204", name:"Dr. Suresh Patel", specialization:"Nephrology",      departments:"Nephrology, Psychiatry, Neurology, Radiology, Cardiology",               hospital:"Prima Diagnostic & Care",        experience:"22", qualification:"MD Nephrology, DM, FASN",        password:"pass204!" },
];

// ── PATIENTS ─────────────────────────────────────────────────
const patients = [
  { userId:"P300", name:"Sanjay",   surname:"Reddy",   email:"sanjay.reddy@email.com",   phone:"+91-9000000300", age:"9",  gender:"M", hospital:"CityCare Medical Centre",        disease:"Pneumonia",            status:"Under Treatment", treatment:"Ceftriaxone, Clopidogrel, Omeprazole, Atorvastatin", procedures:"Endoscopy",                          appointment:"2025-12-19", next_appointment:"2026-03-04", doctor:"Dr. Ravi Kumar",   doctor_id:"D201", password:"pass300" },
  { userId:"P301", name:"Shreya",   surname:"Gupta",   email:"shreya.gupta@email.com",   phone:"+91-9000000301", age:"21", gender:"F", hospital:"RiverSide Healthcare",           disease:"Type 2 Diabetes",      status:"Under Treatment", treatment:"Furosemide",                                         procedures:"Dialysis Session",                   appointment:"2025-08-03", next_appointment:"2025-09-29", doctor:"Dr. Kiran Rao",    doctor_id:"D203", password:"pass301" },
  { userId:"P302", name:"Ritu",     surname:"Chawla",  email:"ritu.chawla1@email.com",   phone:"+91-9000000302", age:"19", gender:"F", hospital:"CityCare Medical Centre",        disease:"Hypertension",         status:"Discharged",       treatment:"Metformin, Atorvastatin, Losartan",                  procedures:"Coronary Angiography",               appointment:"2025-10-04", next_appointment:"2025-11-29", doctor:"Dr. Kiran Rao",    doctor_id:"D203", password:"pass302" },
  { userId:"P303", name:"Ritu",     surname:"Chawla",  email:"ritu.chawla2@email.com",   phone:"+91-9000000303", age:"77", gender:"F", hospital:"Prima Diagnostic & Care",        disease:"Fracture - Radius",    status:"Under Treatment", treatment:"Amoxicillin, Aspirin, Salbutamol",                   procedures:"None",                               appointment:"2024-09-26", next_appointment:"2024-12-22", doctor:"Dr. Neha Sharma",  doctor_id:"D202", password:"pass303" },
  { userId:"P304", name:"Kavya",    surname:"Menon",   email:"kavya.menon@email.com",    phone:"+91-9000000304", age:"82", gender:"Other", hospital:"Prima Diagnostic & Care",   disease:"Acute Appendicitis",   status:"Discharged",       treatment:"Enoxaparin, Paracetamol, Amoxicillin",               procedures:"None",                               appointment:"2024-09-03", next_appointment:"2024-09-18", doctor:"Dr. Suresh Patel", doctor_id:"D204", password:"pass304" },
  { userId:"P305", name:"Arjun",    surname:"Nair",    email:"arjun.nair@email.com",     phone:"+91-9000000305", age:"17", gender:"M", hospital:"RiverSide Healthcare",           disease:"Migraine",             status:"Discharged",       treatment:"Salbutamol, Ceftriaxone, Clopidogrel",               procedures:"Physiotherapy Session",              appointment:"2024-09-10", next_appointment:"2024-12-01", doctor:"Dr. Suresh Patel", doctor_id:"D204", password:"pass305" },
  { userId:"P306", name:"Priya",    surname:"Reddy",   email:"priya.reddy1@email.com",   phone:"+91-9000000306", age:"30", gender:"Other", hospital:"CityCare Medical Centre",   disease:"Urinary Tract Infection", status:"Admitted",       treatment:"Amoxicillin, Losartan, Metformin",                   procedures:"Laparoscopic Cholecystectomy",        appointment:"2024-05-15", next_appointment:"2024-07-13", doctor:"Dr. Ravi Kumar",   doctor_id:"D201", password:"pass306" },
  { userId:"P307", name:"Abhishek", surname:"Das",     email:"abhishek.das@email.com",   phone:"+91-9000000307", age:"13", gender:"M", hospital:"RiverSide Healthcare",           disease:"Cholelithiasis",       status:"Under Treatment", treatment:"Furosemide, Clopidogrel, Amoxicillin",               procedures:"None",                               appointment:"2025-04-04", next_appointment:"2025-06-09", doctor:"Dr. Ravi Kumar",   doctor_id:"D201", password:"pass307" },
  { userId:"P308", name:"Ritu",     surname:"Chawla",  email:"ritu.chawla3@email.com",   phone:"+91-9000000308", age:"10", gender:"F", hospital:"Prima Diagnostic & Care",        disease:"Ischemic Heart Disease", status:"Admitted",       treatment:"Enoxaparin, Prednisone, Metformin, Salbutamol",      procedures:"None",                               appointment:"2025-02-03", next_appointment:"2025-04-22", doctor:"Dr. Kiran Rao",    doctor_id:"D203", password:"pass308" },
  { userId:"P309", name:"Rakesh",   surname:"Gupta",   email:"rakesh.gupta@email.com",   phone:"+91-9000000309", age:"20", gender:"M", hospital:"Lotus MultiSpeciality Hospital", disease:"COPD",                 status:"Discharged",       treatment:"Losartan, Clopidogrel, Prednisone, Atorvastatin",    procedures:"None",                               appointment:"2024-03-11", next_appointment:"2024-05-08", doctor:"Dr. Asha Reddy",   doctor_id:"D200", password:"pass309" },
  { userId:"P310", name:"Siddharth",surname:"Iyer",    email:"siddharth.iyer@email.com", phone:"+91-9000000310", age:"73", gender:"M", hospital:"Prima Diagnostic & Care",        disease:"Stroke",               status:"Admitted",         treatment:"Aspirin, Salbutamol",                                procedures:"None",                               appointment:"2025-04-13", next_appointment:"2025-07-08", doctor:"Dr. Suresh Patel", doctor_id:"D204", password:"pass310" },
  { userId:"P311", name:"Manoj",    surname:"Singh",   email:"manoj.singh1@email.com",   phone:"+91-9000000311", age:"13", gender:"M", hospital:"Prima Diagnostic & Care",        disease:"Hypothyroidism",       status:"Discharged",       treatment:"Atorvastatin, Enoxaparin, Losartan",                 procedures:"MRI Brain, Hemodialysis",            appointment:"2025-11-14", next_appointment:"2025-12-08", doctor:"Dr. Neha Sharma",  doctor_id:"D202", password:"pass311" },
  { userId:"P312", name:"Sanjay",   surname:"Reddy",   email:"sanjay.reddy2@email.com",  phone:"+91-9000000312", age:"15", gender:"M", hospital:"Prima Diagnostic & Care",        disease:"Gastritis",            status:"Discharged",       treatment:"Aspirin, Clopidogrel, Paracetamol, Amoxicillin",     procedures:"Dialysis Session, MRI Brain",        appointment:"2024-05-13", next_appointment:"2024-07-29", doctor:"Dr. Kiran Rao",    doctor_id:"D203", password:"pass312" },
  { userId:"P313", name:"Manoj",    surname:"Singh",   email:"manoj.singh2@email.com",   phone:"+91-9000000313", age:"72", gender:"M", hospital:"Green Valley General Hospital",  disease:"Chronic Kidney Disease", status:"Admitted",       treatment:"Salbutamol, Atorvastatin",                           procedures:"None",                               appointment:"2025-01-01", next_appointment:"2025-02-22", doctor:"Dr. Suresh Patel", doctor_id:"D204", password:"pass313" },
  { userId:"P314", name:"Priya",    surname:"Reddy",   email:"priya.reddy2@email.com",   phone:"+91-9000000314", age:"53", gender:"Other", hospital:"CityCare Medical Centre",   disease:"Anemia",               status:"Discharged",       treatment:"Furosemide, Salbutamol, Prednisone",                 procedures:"Tracheostomy, CT Scan",              appointment:"2024-04-20", next_appointment:"2024-05-25", doctor:"Dr. Ravi Kumar",   doctor_id:"D201", password:"pass314" },
  { userId:"P315", name:"Priya",    surname:"Reddy",   email:"priya.reddy3@email.com",   phone:"+91-9000000315", age:"59", gender:"F", hospital:"Lotus MultiSpeciality Hospital", disease:"Depression",           status:"Discharged",       treatment:"Furosemide",                                         procedures:"Endoscopy",                          appointment:"2025-11-26", next_appointment:"2026-01-05", doctor:"Dr. Ravi Kumar",   doctor_id:"D201", password:"pass315" },
  { userId:"P316", name:"Neha",     surname:"Kapoor",  email:"neha.kapoor@email.com",    phone:"+91-9000000316", age:"75", gender:"F", hospital:"Green Valley General Hospital",  disease:"Asthma",               status:"Admitted",         treatment:"Prednisone, Levothyroxine, Metformin, Aspirin",      procedures:"None",                               appointment:"2025-06-16", next_appointment:"2025-07-01", doctor:"Dr. Neha Sharma",  doctor_id:"D202", password:"pass316" },
  { userId:"P317", name:"Priya",    surname:"Reddy",   email:"priya.reddy4@email.com",   phone:"+91-9000000317", age:"80", gender:"F", hospital:"Green Valley General Hospital",  disease:"Osteoarthritis",       status:"Under Treatment", treatment:"Metformin, Salbutamol",                              procedures:"Dialysis Session, Laparoscopic Cholecystectomy", appointment:"2024-11-04", next_appointment:"2024-12-07", doctor:"Dr. Kiran Rao", doctor_id:"D203", password:"pass317" },
  { userId:"P318", name:"Meera",    surname:"Patel",   email:"meera.patel@email.com",    phone:"+91-9000000318", age:"75", gender:"Other", hospital:"Lotus MultiSpeciality Hospital", disease:"Otitis Media",     status:"Follow-up",        treatment:"Aspirin",                                            procedures:"Laparoscopic Cholecystectomy",        appointment:"2024-08-28", next_appointment:"2024-09-22", doctor:"Dr. Asha Reddy",   doctor_id:"D200", password:"pass318" },
  { userId:"P319", name:"Manoj",    surname:"Singh",   email:"manoj.singh3@email.com",   phone:"+91-9000000319", age:"6",  gender:"M", hospital:"RiverSide Healthcare",           disease:"Sepsis",               status:"Admitted",         treatment:"Atorvastatin, Ceftriaxone",                          procedures:"Appendectomy, Coronary Angiography",  appointment:"2025-12-13", next_appointment:"2026-01-04", doctor:"Dr. Kiran Rao",    doctor_id:"D203", password:"pass319" },
];

// ── ADMIN ────────────────────────────────────────────────────
const admins = [
  { adminId:"admin001", name:"Hospital Admin", password:"admin123" },
];

// ── INSERT ───────────────────────────────────────────────────
await db.collection("doctors").insertMany(doctors);
console.log(`✅ Inserted ${doctors.length} doctors`);

await db.collection("patients").insertMany(patients);
console.log(`✅ Inserted ${patients.length} patients`);

await db.collection("admins").insertMany(admins);
console.log(`✅ Inserted ${admins.length} admins`);

await client.close();
console.log("\n🎉 Database seeded successfully!");
console.log("\n📋 Login credentials:");
console.log("  Patients: P300–P319 | Password: pass300 – pass319");
console.log("  Doctors:  D200–D204 | Password: pass200! – pass204!");
console.log("  Admin:    admin001  | Password: admin123");
