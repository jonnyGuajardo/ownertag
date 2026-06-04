import { useState, useRef } from "react";

/* ─── DATA ─── */
const CATEGORIES = [
  { id:"phone",  label:"Teléfono",    icon:"📱", fields:["IMEI","Número de serie","Marca","Modelo"] },
  { id:"laptop", label:"Laptop / PC", icon:"💻", fields:["Número de serie","Marca","Modelo"] },
  { id:"tablet", label:"Tablet",      icon:"📟", fields:["IMEI","Número de serie","Marca","Modelo"] },
  { id:"camera", label:"Cámara",      icon:"📷", fields:["Número de serie","Marca","Modelo"] },
  { id:"car",    label:"Vehículo",    icon:"🚗", fields:["Número de serie (VIN)","Número de placa","Marca","Modelo","Año"] },
  { id:"moto",   label:"Motocicleta", icon:"🏍️", fields:["Número de serie","Número de placa","Marca","Modelo","Año"] },
  { id:"land",   label:"Terreno",     icon:"🏞️", fields:["Folio real","Número de escritura","Municipio","Estado","Superficie (m²)"] },
  { id:"house",  label:"Inmueble",    icon:"🏠", fields:["Folio real","Número de escritura","Dirección","Municipio","Estado"] },
  { id:"other",  label:"Otro",        icon:"📦", fields:["Número de serie","Descripción"] },
];

const STATUS = {
  activo:      { label:"Activo",        bg:"#dcfce7", color:"#16a34a", dot:"#22c55e" },
  perdido:     { label:"Perdido",       bg:"#fef9c3", color:"#b45309", dot:"#f59e0b" },
  robado:      { label:"Robado",        bg:"#fee2e2", color:"#b91c1c", dot:"#ef4444" },
  dado_de_baja:{ label:"Dado de baja",  bg:"#f3f4f6", color:"#6b7280", dot:"#9ca3af" },
};

const DEMO_USERS = [
  { id:"u1", name:"Carlos Ramírez", email:"carlos@demo.com", password:"demo1234" },
];

const DEMO_PRODUCTS = [
  { id:"p1", userId:"u1", category:"phone",  name:"iPhone 15 Pro",     serial:"IMEI: 352398107612345", brand:"Apple",  model:"iPhone 15 Pro", accent:"#6366f1", status:"activo", ownerEmail:"carlos@demo.com", date:"2024-01-15", history:[{action:"Registro inicial",date:"2024-01-15",by:"carlos@demo.com"}], files:[ {id:"f1",name:"Factura_iPhone.pdf",size:"245 KB",type:"pdf"} ] },
  { id:"p2", userId:"u1", category:"car",    name:"Nissan Versa 2022",  serial:"VIN: 3N1CN7AP4NL123456", brand:"Nissan",model:"Versa",          accent:"#0ea5e9", status:"activo", ownerEmail:"carlos@demo.com", date:"2023-06-10", history:[{action:"Registro inicial",date:"2023-06-10",by:"carlos@demo.com"}], files:[ {id:"f2",name:"Factura_Nissan.pdf",size:"512 KB",type:"pdf"}, {id:"f3",name:"Tarjeta_Circulacion.jpg",size:"180 KB",type:"img"} ] },
  { id:"p3", userId:"u1", category:"house",  name:"Casa Cumbres",       serial:"Folio: NL-2021-004832",  brand:"",      model:"",               accent:"#10b981", status:"activo", ownerEmail:"carlos@demo.com", date:"2021-03-22", history:[{action:"Registro inicial",date:"2021-03-22",by:"carlos@demo.com"}], files:[ {id:"f4",name:"Escritura_2021.pdf",size:"1.2 MB",type:"pdf"} ] },
];

const ACCENTS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];

/* ─── HELPERS ─── */
function today() { return new Date().toISOString().slice(0,10); }
function uid()   { return "x"+Date.now()+Math.random().toString(36).slice(2,6); }
function fileIcon(type) { return type==="pdf"?"📄":type==="img"?"🖼️":"📎"; }

/* ─── UI ATOMS ─── */
function Badge({ status }) {
  const s = STATUS[status];
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }} />
      {s.label}
    </span>
  );
}

function Inp({ label, value, onChange, placeholder, type="text", err }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ color:"#374151", fontSize:13, display:"block", marginBottom:4, fontWeight:500 }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", border:"1px solid "+(err?"#f87171":"#e5e7eb"), borderRadius:8, padding:"10px 12px", fontSize:14, outline:"none", boxSizing:"border-box", color:"#111", background:"#fafafa" }} />
      {err && <div style={{ color:"#ef4444", fontSize:12, marginTop:3 }}>{err}</div>}
    </div>
  );
}

function Btn({ onClick, children, variant="primary", small, full, disabled }) {
  const V = {
    primary: { background:disabled?"#a5b4fc":"#6366f1", color:"#fff", border:"none" },
    danger:  { background:"#fee2e2", color:"#b91c1c", border:"1px solid #fca5a5" },
    warning: { background:"#fef9c3", color:"#b45309", border:"1px solid #fcd34d" },
    ghost:   { background:"#f3f4f6", color:"#374151", border:"1px solid #e5e7eb" },
    success: { background:"#dcfce7", color:"#15803d", border:"1px solid #86efac" },
    link:    { background:"none", color:"#6366f1", border:"none", padding:0 },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ ...V[variant], borderRadius:variant==="link"?0:8, padding:variant==="link"?"0":(small?"6px 14px":"10px 20px"), fontSize:small?12:14, fontWeight:600, cursor:disabled?"not-allowed":"pointer", width:full?"100%":"auto", opacity:disabled?0.7:1 }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#0005", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:24, width:"100%", maxWidth:wide?560:440, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px #0003" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, color:"#111", fontSize:18, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"#f3f4f6", border:"none", borderRadius:"50%", width:30, height:30, cursor:"pointer", fontSize:16, color:"#555" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
      <span style={{ color:"#9ca3af", fontSize:12 }}>{text}</span>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
    </div>
  );
}

/* ─── AUTH SCREENS ─── */
function AuthScreen({ users, setUsers, onLogin }) {
  const [view, setView]       = useState("login"); // login | register | forgot | sent
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr]         = useState({});
  const [showPass, setShowPass] = useState(false);

  function validate(rules) {
    const e = {};
    rules.forEach(([field, msg, cond]) => { if (cond) e[field] = msg; });
    setErr(e);
    return Object.keys(e).length === 0;
  }

  function doLogin() {
    if (!validate([["email","Ingresa tu correo",!email],["password","Ingresa tu contraseña",!password]])) return;
    const u = users.find(u => u.email.toLowerCase()===email.toLowerCase() && u.password===password);
    if (!u) { setErr({ password:"Correo o contraseña incorrectos" }); return; }
    onLogin(u);
  }

  function doRegister() {
    if (!validate([
      ["name","Ingresa tu nombre",!name.trim()],
      ["email","Ingresa tu correo",!email],
      ["email","Correo inválido",!/\S+@\S+\.\S+/.test(email)],
      ["password","Mínimo 6 caracteres",password.length<6],
      ["confirm","Las contraseñas no coinciden",password!==confirm],
    ])) return;
    if (users.find(u=>u.email.toLowerCase()===email.toLowerCase())) {
      setErr({ email:"Este correo ya está registrado" }); return;
    }
    const nu = { id:uid(), name, email:email.toLowerCase(), password };
    setUsers(u=>[...u,nu]);
    onLogin(nu);
  }

  function doForgot() {
    if (!validate([["email","Ingresa tu correo",!email],["email","Correo inválido",!/\S+@\S+\.\S+/.test(email)]])) return;
    setView("sent");
  }

  const logo = (
    <div style={{ textAlign:"center", marginBottom:28 }}>
      <div style={{ fontSize:40, marginBottom:6 }}>🏷️</div>
      <div style={{ fontWeight:800, fontSize:26, color:"#6366f1", letterSpacing:-0.5 }}>OwnerTag</div>
      <div style={{ color:"#9ca3af", fontSize:13, marginTop:4 }}>Registra y protege lo que es tuyo</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f0ff 0%,#f8fafc 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:400, boxShadow:"0 8px 40px #6366f115" }}>
        {logo}

        {/* LOGIN */}
        {view==="login" && (<>
          <Inp label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" err={err.email} />
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <label style={{ color:"#374151", fontSize:13, fontWeight:500 }}>Contraseña</label>
              <Btn variant="link" onClick={()=>{ setView("forgot"); setErr({}); }} small>¿Olvidaste tu contraseña?</Btn>
            </div>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width:"100%", border:"1px solid "+(err.password?"#f87171":"#e5e7eb"), borderRadius:8, padding:"10px 40px 10px 12px", fontSize:14, outline:"none", boxSizing:"border-box", color:"#111", background:"#fafafa" }} />
              <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16 }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
            {err.password && <div style={{ color:"#ef4444", fontSize:12, marginTop:3 }}>{err.password}</div>}
          </div>
          <Btn onClick={doLogin} full>Iniciar sesión</Btn>
          <Divider text="¿No tienes cuenta?" />
          <Btn onClick={()=>{ setView("register"); setErr({}); }} variant="ghost" full>Crear cuenta gratis</Btn>
          <div style={{ marginTop:16, background:"#f0f0ff", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:12, color:"#6366f1", fontWeight:600, marginBottom:2 }}>Demo rápida</div>
            <div style={{ fontSize:12, color:"#4338ca" }}>📧 carlos@demo.com &nbsp;🔑 demo1234</div>
          </div>
        </>)}

        {/* REGISTER */}
        {view==="register" && (<>
          <Inp label="Nombre completo" value={name} onChange={setName} placeholder="Tu nombre" err={err.name} />
          <Inp label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" err={err.email} />
          <Inp label="Contraseña" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" type="password" err={err.password} />
          <Inp label="Confirmar contraseña" value={confirm} onChange={setConfirm} placeholder="Repite tu contraseña" type="password" err={err.confirm} />
          <Btn onClick={doRegister} full>Crear cuenta</Btn>
          <Divider text="¿Ya tienes cuenta?" />
          <Btn onClick={()=>{ setView("login"); setErr({}); }} variant="ghost" full>Iniciar sesión</Btn>
        </>)}

        {/* FORGOT */}
        {view==="forgot" && (<>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:36 }}>🔑</div>
            <div style={{ fontWeight:700, fontSize:16, marginTop:6 }}>Recuperar contraseña</div>
            <div style={{ color:"#9ca3af", fontSize:13, marginTop:4 }}>Te enviaremos un enlace a tu correo</div>
          </div>
          <Inp label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" err={err.email} />
          <Btn onClick={doForgot} full>Enviar enlace de recuperación</Btn>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <Btn variant="link" onClick={()=>{ setView("login"); setErr({}); }} small>← Volver al inicio de sesión</Btn>
          </div>
        </>)}

        {/* SENT */}
        {view==="sent" && (
          <div style={{ textAlign:"center", padding:"10px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Revisa tu correo</div>
            <div style={{ color:"#6b7280", fontSize:14, marginBottom:20 }}>Enviamos un enlace de recuperación a <strong style={{ color:"#111" }}>{email}</strong>. Revisa también tu carpeta de spam.</div>
            <Btn onClick={()=>{ setView("login"); setEmail(""); setErr({}); }} variant="ghost" full>← Volver al inicio de sesión</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function App() {
  const [users, setUsers]       = useState(DEMO_USERS);
  const [session, setSession]   = useState(null);
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [tab, setTab]           = useState("productos");
  const [selected, setSelected] = useState(null);
  const [showReg, setShowReg]   = useState(false);
  const [showXfer, setShowXfer] = useState(false);
  //const [showFiles, setShowFiles] = useState(false);
  const [search, setSearch]     = useState("");
  const [xferEmail, setXferEmail] = useState("");
  const [xferDocs, setXferDocs]   = useState({});
  const [verifySerial, setVerifySerial] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [notif, setNotif]       = useState(null);
  const [regCat, setRegCat]     = useState(null);
  const [regForm, setRegForm]   = useState({});
  const [regName, setRegName]   = useState("");
  const [regSerial, setRegSerial] = useState("");
  //const fileRef = useRef(null);

  if (!session) return <AuthScreen users={users} setUsers={setUsers} onLogin={setSession} />;

  const myProducts = products.filter(p => p.ownerEmail===session.email);
  const filtered   = myProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.serial.toLowerCase().includes(search.toLowerCase())
  );

  function toast(msg, type="ok") {
    setNotif({ msg, type });
    setTimeout(()=>setNotif(null), 3000);
  }

  /* product mutations */
  function setStatus(id, st) {
    setProducts(p=>p.map(x=>x.id===id?{ ...x, status:st, history:[...x.history,{action:"Estado: "+STATUS[st].label,date:today(),by:session.email}] }:x));
    setSelected(null); toast("Estado actualizado");
  }

  function doRegister() {
    if (!regCat||!regName.trim()||!regSerial.trim()) return toast("Completa nombre y número de serie","err");
    if (products.find(p=>p.serial.toLowerCase().includes(regSerial.toLowerCase()))) return toast("⚠️ Ese número de serie ya está registrado","err");
    const np = { id:uid(), userId:session.id, category:regCat, name:regName, serial:regSerial, brand:regForm["Marca"]||"", model:regForm["Modelo"]||"", accent:ACCENTS[Math.floor(Math.random()*ACCENTS.length)], status:"activo", ownerEmail:session.email, date:today(), history:[{action:"Registro inicial",date:today(),by:session.email}], files:[] };
    setProducts(p=>[np,...p]);
    setShowReg(false); setRegCat(null); setRegForm({}); setRegName(""); setRegSerial("");
    toast("✅ Producto registrado");
  }

  function doTransfer() {
    if (!xferEmail.trim()) return toast("Ingresa el correo del nuevo propietario","err");
    if (xferEmail.toLowerCase()===session.email.toLowerCase()) return toast("No puedes transferirte a ti mismo","err");
    setProducts(p=>p.map(x=>{
      if (x.id!==selected.id) return x;
      const keptFiles  = x.files.filter(f=>!xferDocs[f.id]);
      const xferFiles  = x.files.filter(f=>!!xferDocs[f.id]);
      return { ...x, ownerEmail:xferEmail, files:keptFiles, history:[...x.history,
        {action:`Transferido a ${xferEmail}${xferFiles.length?` (+${xferFiles.length} doc${xferFiles.length>1?"s":""})`:""} `,date:today(),by:session.email}
      ]};
    }));
    setShowXfer(false); setXferEmail(""); setXferDocs({}); setSelected(null);
    toast("🔄 Propiedad transferida correctamente");
  }

  /* file upload */
  function handleFileUpload(e, productId) {
    const fs = Array.from(e.target.files||[]);
    if (!fs.length) return;
    const newFiles = fs.map(f=>({
      id: uid(),
      name: f.name,
      size: f.size>1048576 ? (f.size/1048576).toFixed(1)+" MB" : Math.round(f.size/1024)+" KB",
      type: f.type.startsWith("image/")?"img":"pdf",
    }));
    setProducts(p=>p.map(x=>x.id===productId?{ ...x, files:[...x.files,...newFiles] }:x));
    //const updated = products.find(x=>x.id===productId);
    if (selected && selected.id===productId) setSelected(s=>({ ...s, files:[...(s.files||[]),...newFiles] }));
    toast(`📎 ${newFiles.length} archivo(s) adjuntado(s)`);
    e.target.value="";
  }

  function removeFile(productId, fileId) {
    setProducts(p=>p.map(x=>x.id===productId?{ ...x, files:x.files.filter(f=>f.id!==fileId) }:x));
    if (selected && selected.id===productId) setSelected(s=>({ ...s, files:s.files.filter(f=>f.id!==fileId) }));
    toast("Archivo eliminado");
  }

  function doVerify() {
    if (!verifySerial.trim()) return;
    const m = products.find(p=>p.serial.toLowerCase().includes(verifySerial.toLowerCase()));
    setVerifyResult(m||"none");
  }

  const C = { bg:"#f8fafc", card:"#fff", border:"#e5e7eb", text:"#111", muted:"#6b7280" };

  /* sync selected with products */
  const selProduct = selected ? products.find(p=>p.id===selected.id)||null : null;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:C.bg, minHeight:"100vh", color:C.text }}>

      {notif && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:notif.type==="err"?"#b91c1c":"#16a34a", color:"#fff", padding:"10px 20px", borderRadius:10, fontWeight:600, zIndex:300, fontSize:14, boxShadow:"0 4px 20px #0003", whiteSpace:"nowrap" }}>
          {notif.msg}
        </div>
      )}

      {/* header */}
      <div style={{ background:"#fff", borderBottom:"1px solid "+C.border, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>🏷️</span>
          <span style={{ fontWeight:800, fontSize:20, color:"#6366f1" }}>OwnerTag</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:13, color:C.muted, display:"none" }}>{session.name}</span>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#6366f1", color:"#fff", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
            {session.name[0].toUpperCase()}
          </div>
          <button onClick={()=>setSession(null)} style={{ background:"#fee2e2", border:"none", color:"#b91c1c", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Salir</button>
        </div>
      </div>

      {/* tabs */}
      <div style={{ background:"#fff", borderBottom:"1px solid "+C.border, display:"flex" }}>
        {[["productos","📦 Mis Productos"],["verificar","🔎 Verificar"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"12px 0", background:"none", border:"none", color:tab===k?"#6366f1":"#9ca3af", fontWeight:tab===k?700:400, fontSize:14, borderBottom:tab===k?"2px solid #6366f1":"2px solid transparent", cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:20, maxWidth:600, margin:"0 auto" }}>

        {/* ── MIS PRODUCTOS ── */}
        {tab==="productos" && (<>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            <input placeholder="Buscar producto o número de serie…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1, background:"#fff", border:"1px solid "+C.border, borderRadius:10, padding:"10px 14px", fontSize:14, outline:"none", color:C.text }} />
            <button onClick={()=>setShowReg(true)} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:14, cursor:"pointer" }}>+ Registrar</button>
          </div>

          {filtered.length===0 && (
            <div style={{ textAlign:"center", color:C.muted, padding:"60px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
              <div style={{ fontWeight:600 }}>Sin productos registrados</div>
              <div style={{ fontSize:13, marginTop:4 }}>Toca "+ Registrar" para agregar el primero</div>
            </div>
          )}

          {filtered.map(p=>{
            const cat = CATEGORIES.find(c=>c.id===p.category);
            return (
              <div key={p.id} onClick={()=>setSelected(p)} style={{ background:C.card, borderRadius:14, padding:16, marginBottom:10, cursor:"pointer", border:"1px solid "+C.border, boxShadow:"0 1px 4px #0000000a", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:p.accent+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                  {cat?.icon||"📦"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{p.name}</div>
                  <div style={{ color:C.muted, fontSize:12, marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.serial}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Badge status={p.status} />
                    {p.files && p.files.length>0 && <span style={{ fontSize:11, color:"#9ca3af" }}>📎 {p.files.length} archivo{p.files.length>1?"s":""}</span>}
                  </div>
                </div>
                <span style={{ color:"#d1d5db", fontSize:20 }}>›</span>
              </div>
            );
          })}
        </>)}

        {/* ── VERIFICAR ── */}
        {tab==="verificar" && (
          <div>
            <div style={{ background:"#f0f0ff", border:"1px solid #c7d2fe", borderRadius:12, padding:16, marginBottom:20 }}>
              <p style={{ margin:0, color:"#4338ca", fontSize:14 }}>🔐 Ingresa el número de serie, IMEI o folio de cualquier producto para verificar su registro y propietario actual.</p>
            </div>
            <Inp label="Número de serie / IMEI / Folio" value={verifySerial} onChange={setVerifySerial} placeholder="Ej: 352398107612345" />
            <Btn onClick={doVerify}>Verificar propiedad</Btn>
            {verifyResult && verifyResult!=="none" && (
              <div style={{ marginTop:20, background:C.card, borderRadius:14, padding:20, border:"1px solid #bbf7d0" }}>
                <div style={{ color:"#16a34a", fontWeight:700, marginBottom:10 }}>✅ Producto registrado</div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{verifyResult.name}</div>
                <div style={{ color:C.muted, fontSize:13, marginBottom:8 }}>{verifyResult.serial}</div>
                <Badge status={verifyResult.status} />
                <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Propietario",verifyResult.ownerEmail],["Registrado",verifyResult.date],["Categoría",CATEGORIES.find(c=>c.id===verifyResult.category)?.label||"-"]].map(([k,v])=>(
                    <div key={k} style={{ background:"#f8fafc", borderRadius:8, padding:10 }}>
                      <div style={{ color:C.muted, fontSize:11, marginBottom:2 }}>{k}</div>
                      <div style={{ fontWeight:600, fontSize:13, wordBreak:"break-all" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {verifyResult==="none" && (
              <div style={{ marginTop:20, background:C.card, borderRadius:14, padding:20, border:"1px solid "+C.border, textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>❓</div>
                <div style={{ fontWeight:600, marginBottom:4 }}>No encontrado</div>
                <div style={{ color:C.muted, fontSize:13 }}>Este número no está registrado en OwnerTag.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETALLE ── */}
      {selProduct && (
        <Modal title={selProduct.name} onClose={()=>setSelected(null)} wide>
          <div style={{ background:"#f8fafc", borderRadius:12, padding:14, marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:36 }}>{CATEGORIES.find(c=>c.id===selProduct.category)?.icon||"📦"}</div>
            <div>
              <Badge status={selProduct.status} />
              <div style={{ color:"#9ca3af", fontSize:12, marginTop:4 }}>Registrado: {selProduct.date}</div>
            </div>
          </div>

          <div style={{ background:"#f8fafc", borderRadius:10, padding:12, marginBottom:14, border:"1px solid #e5e7eb" }}>
            <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, marginBottom:2, textTransform:"uppercase" }}>Identificador</div>
            <div style={{ fontFamily:"monospace", fontSize:13, color:"#111", wordBreak:"break-all" }}>{selProduct.serial}</div>
          </div>

          {/* FILES */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, textTransform:"uppercase" }}>Archivos adjuntos</div>
              <label style={{ background:"#f0f0ff", color:"#6366f1", border:"1px solid #c7d2fe", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                📎 Adjuntar
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display:"none" }} onChange={e=>handleFileUpload(e, selProduct.id)} />
              </label>
            </div>
            {(!selProduct.files||selProduct.files.length===0) && (
              <div style={{ color:"#d1d5db", fontSize:13, textAlign:"center", padding:"12px 0" }}>Sin archivos adjuntos</div>
            )}
            {selProduct.files && selProduct.files.map(f=>(
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#f8fafc", borderRadius:8, padding:"8px 12px", marginBottom:6, border:"1px solid #e5e7eb" }}>
                <span style={{ fontSize:20 }}>{fileIcon(f.type)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{f.size}</div>
                </div>
                <button onClick={()=>removeFile(selProduct.id, f.id)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:0 }}>🗑</button>
              </div>
            ))}
          </div>

          {/* HISTORY */}
          <div style={{ marginBottom:16 }}>
            <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase" }}>Historial</div>
            {selProduct.history.map((h,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", marginTop:5, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{h.action}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{h.date}</div>
                </div>
              </div>
            ))}
          </div>

          {selProduct.status==="activo" && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              <Btn onClick={()=>setShowXfer(true)} small>🔄 Transferir</Btn>
              <Btn onClick={()=>setStatus(selProduct.id,"perdido")} variant="warning" small>📍 Perdido</Btn>
              <Btn onClick={()=>setStatus(selProduct.id,"robado")} variant="danger" small>🚨 Robado</Btn>
              <Btn onClick={()=>setStatus(selProduct.id,"dado_de_baja")} variant="ghost" small>❌ Dar de baja</Btn>
            </div>
          )}
          {(selProduct.status==="perdido"||selProduct.status==="robado") && (
            <Btn onClick={()=>setStatus(selProduct.id,"activo")} variant="success" small>✅ Recuperado</Btn>
          )}
        </Modal>
      )}

      {/* ── REGISTRAR ── */}
      {showReg && (
        <Modal title="Registrar Producto" onClose={()=>{ setShowReg(false); setRegCat(null); setRegForm({}); setRegName(""); setRegSerial(""); }}>
          {!regCat ? (
            <>
              <p style={{ color:"#6b7280", fontSize:14, marginBottom:14 }}>Selecciona la categoría:</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {CATEGORIES.map(c=>(
                  <button key={c.id} onClick={()=>setRegCat(c.id)} style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:12, padding:"12px 6px", cursor:"pointer", color:"#111", textAlign:"center" }}>
                    <div style={{ fontSize:26 }}>{c.icon}</div>
                    <div style={{ fontSize:11, marginTop:4, fontWeight:600, color:"#374151" }}>{c.label}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={()=>setRegCat(null)} style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontSize:13, marginBottom:14, padding:0, fontWeight:600 }}>← Cambiar categoría</button>
              <Inp label="Nombre del producto *" value={regName} onChange={setRegName} placeholder="Ej: Mi iPhone 15 Pro" />
              <Inp label="Número de serie / IMEI / Folio *" value={regSerial} onChange={setRegSerial} placeholder="Número único identificador" />
              {CATEGORIES.find(c=>c.id===regCat)?.fields.filter(f=>!["Número de serie","IMEI","Folio real"].includes(f)).map(f=>(
                <Inp key={f} label={f} value={regForm[f]||""} onChange={v=>setRegForm(p=>({...p,[f]:v}))} placeholder={f} />
              ))}
              <Btn onClick={doRegister} full>Registrar producto</Btn>
            </>
          )}
        </Modal>
      )}

      {/* ── TRANSFERIR CON DOCS ── */}
      {showXfer && selProduct && (
        <Modal title="Transferir propiedad" onClose={()=>{ setShowXfer(false); setXferEmail(""); setXferDocs({}); }}>
          <div style={{ background:"#fef9c3", border:"1px solid #fcd34d", borderRadius:10, padding:12, marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:13, color:"#92400e", marginBottom:2 }}>⚠️ Esta acción es permanente</div>
            <div style={{ fontSize:13, color:"#92400e" }}>Transferirás <strong>{selProduct.name}</strong> a otro usuario. Quedará registrado en el historial.</div>
          </div>

          <Inp label="Correo del nuevo propietario" value={xferEmail} onChange={setXferEmail} placeholder="correo@ejemplo.com" type="email" />

          {selProduct.files && selProduct.files.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:8 }}>📎 ¿Deseas transferir los documentos adjuntos?</div>
              {selProduct.files.map(f=>(
                <label key={f.id} style={{ display:"flex", alignItems:"center", gap:10, background: xferDocs[f.id]?"#f0f0ff":"#f8fafc", border:"1px solid "+(xferDocs[f.id]?"#c7d2fe":"#e5e7eb"), borderRadius:8, padding:"10px 12px", marginBottom:6, cursor:"pointer" }}>
                  <input type="checkbox" checked={!!xferDocs[f.id]} onChange={e=>setXferDocs(d=>({...d,[f.id]:e.target.checked}))}
                    style={{ width:16, height:16, accentColor:"#6366f1", cursor:"pointer", flexShrink:0 }} />
                  <span style={{ fontSize:18 }}>{fileIcon(f.type)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{f.size}</div>
                  </div>
                </label>
              ))}
              <div style={{ fontSize:12, color:"#9ca3af", marginTop:6 }}>
                {Object.values(xferDocs).filter(Boolean).length} de {selProduct.files.length} documento(s) seleccionado(s) para transferir
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={doTransfer} full>Confirmar transferencia</Btn>
            <Btn onClick={()=>{ setShowXfer(false); setXferEmail(""); setXferDocs({}); }} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}