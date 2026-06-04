/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

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
  activo:       { label:"Activo",       bg:"#dcfce7", color:"#16a34a", dot:"#22c55e" },
  perdido:      { label:"Perdido",      bg:"#fef9c3", color:"#b45309", dot:"#f59e0b" },
  robado:       { label:"Robado",       bg:"#fee2e2", color:"#b91c1c", dot:"#ef4444" },
  dado_de_baja: { label:"Dado de baja", bg:"#f3f4f6", color:"#6b7280", dot:"#9ca3af" },
};

const ACCENTS    = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];
const randAccent = () => ACCENTS[Math.floor(Math.random() * ACCENTS.length)];


function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function warrantyBadge(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days < 0)   return { label:"Garantía vencida",   bg:"#fee2e2", color:"#b91c1c" };
  if (days <= 5)  return { label:`Vence en ${days}d`,  bg:"#fee2e2", color:"#b91c1c" };
  if (days <= 30) return { label:`Vence en ${days}d`,  bg:"#fef9c3", color:"#b45309" };
  return { label:`Garantía: ${dateStr}`, bg:"#dcfce7", color:"#16a34a" };
}

/* ── UI ATOMS ── */
function Badge({ status }) {
  const s = STATUS[status] || STATUS.activo;
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }} />
      {s.label}
    </span>
  );
}

function WBadge({ dateStr }) {
  const w = warrantyBadge(dateStr);
  if (!w) return null;
  return <span style={{ background:w.bg, color:w.color, borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600 }}>🛡️ {w.label}</span>;
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

function Btn({ onClick, children, variant="primary", small, full, disabled, loading }) {
  const V = {
    primary: { background:disabled||loading?"#a5b4fc":"#6366f1", color:"#fff", border:"none" },
    danger:  { background:"#fee2e2", color:"#b91c1c", border:"1px solid #fca5a5" },
    warning: { background:"#fef9c3", color:"#b45309", border:"1px solid #fcd34d" },
    ghost:   { background:"#f3f4f6", color:"#374151", border:"1px solid #e5e7eb" },
    success: { background:"#dcfce7", color:"#15803d", border:"1px solid #86efac" },
  };
  return (
    <button disabled={disabled||loading} onClick={onClick}
      style={{ ...V[variant], borderRadius:8, padding:small?"6px 14px":"10px 20px", fontSize:small?12:14, fontWeight:600, cursor:(disabled||loading)?"not-allowed":"pointer", width:full?"100%":"auto", opacity:(disabled||loading)?0.7:1 }}>
      {loading?"Cargando…":children}
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

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0" }}>
      <div style={{ width:32, height:32, border:"3px solid #e5e7eb", borderTop:"3px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── AUTH ── */
function AuthScreen({ onLogin }) {
  const [view, setView]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [err, setErr]           = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  function validate(rules) {
    const e = {};
    rules.forEach(([f,m,c])=>{ if(c) e[f]=m; });
    setErr(e);
    return Object.keys(e).length===0;
  }

  async function doLogin() {
    if (!validate([["email","Ingresa tu correo",!email],["password","Ingresa tu contraseña",!password]])) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr({ password:"Correo o contraseña incorrectos" }); return; }
    onLogin(data.user);
  }

  async function doRegister() {
    if (!validate([
      ["name","Ingresa tu nombre",!name.trim()],
      ["email","Ingresa tu correo",!email],
      ["email","Correo inválido",!/\S+@\S+\.\S+/.test(email)],
      ["password","Mínimo 6 caracteres",password.length<6],
      ["confirm","Las contraseñas no coinciden",password!==confirm],
    ])) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options:{ data:{ name } } });
    setLoading(false);
    if (error) { setErr({ email:error.message }); return; }
    if (data.user) onLogin(data.user);
  }

  async function doForgot() {
    if (!validate([["email","Ingresa tu correo",!email],["email","Correo inválido",!/\S+@\S+\.\S+/.test(email)]])) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo:window.location.origin });
    setLoading(false);
    setView("sent");
  }

  const logo = (
    <div style={{ textAlign:"center", marginBottom:28 }}>
      <div style={{ fontSize:40, marginBottom:6 }}>🏷️</div>
      <div style={{ fontWeight:800, fontSize:26, color:"#6366f1" }}>OwnerTag</div>
      <div style={{ color:"#9ca3af", fontSize:13, marginTop:4 }}>Registra y protege lo que es tuyo</div>
    </div>
  );

  const divider = (t) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
      <span style={{ color:"#9ca3af", fontSize:12 }}>{t}</span>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }} />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0f0ff,#f8fafc)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:400, boxShadow:"0 8px 40px #6366f115" }}>
        {logo}
        {view==="login" && (<>
          <Inp label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" err={err.email} />
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <label style={{ color:"#374151", fontSize:13, fontWeight:500 }}>Contraseña</label>
              <button onClick={()=>{ setView("forgot"); setErr({}); }} style={{ background:"none", border:"none", color:"#6366f1", fontSize:12, fontWeight:600, cursor:"pointer" }}>¿Olvidaste tu contraseña?</button>
            </div>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                style={{ width:"100%", border:"1px solid "+(err.password?"#f87171":"#e5e7eb"), borderRadius:8, padding:"10px 40px 10px 12px", fontSize:14, outline:"none", boxSizing:"border-box", color:"#111", background:"#fafafa" }} />
              <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16 }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
            {err.password && <div style={{ color:"#ef4444", fontSize:12, marginTop:3 }}>{err.password}</div>}
          </div>
          <Btn onClick={doLogin} full loading={loading}>Iniciar sesión</Btn>
          {divider("¿No tienes cuenta?")}
          <Btn onClick={()=>{ setView("register"); setErr({}); }} variant="ghost" full>Crear cuenta gratis</Btn>
        </>)}
        {view==="register" && (<>
          <Inp label="Nombre completo" value={name} onChange={setName} placeholder="Tu nombre" err={err.name} />
          <Inp label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" err={err.email} />
          <Inp label="Contraseña" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" type="password" err={err.password} />
          <Inp label="Confirmar contraseña" value={confirm} onChange={setConfirm} placeholder="Repite tu contraseña" type="password" err={err.confirm} />
          <Btn onClick={doRegister} full loading={loading}>Crear cuenta</Btn>
          {divider("¿Ya tienes cuenta?")}
          <Btn onClick={()=>{ setView("login"); setErr({}); }} variant="ghost" full>Iniciar sesión</Btn>
        </>)}
        {view==="forgot" && (<>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:36 }}>🔑</div>
            <div style={{ fontWeight:700, fontSize:16, marginTop:6 }}>Recuperar contraseña</div>
            <div style={{ color:"#9ca3af", fontSize:13, marginTop:4 }}>Te enviaremos un enlace a tu correo</div>
          </div>
          <Inp label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" err={err.email} />
          <Btn onClick={doForgot} full loading={loading}>Enviar enlace de recuperación</Btn>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <button onClick={()=>{ setView("login"); setErr({}); }} style={{ background:"none", border:"none", color:"#6366f1", fontSize:13, fontWeight:600, cursor:"pointer" }}>← Volver</button>
          </div>
        </>)}
        {view==="sent" && (
          <div style={{ textAlign:"center", padding:"10px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Revisa tu correo</div>
            <div style={{ color:"#6b7280", fontSize:14, marginBottom:20 }}>Enviamos un enlace a <strong style={{ color:"#111" }}>{email}</strong>.</div>
            <Btn onClick={()=>{ setView("login"); setEmail(""); setErr({}); }} variant="ghost" full>← Volver al inicio de sesión</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [session, setSession]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [products, setProducts]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [tab, setTab]                 = useState("productos");
  const [selected, setSelected]       = useState(null);
  const [showReg, setShowReg]         = useState(false);
  const [showXfer, setShowXfer]       = useState(false);
  const [search, setSearch]           = useState("");
  const [xferEmail, setXferEmail]     = useState("");
  const [xferDocs, setXferDocs]       = useState({});
  const [verifySerial, setVerifySerial] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [notif, setNotif]             = useState(null);
  const [regCat, setRegCat]           = useState(null);
  const [regForm, setRegForm]         = useState({});
  const [regName, setRegName]         = useState("");
  const [regSerial, setRegSerial]     = useState("");
  const [regWarranty, setRegWarranty] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const toast = (msg, type="ok") => {
    setNotif({ msg, type });
    setTimeout(()=>setNotif(null), 3000);
  };

  const fetchProducts = useCallback(async (user) => {
    if (!user) return;
    setProdLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, product_history(*), product_files(*)")
      .eq("owner_email", user.email)
      .order("created_at", { ascending:false });
    setProdLoading(false);
    if (!error) setProducts(data || []);
  }, []);

  const fetchNotifications = useCallback(async (user) => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending:false });
    setNotifications(data || []);
  }, []);

  const checkWarranties = useCallback(async (user, prods) => {
    if (!user || !prods) return;
    for (const p of prods) {
      if (!p.warranty_date) continue;
      const days = daysUntil(p.warranty_date);
      for (const t of [30, 15, 5]) {
        if (days === t) {
          const { data: ex } = await supabase.from("notifications").select("id").eq("product_id",p.id).eq("type","warranty").ilike("message",`%${t} días%`);
          if (!ex || ex.length===0) {
            await supabase.from("notifications").insert({ user_id:user.id, type:"warranty", title:"⏰ Garantía próxima a vencer", message:`La garantía de "${p.name}" vence en ${t} días (${p.warranty_date}).`, product_id:p.id });
          }
        }
      }
      if (days === 0) {
        const { data: ex } = await supabase.from("notifications").select("id").eq("product_id",p.id).eq("type","warranty").ilike("message","%vence hoy%");
        if (!ex || ex.length===0) {
          await supabase.from("notifications").insert({ user_id:user.id, type:"warranty", title:"🚨 Garantía vence hoy", message:`La garantía de "${p.name}" vence hoy (${p.warranty_date}).`, product_id:p.id });
        }
      }
    }
    await fetchNotifications(user);
  }, [fetchNotifications]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user || null;
      setSession(user);
      if (user) { fetchProducts(user); fetchNotifications(user); }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => {
      const user = sess?.user || null;
      setSession(user);
      if (user) { fetchProducts(user); fetchNotifications(user); }
    });
    return () => listener.subscription.unsubscribe();
  }, [fetchProducts, fetchNotifications]);

  useEffect(() => {
    if (products.length > 0 && session) checkWarranties(session, products);
  }, [products]);

  /* ── File URL ── */
  async function getFileUrl(storagePath) {
    const { data } = await supabase.storage.from("product-files").createSignedUrl(storagePath, 3600);
    return data?.signedUrl || null;
  }

  async function openPreview(f) {
    const url = await getFileUrl(f.storage_path);
    if (!url) return toast("No se pudo obtener el archivo","err");
    const ext = f.name.split(".").pop().toLowerCase();
    setPreviewFile({ name:f.name, url, type:f.file_type, ext });
  }

  /* ── CRUD ── */
  async function doRegister() {
    if (!regCat || !regName.trim() || !regSerial.trim()) return toast("Completa nombre y número de serie","err");
    setActionLoading(true);
    const { data: existing } = await supabase.from("products").select("id").ilike("serial",`%${regSerial}%`);
    if (existing && existing.length>0) { setActionLoading(false); return toast("⚠️ Ese número de serie ya está registrado","err"); }
    const { data: prod, error } = await supabase.from("products").insert({
      user_id: session.id,
      owner_email: session.email,
      public_owner_id: "OT-"+session.id.substring(0,8).toUpperCase(),
      name: regName, category: regCat, serial: regSerial,
      brand: regForm["Marca"]||"", model: regForm["Modelo"]||"",
      accent: randAccent(), status: "activo", extra_fields: regForm,
      warranty_date: regWarranty || null,
    }).select().single();
    if (!error && prod) {
      await supabase.from("product_history").insert({ product_id:prod.id, action:"Registro inicial", by_email:session.email });
      await fetchProducts(session);
      setShowReg(false); setRegCat(null); setRegForm({}); setRegName(""); setRegSerial(""); setRegWarranty("");
      toast("✅ Producto registrado");
    } else {
      toast("Error: "+(error?.message||"desconocido"),"err");
    }
    setActionLoading(false);
  }

  async function setStatus(id, st) {
    await supabase.from("products").update({ status:st }).eq("id",id);
    await supabase.from("product_history").insert({ product_id:id, action:"Estado: "+STATUS[st].label, by_email:session.email });
    if (st==="perdido") {
      const prod = products.find(p=>p.id===id);
      await supabase.from("notifications").insert({ user_id:session.id, type:"found", title:"📍 Producto marcado como perdido", message:`Has marcado "${prod?.name}" como perdido. Si alguien lo encuentra podrá contactarte.`, product_id:id });
      await fetchNotifications(session);
    }
    await fetchProducts(session);
    setSelected(null);
    toast("Estado actualizado");
  }

  async function doTransfer() {
    if (!xferEmail.trim()) return toast("Ingresa el correo del nuevo propietario","err");
    if (xferEmail.toLowerCase()===session.email.toLowerCase()) return toast("No puedes transferirte a ti mismo","err");
    setActionLoading(true);
    const selProduct = products.find(p=>p.id===selected.id);
    const removedFiles = (selProduct.product_files||[]).filter(f=>!xferDocs[f.id]);
    const transferredFiles = (selProduct.product_files||[]).filter(f=>xferDocs[f.id]);
    await supabase.from("products").update({ owner_email:xferEmail }).eq("id",selected.id);
    await supabase.from("product_history").insert({ product_id:selected.id, action:`Transferido a ${xferEmail}${transferredFiles.length?` (+${transferredFiles.length} doc(s))`:""}`, by_email:session.email });
    if (removedFiles.length>0) await supabase.from("product_files").delete().in("id",removedFiles.map(f=>f.id));
    await fetchProducts(session);
    setShowXfer(false); setXferEmail(""); setXferDocs({}); setSelected(null);
    toast("🔄 Propiedad transferida");
    setActionLoading(false);
  }

  async function handleFileUpload(e, productId) {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    for (const file of files) {
      const path = `${session.id}/${productId}/${Date.now()}_${file.name}`;
      const { error:upErr } = await supabase.storage.from("product-files").upload(path, file);
      if (!upErr) {
        await supabase.from("product_files").insert({
          product_id:productId, name:file.name,
          size:file.size>1048576?(file.size/1048576).toFixed(1)+" MB":Math.round(file.size/1024)+" KB",
          file_type:file.type.startsWith("image/")?"img":"pdf",
          storage_path:path,
        });
      }
    }
    await fetchProducts(session);
    toast(`📎 ${files.length} archivo(s) adjuntado(s)`);
    e.target.value="";
  }

  async function removeFile(fileId, storagePath) {
    await supabase.storage.from("product-files").remove([storagePath]);
    await supabase.from("product_files").delete().eq("id",fileId);
    await fetchProducts(session);
    toast("Archivo eliminado");
  }

  async function doVerify() {
    if (!verifySerial.trim()) return;
    const { data } = await supabase.from("products").select("*, product_history(*)").ilike("serial",`%${verifySerial}%`).maybeSingle();
    setVerifyResult(data||"none");
  }

  async function markRead(id) {
    await supabase.from("notifications").update({ read:true }).eq("id",id);
    setNotifications(n=>n.map(x=>x.id===id?{...x,read:true}:x));
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ read:true }).eq("user_id",session.id).eq("read",false);
    setNotifications(n=>n.map(x=>({...x,read:true})));
  }

  async function deleteNotification(id) {
    await supabase.from("notifications").delete().eq("id",id);
    setNotifications(n=>n.filter(x=>x.id!==id));
  }

  async function doSignOut() {
    await supabase.auth.signOut();
    setSession(null); setProducts([]); setNotifications([]);
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <Spinner />
    </div>
  );

  if (!session) return <AuthScreen onLogin={(user)=>{ setSession(user); fetchProducts(user); fetchNotifications(user); }} />;

  const userName   = session.user_metadata?.name || session.email;
  const unread     = notifications.filter(n=>!n.read).length;
  const filtered   = products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.serial.toLowerCase().includes(search.toLowerCase()));
  const selProduct = selected ? products.find(p=>p.id===selected.id)||null : null;

  /* ── FILE CARD ── */
  function FileCard({ f, showCheck }) {
    const ext = f.name.split(".").pop().toLowerCase();
    const icon = ["jpg","jpeg","png","gif","webp"].includes(ext) ? "🖼️" : ["xls","xlsx"].includes(ext) ? "📊" : ["doc","docx"].includes(ext) ? "📝" : "📄";
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, background: showCheck && xferDocs[f.id]?"#f0f0ff":"#f8fafc", border:"1px solid "+(showCheck && xferDocs[f.id]?"#c7d2fe":"#e5e7eb"), borderRadius:8, padding:"8px 12px", marginBottom:6 }}>
        {showCheck && (
          <input type="checkbox" checked={!!xferDocs[f.id]} onChange={e=>setXferDocs(d=>({...d,[f.id]:e.target.checked}))} style={{ width:16, height:16, accentColor:"#6366f1", cursor:"pointer", flexShrink:0 }} />
        )}
        <span style={{ fontSize:20 }}>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
          <div style={{ fontSize:11, color:"#9ca3af" }}>{f.size}</div>
        </div>
        {!showCheck && (<>
          <button onClick={()=>openPreview(f)}
            style={{ background:"#f0f0ff", border:"none", color:"#6366f1", cursor:"pointer", fontSize:12, fontWeight:600, borderRadius:6, padding:"4px 10px", flexShrink:0 }}>
            👁 Ver
          </button>
          <button onClick={()=>removeFile(f.id,f.storage_path)}
            style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, flexShrink:0 }}>
            🗑
          </button>
        </>)}
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#111" }}>

      {notif && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:notif.type==="err"?"#b91c1c":"#16a34a", color:"#fff", padding:"10px 20px", borderRadius:10, fontWeight:600, zIndex:300, fontSize:14, boxShadow:"0 4px 20px #0003", whiteSpace:"nowrap" }}>
          {notif.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22 }}>🏷️</span>
          <span style={{ fontWeight:800, fontSize:20, color:"#6366f1" }}>OwnerTag</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#6366f1", color:"#fff", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
            {userName[0].toUpperCase()}
          </div>
          <button onClick={doSignOut} style={{ background:"#fee2e2", border:"none", color:"#b91c1c", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>Salir</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", display:"flex" }}>
        {[["productos","📦 Productos"],["verificar","🔎 Verificar"],["notificaciones","🔔 Alertas"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"12px 4px", background:"none", border:"none", color:tab===k?"#6366f1":"#9ca3af", fontWeight:tab===k?700:400, fontSize:13, borderBottom:tab===k?"2px solid #6366f1":"2px solid transparent", cursor:"pointer", position:"relative" }}>
            {l}
            {k==="notificaciones" && unread>0 && (
              <span style={{ position:"absolute", top:8, right:"calc(50% - 28px)", background:"#ef4444", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{unread}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding:20, maxWidth:600, margin:"0 auto" }}>

        {/* ── PRODUCTOS ── */}
        {tab==="productos" && (<>
          <div style={{ display:"flex", gap:10, marginBottom:20 }}>
            <input placeholder="Buscar producto o número de serie…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"10px 14px", fontSize:14, outline:"none", color:"#111" }} />
            <button onClick={()=>setShowReg(true)} style={{ background:"#6366f1", color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:700, fontSize:14, cursor:"pointer" }}>+ Registrar</button>
          </div>
          {prodLoading && <Spinner />}
          {!prodLoading && filtered.length===0 && (
            <div style={{ textAlign:"center", color:"#6b7280", padding:"60px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
              <div style={{ fontWeight:600 }}>Sin productos registrados</div>
              <div style={{ fontSize:13, marginTop:4 }}>Toca "+ Registrar" para agregar el primero</div>
            </div>
          )}
          {filtered.map(p=>{
            const cat   = CATEGORIES.find(c=>c.id===p.category);
            const files = p.product_files||[];
            const days  = daysUntil(p.warranty_date);
            const warnW = p.warranty_date && days!==null && days<=30;
            return (
              <div key={p.id} onClick={()=>setSelected(p)} style={{ background:"#fff", borderRadius:14, padding:16, marginBottom:10, cursor:"pointer", border:"1px solid "+(warnW?"#fcd34d":"#e5e7eb"), boxShadow:"0 1px 4px #0000000a", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:(p.accent||"#6366f1")+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                  {cat?.icon||"📦"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{p.name}</div>
                  <div style={{ color:"#6b7280", fontSize:12, marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.serial}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6 }}>
                    <Badge status={p.status} />
                    {p.warranty_date && <WBadge dateStr={p.warranty_date} />}
                    {files.length>0 && <span style={{ fontSize:11, color:"#9ca3af" }}>📎 {files.length}</span>}
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
              <p style={{ margin:0, color:"#4338ca", fontSize:14 }}>🔐 Ingresa el número de serie, IMEI o folio de cualquier producto para verificar su registro.</p>
            </div>
            <Inp label="Número de serie / IMEI / Folio" value={verifySerial} onChange={setVerifySerial} placeholder="Ej: 352398107612345" />
            <Btn onClick={doVerify}>Verificar propiedad</Btn>
            {verifyResult && verifyResult!=="none" && (
              <div style={{ marginTop:20, background:"#fff", borderRadius:14, padding:20, border:"1px solid #bbf7d0" }}>
                <div style={{ color:"#16a34a", fontWeight:700, marginBottom:10 }}>✅ Producto registrado</div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{verifyResult.name}</div>
                <div style={{ color:"#6b7280", fontSize:13, marginBottom:8 }}>{verifyResult.serial}</div>
                <Badge status={verifyResult.status} />
                <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Propietario ID",verifyResult.public_owner_id||"N/A"],["Categoría",CATEGORIES.find(c=>c.id===verifyResult.category)?.label||"-"]].map(([k,v])=>(
                    <div key={k} style={{ background:"#f8fafc", borderRadius:8, padding:10 }}>
                      <div style={{ color:"#9ca3af", fontSize:11, marginBottom:2 }}>{k}</div>
                      <div style={{ fontWeight:600, fontSize:13, wordBreak:"break-all" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {verifyResult==="none" && (
              <div style={{ marginTop:20, background:"#fff", borderRadius:14, padding:20, border:"1px solid #e5e7eb", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>❓</div>
                <div style={{ fontWeight:600, marginBottom:4 }}>No encontrado</div>
                <div style={{ color:"#6b7280", fontSize:13 }}>Este número no está registrado en OwnerTag.</div>
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICACIONES ── */}
        {tab==="notificaciones" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:16 }}>🔔 Notificaciones</div>
              {unread>0 && <Btn onClick={markAllRead} variant="ghost" small>Marcar todas como leídas</Btn>}
            </div>
            {notifications.length===0 && (
              <div style={{ textAlign:"center", color:"#6b7280", padding:"60px 0" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔕</div>
                <div style={{ fontWeight:600 }}>Sin notificaciones</div>
                <div style={{ fontSize:13, marginTop:4 }}>Aquí aparecerán alertas de garantía y objetos encontrados</div>
              </div>
            )}
            {notifications.map(n=>(
              <div key={n.id} onClick={()=>markRead(n.id)} style={{ background:n.read?"#fff":"#f0f0ff", borderRadius:14, padding:16, marginBottom:10, border:"1px solid "+(n.read?"#e5e7eb":"#c7d2fe"), cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:18 }}>{n.type==="warranty"?"🛡️":"📍"}</span>
                      <span style={{ fontWeight:700, fontSize:14 }}>{n.title}</span>
                      {!n.read && <span style={{ background:"#6366f1", color:"#fff", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:600 }}>Nueva</span>}
                    </div>
                    <div style={{ color:"#6b7280", fontSize:13, marginBottom:4 }}>{n.message}</div>
                    <div style={{ color:"#9ca3af", fontSize:11 }}>{n.created_at?.slice(0,10)}</div>
                  </div>
                  <button onClick={e=>{ e.stopPropagation(); deleteNotification(n.id); }} style={{ background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:18, padding:0, flexShrink:0 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DETALLE ── */}
      {selProduct && (
        <Modal title={selProduct.name} onClose={()=>setSelected(null)} wide>
          <div style={{ background:"#f8fafc", borderRadius:12, padding:14, marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:36 }}>{CATEGORIES.find(c=>c.id===selProduct.category)?.icon||"📦"}</div>
            <div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:4 }}>
                <Badge status={selProduct.status} />
                {selProduct.warranty_date && <WBadge dateStr={selProduct.warranty_date} />}
              </div>
              <div style={{ color:"#9ca3af", fontSize:12, marginTop:4 }}>Registrado: {selProduct.created_at?.slice(0,10)}</div>
            </div>
          </div>

          <div style={{ background:"#f8fafc", borderRadius:10, padding:12, marginBottom:14, border:"1px solid #e5e7eb" }}>
            <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, marginBottom:2, textTransform:"uppercase" }}>Identificador</div>
            <div style={{ fontFamily:"monospace", fontSize:13, wordBreak:"break-all" }}>{selProduct.serial}</div>
          </div>

          {selProduct.warranty_date && (
            <div style={{ background:"#f8fafc", borderRadius:10, padding:12, marginBottom:14, border:"1px solid #e5e7eb" }}>
              <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, marginBottom:2, textTransform:"uppercase" }}>Garantía</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Vence: {selProduct.warranty_date}</div>
              <div style={{ color:daysUntil(selProduct.warranty_date)<=30?"#b45309":"#16a34a", fontSize:13, marginTop:2 }}>
                {daysUntil(selProduct.warranty_date)<0?"Garantía vencida":`Quedan ${daysUntil(selProduct.warranty_date)} días`}
              </div>
            </div>
          )}

          {/* Files */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, textTransform:"uppercase" }}>Archivos adjuntos</div>
              <label style={{ background:"#f0f0ff", color:"#6366f1", border:"1px solid #c7d2fe", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                📎 Adjuntar
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style={{ display:"none" }} onChange={e=>handleFileUpload(e,selProduct.id)} />
              </label>
            </div>
            {(!selProduct.product_files||selProduct.product_files.length===0) && (
              <div style={{ color:"#d1d5db", fontSize:13, textAlign:"center", padding:"10px 0" }}>Sin archivos adjuntos</div>
            )}
            {(selProduct.product_files||[]).map(f=><FileCard key={f.id} f={f} showCheck={false} />)}
          </div>

          {/* History */}
          <div style={{ marginBottom:16 }}>
            <div style={{ color:"#9ca3af", fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase" }}>Historial</div>
            {(selProduct.product_history||[]).map((h,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", marginTop:5, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:13, color:"#374151", fontWeight:500 }}>{h.action}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{h.created_at?.slice(0,10)}</div>
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
        <Modal title="Registrar Producto" onClose={()=>{ setShowReg(false); setRegCat(null); setRegForm({}); setRegName(""); setRegSerial(""); setRegWarranty(""); }}>
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
              <Inp label="🛡️ Fecha de vencimiento de garantía (opcional)" value={regWarranty} onChange={setRegWarranty} type="date" />
              <Btn onClick={doRegister} full loading={actionLoading}>Registrar producto</Btn>
            </>
          )}
        </Modal>
      )}

      {/* ── TRANSFERIR ── */}
      {showXfer && selProduct && (
        <Modal title="Transferir propiedad" onClose={()=>{ setShowXfer(false); setXferEmail(""); setXferDocs({}); }}>
          <div style={{ background:"#fef9c3", border:"1px solid #fcd34d", borderRadius:10, padding:12, marginBottom:16 }}>
            <div style={{ fontWeight:600, fontSize:13, color:"#92400e", marginBottom:2 }}>⚠️ Esta acción es permanente</div>
            <div style={{ fontSize:13, color:"#92400e" }}>Transferirás <strong>{selProduct.name}</strong> a otro usuario.</div>
          </div>
          <Inp label="Correo del nuevo propietario" value={xferEmail} onChange={setXferEmail} placeholder="correo@ejemplo.com" type="email" />
          {(selProduct.product_files||[]).length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:8 }}>📎 ¿Transferir documentos adjuntos?</div>
              {(selProduct.product_files||[]).map(f=><FileCard key={f.id} f={f} showCheck={true} />)}
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={doTransfer} loading={actionLoading}>Confirmar transferencia</Btn>
            <Btn onClick={()=>{ setShowXfer(false); setXferEmail(""); setXferDocs({}); }} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* ── VISOR DE ARCHIVOS ── */}
      {previewFile && (
        <div style={{ position:"fixed", inset:0, background:"#000d", display:"flex", flexDirection:"column", zIndex:200 }}>
          <div style={{ background:"#1e1e2e", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ color:"#fff", fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"60%" }}>
              {previewFile.name}
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0 }}>
              <a href={previewFile.url} target="_blank" rel="noreferrer"
                style={{ background:"#6366f1", color:"#fff", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, textDecoration:"none" }}>
                ⬇️ Descargar
              </a>
              <button onClick={()=>setPreviewFile(null)}
                style={{ background:"#ffffff22", border:"none", color:"#fff", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                ✕ Cerrar
              </button>
            </div>
          </div>
          <div style={{ flex:1, overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            {["jpg","jpeg","png","gif","webp"].includes(previewFile.ext) && (
              <img src={previewFile.url} alt={previewFile.name}
                style={{ maxWidth:"100%", maxHeight:"100%", borderRadius:8, boxShadow:"0 8px 40px #0008" }} />
            )}
            {previewFile.ext==="pdf" && (
              <iframe src={previewFile.url} title={previewFile.name}
                style={{ width:"100%", height:"100%", minHeight:"70vh", border:"none", borderRadius:8 }} />
            )}
            {["doc","docx","xls","xlsx"].includes(previewFile.ext) && (
              <div style={{ background:"#fff", borderRadius:16, padding:40, textAlign:"center", maxWidth:400 }}>
                <div style={{ fontSize:64, marginBottom:16 }}>
                  {["xls","xlsx"].includes(previewFile.ext)?"📊":"📝"}
                </div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>{previewFile.name}</div>
                <div style={{ color:"#6b7280", fontSize:14, marginBottom:24 }}>
                  Los archivos Word y Excel no se pueden previsualizar en el navegador. Descárgalo para abrirlo.
                </div>
                <a href={previewFile.url} target="_blank" rel="noreferrer"
                  style={{ background:"#6366f1", color:"#fff", borderRadius:8, padding:"10px 24px", fontSize:14, fontWeight:600, textDecoration:"none" }}>
                  ⬇️ Descargar para abrir
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}