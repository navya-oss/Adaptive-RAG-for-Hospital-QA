import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import axios from "axios";

dotenv.config();

const app       = express();
const PORT      = process.env.PORT      || 5000;
const FLASK_URL = process.env.FLASK_URL || "http://127.0.0.1:5001";

app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(bodyParser.json());

// ── MongoDB ───────────────────────────────────────────────────
let db, patients_col, doctors_col, admins_col;
try {
  const client = new MongoClient(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/");
  await client.connect();
  console.log("✅ Connected to MongoDB");
  db           = client.db("hospital_system");
  patients_col = db.collection("patients");
  doctors_col  = db.collection("doctors");
  admins_col   = db.collection("admins");
} catch (err) {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
}

function clean(doc) {
  if (!doc) return doc;
  const d = { ...doc };
  delete d._id;
  if (!d.userId) { d.userId = d.patient_Id || d.Patient_ID || ""; }
  return d;
}

async function nextId() {
  let max = 319;
  await patients_col.find({ $or:[{userId:{$regex:/^P\d+$/}},{patient_Id:{$regex:/^P\d+$/}}] }).forEach(d=>{
    const id = d.userId||d.patient_Id||""; const n=parseInt(id.replace(/^P/,""),10);
    if(!isNaN(n)&&n>max) max=n;
  });
  return `P${max+1}`;
}

app.get("/", (req,res) => res.json({status:"ok",message:"Hospital QA Backend running"}));

app.post("/register", async(req,res)=>{
  try{
    const {name,surname,email,address,state,phone,password,age,gender,hospital,disease,treatment,procedures,doctor,appointment}=req.body;
    if(!email||!password||!name) return res.status(400).json({success:false,message:"Name, email and password required."});
    if(await patients_col.findOne({email})) return res.status(400).json({success:false,message:"Email already registered."});
    const userId=await nextId();
    await patients_col.insertOne({userId,name,surname:surname||"",email,address:address||"",state:state||"",phone:phone||"",password,age:age||"",gender:gender||"",hospital:hospital||"",disease:disease||"",treatment:treatment||"",procedures:procedures||"",doctor:doctor||"",appointment:appointment||"",createdAt:new Date()});
    return res.status(201).json({success:true,message:"Registered successfully!",userId});
  }catch(e){console.error(e);return res.status(500).json({success:false,message:"Server error."});}
});

app.post("/login/patient", async(req,res)=>{
  try{
    const {email,password}=req.body;
    if(!email||!password) return res.status(400).json({success:false,message:"Email and password required."});
    const doc=await patients_col.findOne({email});
    if(!doc) return res.status(404).json({success:false,message:"No account found with this email."});
    const p=clean(doc);
    if(p.password!==password) return res.status(401).json({success:false,message:"Incorrect password."});
    return res.json({status:"success",patient:p});
  }catch(e){return res.status(500).json({success:false,message:"Server error."});}
});

app.post("/login/doctor", async(req,res)=>{
  try{
    const {doctorId,password}=req.body;
    const d=await doctors_col.findOne({doctorId});
    if(!d) return res.status(404).json({status:"error",message:"Doctor ID not found."});
    if(d.password!==password) return res.status(401).json({status:"error",message:"Incorrect password."});
    return res.json({status:"success",doctor:{doctorId:d.doctorId,name:d.name,specialization:d.specialization,hospital:d.hospital,experience:d.experience||"",qualification:d.qualification||"",departments:d.departments||""}});
  }catch(e){return res.status(500).json({status:"error",message:"Server error."});}
});

app.post("/login/admin", async(req,res)=>{
  try{
    const {adminId,password}=req.body;
    const a=await admins_col.findOne({adminId});
    if(!a) return res.status(404).json({status:"error",message:"Invalid Admin ID."});
    if(a.password!==password) return res.status(401).json({status:"error",message:"Invalid password."});
    return res.json({status:"success",admin:{adminId:a.adminId,name:a.name,role:"admin"}});
  }catch(e){return res.status(500).json({status:"error",message:"Server error."});}
});

app.get("/admin/stats", async(req,res)=>{
  try{
    return res.json({success:true,doctorCount:await doctors_col.countDocuments(),patientCount:await patients_col.countDocuments()});
  }catch(e){return res.status(500).json({success:false,message:"Failed."});}
});

app.get("/admin/details", async(req,res)=>{
  try{
    const docs=await doctors_col.find().toArray();
    const pats=await patients_col.find().toArray();
    return res.json({success:true,doctors:docs.map(d=>{const n={...d};delete n._id;return n;}),patients:pats.map(clean)});
  }catch(e){return res.status(500).json({success:false,message:"Failed."});}
});

app.post("/ask", async(req,res)=>{
  const {question,patientId,doctorId,adminId}=req.body;
  if(!question) return res.status(400).json({error:"No question provided"});
  try{
    const payload={question};
    if(patientId){
      payload.patientId=patientId;
    } else if(doctorId){
      payload.doctorId=doctorId;
      const doc=await doctors_col.findOne({doctorId});
      if(doc){
        const myPats=await patients_col.find({$or:[{doctor:doc.name},{doctor_id:doctorId},{Doctor_ID:doctorId}]}).toArray();
        payload.doctorContext={name:doc.name,specialization:doc.specialization,hospital:doc.hospital,experience:doc.experience||"",departments:doc.departments||"",patients:myPats.map(clean)};
      } else {
        payload.doctorContext={name:doctorId,specialization:"",hospital:"",experience:"",departments:"",patients:[]};
      }
    } else if(adminId){
      const [allDocs,allPats]=await Promise.all([doctors_col.find().toArray(),patients_col.find().toArray()]);
      payload.adminContext={doctors:allDocs.map(d=>{const n={...d};delete n._id;return n;}),patients:allPats.map(clean)};
    }
    const r=await axios.post(`${FLASK_URL}/rag`,payload,{timeout:30000});
    return res.json(r.data);
  }catch(err){
    console.error("❌ Flask error:",err.message);
    if(err.code==="ECONNREFUSED") return res.status(503).json({answer:"⚠️ AI backend (Flask) is not running on port 5001. Please run: py rag_pipeline.py"});
    return res.status(500).json({answer:"⚠️ Error: "+err.message});
  }
});

app.listen(PORT,()=>console.log(`✅ Node backend running at http://localhost:${PORT}`));
