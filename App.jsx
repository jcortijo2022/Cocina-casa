import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MEAL_TYPES = ["Comida","Cena","Fin de Semana","Postre","Entrante","Verano","Salsas","Otros"];
const RECIPE_TYPES = ["Carne","Guisos","Pescados","Arroz y Pasta","Verdura","Otros platos"];
const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const MEAL_SLOTS = ["Comida","Cena"];

const MEAL_TYPE_COLORS = {
  "Comida":       { bg: "#F97316", text: "#fff" },
  "Cena":         { bg: "#6366F1", text: "#fff" },
  "Fin de Semana":{ bg: "#10B981", text: "#fff" },
  "Postre":       { bg: "#EC4899", text: "#fff" },
  "Entrante":     { bg: "#8B5CF6", text: "#fff" },
  "Verano":       { bg: "#0EA5E9", text: "#fff" },
  "Salsas":       { bg: "#EF4444", text: "#fff" },
  "Otros":        { bg: "#6B7280", text: "#fff" },
};

const SHOPPING_CATEGORIES = [
  { id:"carnes",      label:"Carnes",                   emoji:"🥩" },
  { id:"pescados",    label:"Pescados y Mariscos",       emoji:"🐟" },
  { id:"verduras",    label:"Verduras y Hortalizas",     emoji:"🥦" },
  { id:"cereales",    label:"Cereales y Legumbres",      emoji:"🌾" },
  { id:"conservas",   label:"Conservas y Salsas",        emoji:"🥫" },
  { id:"especias",    label:"Especias y Condimentos",    emoji:"🧂" },
  { id:"otros",       label:"Otros",                     emoji:"🛒" },
];

function getWeekKey(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff + offset * 7));
  return monday.toISOString().split("T")[0];
}

function getWeekLabel(offset) {
  if (offset === 0) return "Esta semana";
  if (offset === -1) return "Semana Pasada";
  if (offset === 1) return "Próxima Semana";
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date().setDate(diff + offset * 7));
  const opts = { day:"numeric", month:"long" };
  return monday.toLocaleDateString("es-ES", opts);
}

function guessCategory(name) {
  const n = name.toLowerCase();
  if (/pollo|carne|cerdo|ternera|jamón|chorizo|morcilla|panceta|costill|buey|cordero|pavo|pato/.test(n)) return "carnes";
  if (/pescado|atún|salmón|merluza|mejillón|gamba|marisco|calamar|sepia|bacalao|sardina/.test(n)) return "pescados";
  if (/tomate|cebolla|ajo|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacín|puerro|apio|pepino|brócoli|coliflor|alcachofa|verdura|hortali/.test(n)) return "verduras";
  if (/arroz|pasta|fideos|garbanz|lenteja|judía|alubia|harina|pan|maíz|cereal|quinoa/.test(n)) return "cereales";
  if (/tomate frito|salsa|conserva|lata|bote|caldo|caldo|aceitunas|alcaparra/.test(n)) return "conservas";
  if (/sal|pimienta|azafrán|colorante|orégano|tomillo|romero|laurel|comino|pimentón|curry|especias|aceite|vinagre/.test(n)) return "especias";
  return "otros";
}

// ─── STAR RATING ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 18 }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => onChange(value === i ? 0 : i)}
          style={{ cursor:"pointer", fontSize:size, color: i <= value ? "#F59E0B" : "#D1D5DB", transition:"color .15s" }}>★</span>
      ))}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, title, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)" }}/>
      <div style={{ position:"relative",zIndex:1,background:"#fff",borderRadius:20,width:`min(${width}px,95vw)`,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.18)",padding:"28px 28px 24px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
          <h2 style={{ margin:0,fontSize:20,fontWeight:700,color:"#111" }}>{title}</h2>
          <button onClick={onClose} style={{ border:"none",background:"#F3F4F6",borderRadius:50,width:32,height:32,cursor:"pointer",fontSize:18,color:"#555",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── ADD RECIPE MODAL ────────────────────────────────────────────────────────
function AddRecipeModal({ open, onClose, onAdd }) {
  const [tab, setTab] = useState("enlace");
  const [url, setUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  async function callClaude(prompt, imgData = null) {
    const msgs = imgData
      ? [{ role:"user", content:[{ type:"image", source:{ type:"base64", media_type:imgData.type, data:imgData.data } },{ type:"text", text:prompt }] }]
      : [{ role:"user", content: prompt }];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system: "Eres un asistente de cocina. Devuelve SOLO JSON válido sin backticks ni texto adicional.", messages: msgs })
    });
    const d = await res.json();
    const text = d.content?.map(c=>c.text||"").join("") || "";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  }

  async function importRecipe(promptText, imgData = null) {
    setLoading(true); setError("");
    try {
      const data = await callClaude(promptText, imgData);
      onAdd({
        id: Date.now(),
        title: data.title || "Receta importada",
        description: data.description || "",
        image: data.image || "",
        mealType: data.mealType || "Comida",
        recipeType: data.recipeType || "Otros platos",
        ingredients: (data.ingredients || []).map((ing, i) => ({ id: Date.now()+i, ...ing })),
        steps: data.steps || "",
        sourceUrl: data.sourceUrl || "",
        time: data.time || "",
        servings: data.servings || 4,
        rating: 0,
      });
      onClose();
    } catch(e) {
      setError("Error al importar la receta. Intenta de nuevo.");
    }
    setLoading(false);
  }

  function handleUrl() {
    if (!url.trim()) return;
    const prompt = `Analiza esta URL de receta: ${url}
Extrae toda la información y devuelve JSON con este formato exacto:
{"title":"","description":"","image":"URL de imagen si existe","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"","unit":"","name":""}],"steps":"pasos de preparación","sourceUrl":"${url}","time":"","servings":4}
Los valores mealType deben ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros
Los valores recipeType deben ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos`;
    importRecipe(prompt);
  }

  function handleText() {
    if (!textInput.trim()) return;
    const prompt = `Analiza este texto de receta y extrae toda la información:
${textInput}
Devuelve JSON con este formato exacto:
{"title":"","description":"","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"","unit":"","name":""}],"steps":"pasos de preparación","sourceUrl":"","time":"","servings":4}`;
    importRecipe(prompt);
  }

  function handleSearch() {
    if (!searchQuery.trim()) return;
    const prompt = `Crea una receta detallada para: ${searchQuery}
Devuelve JSON con este formato exacto:
{"title":"","description":"","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"","unit":"","name":""}],"steps":"pasos de preparación detallados","sourceUrl":"","time":"","servings":4}`;
    importRecipe(prompt);
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      const prompt = `Analiza esta imagen de receta y extrae toda la información visible.
Devuelve JSON con este formato exacto:
{"title":"","description":"","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"","unit":"","name":""}],"steps":"pasos de preparación","sourceUrl":"","time":"","servings":4}`;
      importRecipe(prompt, { type: file.type, data: base64 });
    };
    reader.readAsDataURL(file);
  }

  const tabs = [
    { id:"foto", label:"📷 Foto" },
    { id:"enlace", label:"🔗 Enlace" },
    { id:"video", label:"🎥 Vídeo" },
    { id:"buscar", label:"🔍 Buscar" },
    { id:"texto", label:"📝 Texto" },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Añadir Receta" width={520}>
      <div style={{ display:"flex",gap:6,marginBottom:20,flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:"7px 14px",borderRadius:20,border:`2px solid ${tab===t.id?"#F97316":"#E5E7EB"}`,background:tab===t.id?"#FFF7ED":"#fff",color:tab===t.id?"#F97316":"#555",fontWeight:600,cursor:"pointer",fontSize:13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "foto" && (
        <div>
          <p style={{ color:"#6B7280",fontSize:14,marginBottom:12 }}>Sube una foto de la receta y la IA la importará automáticamente.</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display:"none" }} />
          <button onClick={()=>fileRef.current.click()}
            style={{ width:"100%",padding:"40px 20px",border:"2px dashed #E5E7EB",borderRadius:12,background:"#FAFAFA",cursor:"pointer",color:"#9CA3AF",fontSize:15 }}>
            📸 Haz clic para seleccionar una imagen
          </button>
        </div>
      )}
      {tab === "enlace" && (
        <div>
          <p style={{ color:"#6B7280",fontSize:14,marginBottom:12 }}>Pega el enlace de una receta de cualquier web y la IA la importará automáticamente.</p>
          <label style={{ fontWeight:600,fontSize:13,color:"#374151" }}>URL de la receta</label>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://ejemplo.com/receta..."
            style={{ display:"block",width:"100%",marginTop:8,padding:"12px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }} />
        </div>
      )}
      {tab === "video" && (
        <div>
          <p style={{ color:"#6B7280",fontSize:14,marginBottom:12 }}>Pega el enlace de un vídeo de YouTube u otra plataforma.</p>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
            style={{ display:"block",width:"100%",marginTop:8,padding:"12px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }} />
        </div>
      )}
      {tab === "buscar" && (
        <div>
          <p style={{ color:"#6B7280",fontSize:14,marginBottom:12 }}>Escribe el nombre de un plato y la IA creará la receta.</p>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Ej: Paella valenciana, Gazpacho..."
            style={{ display:"block",width:"100%",marginTop:8,padding:"12px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }}
            onKeyDown={e=>e.key==="Enter"&&handleSearch()} />
        </div>
      )}
      {tab === "texto" && (
        <div>
          <p style={{ color:"#6B7280",fontSize:14,marginBottom:12 }}>Pega el texto de la receta y la IA la estructurará automáticamente.</p>
          <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} rows={6} placeholder="Pega aquí el texto de la receta..."
            style={{ display:"block",width:"100%",marginTop:8,padding:"12px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box" }} />
        </div>
      )}

      {error && <p style={{ color:"#EF4444",fontSize:13,marginTop:10 }}>{error}</p>}

      <button disabled={loading}
        onClick={() => {
          if (tab==="enlace"||tab==="video") handleUrl();
          else if (tab==="buscar") handleSearch();
          else if (tab==="texto") handleText();
        }}
        style={{ marginTop:20,width:"100%",padding:"14px",background:loading?"#FED7AA":"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",transition:"background .2s" }}>
        {loading ? "⏳ Importando..." : "Importar Receta"}
      </button>
    </Modal>
  );
}

// ─── EDIT INGREDIENTS MODAL ──────────────────────────────────────────────────
function EditIngredientsModal({ open, onClose, ingredients, onSave }) {
  const [local, setLocal] = useState([]);
  useEffect(() => { if (open) setLocal(ingredients.map(i=>({...i}))); }, [open, ingredients]);

  function update(id, field, val) {
    setLocal(prev => prev.map(i => i.id===id ? {...i,[field]:val} : i));
  }
  function addLine() {
    setLocal(prev => [...prev, { id:Date.now(), amount:"", unit:"unidad", name:"" }]);
  }
  function save() {
    onSave(local.filter(i => i.name.trim() !== ""));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Ingredientes" width={600}>
      <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:"55vh",overflowY:"auto" }}>
        {local.map(ing => (
          <div key={ing.id} style={{ display:"flex",gap:8,alignItems:"center" }}>
            <input value={ing.amount} onChange={e=>update(ing.id,"amount",e.target.value)}
              style={{ width:70,padding:"8px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13 }} placeholder="Cant." />
            <input value={ing.unit} onChange={e=>update(ing.id,"unit",e.target.value)}
              style={{ width:90,padding:"8px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13 }} placeholder="Unidad" />
            <input value={ing.name} onChange={e=>update(ing.id,"name",e.target.value)}
              style={{ flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13 }} placeholder="Ingrediente" />
            <button onClick={()=>setLocal(prev=>prev.filter(i=>i.id!==ing.id))}
              style={{ padding:"6px 10px",background:"#FEE2E2",border:"none",borderRadius:8,cursor:"pointer",color:"#EF4444",fontSize:14 }}>🗑</button>
          </div>
        ))}
      </div>
      <button onClick={addLine}
        style={{ marginTop:12,padding:"9px 16px",background:"#F3F4F6",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,color:"#374151",fontSize:13 }}>
        + Añadir línea
      </button>
      <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:20 }}>
        <button onClick={onClose} style={{ padding:"10px 20px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600 }}>Cancelar</button>
        <button onClick={save} style={{ padding:"10px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700 }}>Guardar</button>
      </div>
    </Modal>
  );
}

// ─── ADD TO MENU MODAL ───────────────────────────────────────────────────────
function AddToMenuModal({ open, onClose, recipe, weekMenu, setWeekMenu, currentWeekOffset }) {
  const [day, setDay] = useState("Lunes");
  const [slot, setSlot] = useState("Comida");

  function add() {
    const key = getWeekKey(currentWeekOffset);
    setWeekMenu(prev => {
      const week = { ...(prev[key] || {}) };
      if (!week[day]) week[day] = {};
      if (!week[day][slot]) week[day][slot] = [];
      if (!week[day][slot].find(r=>r.id===recipe.id))
        week[day][slot] = [...week[day][slot], recipe];
      return { ...prev, [key]: week };
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Añadir al Menú Semanal" width={400}>
      <div style={{ marginBottom:14 }}>
        <label style={{ fontWeight:600,fontSize:13,color:"#374151",display:"block",marginBottom:6 }}>Día</label>
        <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
          {DAYS.map(d => (
            <button key={d} onClick={()=>setDay(d)}
              style={{ padding:"7px 14px",borderRadius:20,border:`2px solid ${day===d?"#F97316":"#E5E7EB"}`,background:day===d?"#FFF7ED":"#fff",color:day===d?"#F97316":"#555",fontWeight:600,cursor:"pointer",fontSize:12 }}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ fontWeight:600,fontSize:13,color:"#374151",display:"block",marginBottom:6 }}>Momento</label>
        <div style={{ display:"flex",gap:8 }}>
          {MEAL_SLOTS.map(s => (
            <button key={s} onClick={()=>setSlot(s)}
              style={{ flex:1,padding:"10px",borderRadius:10,border:`2px solid ${slot===s?"#F97316":"#E5E7EB"}`,background:slot===s?"#FFF7ED":"#fff",color:slot===s?"#F97316":"#555",fontWeight:600,cursor:"pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex",gap:10 }}>
        <button onClick={onClose} style={{ flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600 }}>Cancelar</button>
        <button onClick={add} style={{ flex:1,padding:"11px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700 }}>Añadir</button>
      </div>
    </Modal>
  );
}

// ─── COPY WEEK MODAL ─────────────────────────────────────────────────────────
function CopyWeekModal({ open, onClose, weekMenu, currentWeekOffset, setWeekMenu }) {
  const [selected, setSelected] = useState(null);
  const offsets = [-4,-3,-2,-1,0,1,2,3,4].filter(o=>o!==currentWeekOffset);

  function copy() {
    if (selected === null) return;
    const srcKey = getWeekKey(currentWeekOffset);
    const dstKey = getWeekKey(selected);
    setWeekMenu(prev => ({ ...prev, [dstKey]: JSON.parse(JSON.stringify(prev[srcKey] || {})) }));
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Copiar menú a otra semana" width={380}>
      <p style={{ color:"#6B7280",fontSize:14,marginBottom:14 }}>Selecciona la semana destino:</p>
      <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:"55vh",overflowY:"auto" }}>
        {offsets.map(o => {
          const key = getWeekKey(o);
          const has = weekMenu[key] && Object.keys(weekMenu[key]).length>0;
          const isSel = selected===o;
          return (
            <button key={o} onClick={()=>setSelected(o)}
              style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:12,border:`2px solid ${isSel?"#F97316":"#E5E7EB"}`,background:isSel?"#FFF7ED":"#fff",cursor:"pointer",textAlign:"left" }}>
              <span style={{ fontWeight:600,color:isSel?"#F97316":"#111",fontSize:14 }}>
                {o===0?"Esta semana":o===-1?"Semana Pasada":o===1?"Próxima Semana":getWeekLabel(o)}
              </span>
              {has && <span style={{ fontSize:12,color:"#9CA3AF" }}>tiene menú</span>}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex",gap:10,marginTop:20 }}>
        <button onClick={onClose} style={{ flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600 }}>Cancelar</button>
        <button onClick={copy} disabled={selected===null}
          style={{ flex:1,padding:"11px",background:selected===null?"#FED7AA":"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:selected===null?"not-allowed":"pointer",fontWeight:700 }}>Copiar</button>
      </div>
    </Modal>
  );
}

// ─── RECIPE CARD ─────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onOpen, onDelete, onAddMenu }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const col = MEAL_TYPE_COLORS[recipe.mealType] || MEAL_TYPE_COLORS["Otros"];

  return (
    <div style={{ background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.07)",cursor:"pointer",position:"relative",transition:"transform .15s,box-shadow .15s" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.12)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.07)"}}>
      <div style={{ position:"relative",height:180,background:"#F3F4F6",overflow:"hidden" }} onClick={()=>onOpen(recipe)}>
        {recipe.image
          ? <img src={recipe.image} alt={recipe.title} style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.style.display="none"}} />
          : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48 }}>🍽️</div>
        }
        <span style={{ position:"absolute",top:10,left:10,padding:"4px 10px",borderRadius:20,background:col.bg,color:col.text,fontWeight:700,fontSize:12 }}>
          {recipe.mealType}
        </span>
        <div style={{ position:"absolute",top:8,right:8 }}>
          <button onClick={e=>{e.stopPropagation();setMenuOpen(v=>!v)}}
            style={{ width:28,height:28,borderRadius:50,background:"rgba(255,255,255,.9)",border:"none",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>⋮</button>
          {menuOpen && (
            <div style={{ position:"absolute",right:0,top:32,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.15)",minWidth:160,zIndex:10,overflow:"hidden" }}
              onMouseLeave={()=>setMenuOpen(false)}>
              <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onAddMenu(recipe)}}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",width:"100%",fontSize:13,fontWeight:600,color:"#374151" }}>
                📅 Añadir al menú
              </button>
              <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onDelete(recipe.id)}}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",width:"100%",fontSize:13,fontWeight:600,color:"#EF4444" }}>
                🗑️ Eliminar receta
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"14px 14px 10px" }} onClick={()=>onOpen(recipe)}>
        <h3 style={{ margin:"0 0 6px",fontSize:15,fontWeight:700,color:"#111",lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{recipe.title}</h3>
        <p style={{ margin:"0 0 10px",fontSize:13,color:"#6B7280",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{recipe.description}</p>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",gap:12,fontSize:12,color:"#9CA3AF" }}>
            {recipe.time && <span>⏱ {recipe.time}</span>}
            <span>👥 {recipe.servings}p</span>
          </div>
          <StarRating value={recipe.rating} onChange={()=>{}} size={14} />
        </div>
      </div>
    </div>
  );
}

// ─── RECIPE DETAIL ───────────────────────────────────────────────────────────
function RecipeDetail({ recipe, onBack, onDelete, onUpdate, onAddMenu }) {
  const [editIngOpen, setEditIngOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [weekMenu, setWeekMenu] = useState({});

  const col = MEAL_TYPE_COLORS[recipe.mealType] || MEAL_TYPE_COLORS["Otros"];

  function updateField(field, val) {
    onUpdate({ ...recipe, [field]: val });
  }

  return (
    <div style={{ maxWidth:700,margin:"0 auto",padding:"20px 16px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontWeight:600,color:"#374151",fontSize:15 }}>
          ← Volver
        </button>
        <button onClick={()=>onDelete(recipe.id)}
          style={{ background:"#FEE2E2",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",color:"#EF4444",fontSize:16 }}>🗑️</button>
      </div>

      {recipe.image && (
        <div style={{ borderRadius:16,overflow:"hidden",marginBottom:20,height:280 }}>
          <img src={recipe.image} alt={recipe.title} style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e=>{e.target.parentNode.style.display="none"}} />
        </div>
      )}

      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:16 }}>
        <select value={recipe.mealType} onChange={e=>updateField("mealType",e.target.value)}
          style={{ padding:"6px 12px",borderRadius:20,border:`2px solid ${col.bg}`,background:col.bg,color:col.text,fontWeight:700,fontSize:12,cursor:"pointer" }}>
          {MEAL_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={recipe.recipeType} onChange={e=>updateField("recipeType",e.target.value)}
          style={{ padding:"6px 12px",borderRadius:20,border:"2px solid #E5E7EB",background:"#fff",fontWeight:600,fontSize:12,cursor:"pointer" }}>
          {RECIPE_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      <h1 style={{ fontSize:26,fontWeight:800,color:"#111",marginBottom:8 }}>{recipe.title}</h1>
      <p style={{ fontSize:15,color:"#6B7280",marginBottom:14,lineHeight:1.6 }}>{recipe.description}</p>

      <div style={{ display:"flex",gap:20,marginBottom:20,fontSize:14,color:"#6B7280" }}>
        {recipe.time && <span>⏱ {recipe.time}</span>}
        <span>👥 {recipe.servings} porciones</span>
      </div>

      {recipe.sourceUrl && (
        <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex",alignItems:"center",gap:6,color:"#F97316",fontWeight:600,fontSize:14,marginBottom:20,textDecoration:"none" }}>
          🔗 Ver fuente original
        </a>
      )}

      <div style={{ display:"flex",alignItems:"center",gap:20,padding:"16px",background:"#FFF7ED",borderRadius:14,marginBottom:24 }}>
        <div>
          <p style={{ margin:"0 0 4px",fontSize:13,color:"#9CA3AF",fontWeight:600 }}>Tu valoración</p>
          <StarRating value={recipe.rating} onChange={v=>updateField("rating",v)} size={22} />
        </div>
        <button onClick={()=>setAddMenuOpen(true)}
          style={{ marginLeft:"auto",padding:"10px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer" }}>
          📅 Añadir al menú
        </button>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Ingredientes</h2>
          <button onClick={()=>setEditIngOpen(true)}
            style={{ padding:"8px 16px",background:"#F3F4F6",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13 }}>✏️ Editar</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {recipe.ingredients.map(ing => (
            <div key={ing.id} style={{ display:"flex",gap:12,padding:"10px 14px",background:"#F9FAFB",borderRadius:10,fontSize:14 }}>
              <span style={{ fontWeight:700,color:"#F97316",minWidth:50 }}>{ing.amount}</span>
              <span style={{ color:"#9CA3AF",minWidth:80 }}>{ing.unit}</span>
              <span style={{ color:"#374151" }}>{ing.name}</span>
            </div>
          ))}
        </div>
      </div>

      {recipe.steps && (
        <div>
          <h2 style={{ fontSize:18,fontWeight:700,marginBottom:14 }}>Preparación</h2>
          <div style={{ fontSize:14,color:"#374151",lineHeight:1.8,whiteSpace:"pre-line",background:"#F9FAFB",padding:"16px",borderRadius:12 }}>
            {recipe.steps}
          </div>
        </div>
      )}

      <EditIngredientsModal open={editIngOpen} onClose={()=>setEditIngOpen(false)}
        ingredients={recipe.ingredients} onSave={ings=>onUpdate({...recipe,ingredients:ings})} />

      <AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)}
        recipe={recipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={0} />
    </div>
  );
}

// ─── RECIPES PAGE ─────────────────────────────────────────────────────────────
function RecipesPage({ recipes, onAdd, onDelete, onUpdate, weekMenu, setWeekMenu, currentWeekOffset }) {
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [addMenuRecipe, setAddMenuRecipe] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMeal, setFilterMeal] = useState("Todas");
  const [filterType, setFilterType] = useState("Todos los tipos");

  if (detail) {
    const live = recipes.find(r=>r.id===detail.id) || detail;
    return <RecipeDetail recipe={live} onBack={()=>setDetail(null)}
      onDelete={id=>{onDelete(id);setDetail(null)}}
      onUpdate={onUpdate}
      onAddMenu={()=>setAddMenuRecipe(live)} />;
  }

  const filtered = recipes.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchMeal = filterMeal==="Todas" || r.mealType===filterMeal;
    const matchType = filterType==="Todos los tipos" || r.recipeType===filterType;
    return matchSearch && matchMeal && matchType;
  });

  return (
    <div style={{ padding:"28px 24px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
        <div>
          <h1 style={{ margin:0,fontSize:28,fontWeight:800,color:"#111" }}>Nuestras Recetas</h1>
          <p style={{ margin:"4px 0 0",color:"#9CA3AF",fontSize:14 }}>{recipes.length} recetas guardadas</p>
        </div>
        <button onClick={()=>setAddOpen(true)}
          style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer" }}>
          + Añadir Receta
        </button>
      </div>

      <div style={{ display:"flex",gap:10,margin:"20px 0",flexWrap:"wrap" }}>
        <div style={{ flex:1,minWidth:200,position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#9CA3AF" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar recetas..."
            style={{ width:"100%",padding:"11px 14px 11px 36px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }} />
        </div>
        <select value={filterMeal} onChange={e=>setFilterMeal(e.target.value)}
          style={{ padding:"11px 16px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:14,background:"#fff",cursor:"pointer" }}>
          <option>Todas</option>
          {MEAL_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{ padding:"11px 16px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:14,background:"#fff",cursor:"pointer" }}>
          <option>Todos los tipos</option>
          {RECIPE_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:18 }}>
        {filtered.map(r => (
          <RecipeCard key={r.id} recipe={r} onOpen={setDetail} onDelete={onDelete}
            onAddMenu={r=>setAddMenuRecipe(r)} />
        ))}
        {filtered.length===0 && (
          <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"60px",color:"#9CA3AF" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🍽️</div>
            <p style={{ fontSize:16 }}>No hay recetas. ¡Añade la primera!</p>
          </div>
        )}
      </div>

      <AddRecipeModal open={addOpen} onClose={()=>setAddOpen(false)} onAdd={r=>{onAdd(r);setAddOpen(false)}} />
      {addMenuRecipe && (
        <AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)}
          recipe={addMenuRecipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset} />
      )}
    </div>
  );
}

// ─── WEEKLY MENU PAGE ─────────────────────────────────────────────────────────
function WeeklyMenuPage({ recipes, weekMenu, setWeekMenu }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [copyOpen, setCopyOpen] = useState(false);
  const [addRecipeModal, setAddRecipeModal] = useState(null); // {day, slot}
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);
  const [searchPicker, setSearchPicker] = useState("");

  const key = getWeekKey(weekOffset);
  const menu = weekMenu[key] || {};

  function removeFromMenu(day, slot, id) {
    setWeekMenu(prev => {
      const w = { ...(prev[key]||{}) };
      w[day] = { ...(w[day]||{}) };
      w[day][slot] = (w[day][slot]||[]).filter(r=>r.id!==id);
      return { ...prev, [key]: w };
    });
  }

  function addToMenu(recipe) {
    if (!addRecipeModal) return;
    const { day, slot } = addRecipeModal;
    setWeekMenu(prev => {
      const w = { ...(prev[key]||{}) };
      w[day] = { ...(w[day]||{}) };
      w[day][slot] = w[day][slot] || [];
      if (!w[day][slot].find(r=>r.id===recipe.id))
        w[day][slot] = [...w[day][slot], recipe];
      return { ...prev, [key]: w };
    });
    setRecipePickerOpen(false);
    setAddRecipeModal(null);
  }

  function buildWhatsApp() {
    let txt = `🍽️ *Menú Semanal - ${getWeekLabel(weekOffset)}*\n\n`;
    DAYS.forEach(day => {
      const slots = menu[day];
      if (!slots) return;
      txt += `*${day}*\n`;
      MEAL_SLOTS.forEach(slot => {
        const items = slots[slot];
        if (items && items.length) txt += `  ${slot}: ${items.map(r=>r.title).join(", ")}\n`;
      });
      txt += "\n";
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  }

  const filteredPicker = recipes.filter(r => r.title.toLowerCase().includes(searchPicker.toLowerCase()));

  return (
    <div style={{ padding:"28px 24px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ margin:0,fontSize:28,fontWeight:800,color:"#111" }}>Menú Semanal</h1>
          <p style={{ margin:"4px 0 0",color:"#9CA3AF",fontSize:14 }}>Planifica tus comidas de la semana</p>
        </div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
          <button onClick={()=>setCopyOpen(true)}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer" }}>
            📋 Copiar semana
          </button>
          <button onClick={buildWhatsApp}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#25D366",color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer" }}>
            💬 WhatsApp
          </button>
          <button onClick={()=>{
            const key2 = getWeekKey(weekOffset);
            const items = [];
            Object.values(weekMenu[key2]||{}).forEach(slots=>Object.values(slots).forEach(rs=>rs.forEach(r=>items.push(r.title))));
            navigator.clipboard.writeText(items.join(", ")).catch(()=>{});
          }} style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer" }}>
            🛒 Lista de Compra
          </button>
        </div>
      </div>

      <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:24,justifyContent:"center" }}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{ background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:16 }}>‹</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontWeight:700,fontSize:16 }}>{getWeekLabel(weekOffset)==="Esta semana"?`${new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}`:getWeekLabel(weekOffset)}</div>
          <div style={{ fontSize:13,color:"#9CA3AF" }}>{getWeekLabel(weekOffset)}</div>
        </div>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{ background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:16 }}>›</button>
      </div>

      <p style={{ textAlign:"center",color:"#F59E0B",fontSize:13,marginBottom:16 }}>💡 Pincha en + para añadir recetas</p>

      <div style={{ borderRadius:16,overflow:"hidden",border:"1.5px solid #E5E7EB",background:"#fff" }}>
        <div style={{ display:"grid",gridTemplateColumns:"120px 1fr 1fr" }}>
          <div style={{ padding:"14px 16px",background:"#F9FAFB",fontWeight:700,fontSize:13,color:"#6B7280" }}></div>
          {MEAL_SLOTS.map(s => (
            <div key={s} style={{ padding:"14px 16px",background:"#F9FAFB",fontWeight:700,fontSize:14,color:"#374151",borderLeft:"1px solid #E5E7EB",textAlign:"center" }}>{s}</div>
          ))}
        </div>
        {DAYS.map((day,di) => (
          <div key={day} style={{ display:"grid",gridTemplateColumns:"120px 1fr 1fr",borderTop:"1px solid #E5E7EB" }}>
            <div style={{ padding:"16px",display:"flex",alignItems:"center",background:"#FAFAFA",fontWeight:700,fontSize:14 }}>{day}</div>
            {MEAL_SLOTS.map(slot => {
              const items = menu[day]?.[slot] || [];
              return (
                <div key={slot} style={{ padding:"12px",borderLeft:"1px solid #E5E7EB",minHeight:64 }}>
                  {items.map(r => (
                    <div key={r.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#F3F4F6",borderRadius:8,marginBottom:6,fontSize:13 }}>
                      <span style={{ flex:1,fontWeight:500 }}>{r.title}</span>
                      <button onClick={()=>removeFromMenu(day,slot,r.id)}
                        style={{ background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14,padding:2 }}>×</button>
                    </div>
                  ))}
                  <button onClick={()=>{setAddRecipeModal({day,slot});setRecipePickerOpen(true);setSearchPicker("")}}
                    style={{ background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:22,width:"100%",padding:"4px" }}>+</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <CopyWeekModal open={copyOpen} onClose={()=>setCopyOpen(false)}
        weekMenu={weekMenu} currentWeekOffset={weekOffset} setWeekMenu={setWeekMenu} />

      {/* Recipe Picker */}
      <Modal open={recipePickerOpen} onClose={()=>{setRecipePickerOpen(false);setAddRecipeModal(null)}}
        title={`Añadir receta - ${addRecipeModal?.day} ${addRecipeModal?.slot}`} width={480}>
        <input value={searchPicker} onChange={e=>setSearchPicker(e.target.value)} placeholder="Buscar receta..."
          style={{ display:"block",width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:14 }} />
        <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:"50vh",overflowY:"auto" }}>
          {filteredPicker.map(r => (
            <button key={r.id} onClick={()=>addToMenu(r)}
              style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#F9FAFB",border:"1.5px solid transparent",borderRadius:10,cursor:"pointer",textAlign:"left" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#F97316"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
              {r.image
                ? <img src={r.image} style={{ width:40,height:40,borderRadius:8,objectFit:"cover" }} onError={e=>{e.target.style.display="none"}} />
                : <div style={{ width:40,height:40,borderRadius:8,background:"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center" }}>🍽️</div>
              }
              <div>
                <div style={{ fontWeight:600,fontSize:14,color:"#111" }}>{r.title}</div>
                <div style={{ fontSize:12,color:"#9CA3AF" }}>{r.mealType} · {r.recipeType}</div>
              </div>
            </button>
          ))}
          {filteredPicker.length===0 && <p style={{ textAlign:"center",color:"#9CA3AF",padding:20 }}>No hay recetas</p>}
        </div>
      </Modal>
    </div>
  );
}

// ─── SHOPPING LIST PAGE ───────────────────────────────────────────────────────
function ShoppingListPage({ weekMenu, recipes }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [checked, setChecked] = useState({});
  const [extraItems, setExtraItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [editItem, setEditItem] = useState(null); // {id, amount, unit, name}

  const key = getWeekKey(weekOffset);
  const menu = weekMenu[key] || {};

  // Build ingredient list from menu
  const ingredientMap = {};
  Object.values(menu).forEach(slots => {
    Object.values(slots).forEach(rs => {
      rs.forEach(r => {
        const full = recipes.find(rec=>rec.id===r.id);
        (full?.ingredients||r.ingredients||[]).forEach(ing => {
          const k = ing.name.toLowerCase().trim();
          if (!ingredientMap[k]) ingredientMap[k] = { ...ing, id: k, category: guessCategory(ing.name), sources: 1 };
          else ingredientMap[k].sources++;
        });
      });
    });
  });

  const allItems = [
    ...Object.values(ingredientMap),
    ...extraItems,
  ];

  const grouped = {};
  SHOPPING_CATEGORIES.forEach(c => { grouped[c.id] = []; });
  allItems.forEach(item => {
    const cat = item.category || "otros";
    if (grouped[cat]) grouped[cat].push(item);
    else grouped["otros"].push(item);
  });

  const checkedCount = allItems.filter(i=>checked[i.id]).length;

  function toggleCheck(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function addExtra() {
    if (!newItem.trim()) return;
    const id = `extra-${Date.now()}`;
    setExtraItems(prev => [...prev, { id, amount:"", unit:"", name:newItem.trim(), category:guessCategory(newItem) }]);
    setNewItem("");
  }

  function deleteChecked() {
    const checkedIds = Object.entries(checked).filter(([,v])=>v).map(([k])=>k);
    setExtraItems(prev => prev.filter(i=>!checkedIds.includes(i.id)));
    setChecked(prev => {
      const next = {...prev};
      checkedIds.forEach(id => delete next[id]);
      return next;
    });
  }

  function buildWhatsApp() {
    let txt = `🛒 *Lista de la Compra - ${getWeekLabel(weekOffset)}*\n\n`;
    SHOPPING_CATEGORIES.forEach(c => {
      const items = grouped[c.id];
      if (!items.length) return;
      txt += `*${c.emoji} ${c.label}*\n`;
      items.forEach(i => { txt += `  • ${i.name}${i.amount?` (${i.amount} ${i.unit})`:""}${checked[i.id]?" ✓":""}\n`; });
      txt += "\n";
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  }

  function copyList() {
    let txt = "";
    SHOPPING_CATEGORIES.forEach(c => {
      const items = grouped[c.id];
      if (!items.length) return;
      txt += `${c.label}:\n`;
      items.forEach(i => { txt += `  - ${i.name}${i.amount?` (${i.amount} ${i.unit})`:""}\n`; });
      txt += "\n";
    });
    navigator.clipboard.writeText(txt).catch(()=>{});
  }

  return (
    <div style={{ padding:"28px 24px" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ margin:0,fontSize:28,fontWeight:800,color:"#111" }}>Lista de Compra</h1>
          <p style={{ margin:"4px 0 0",color:"#9CA3AF",fontSize:14 }}>Cantidades ajustadas para 4 personas</p>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={buildWhatsApp}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#25D366",color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer" }}>
            💬 WhatsApp
          </button>
          <button onClick={copyList}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer" }}>
            📋 Copiar lista
          </button>
        </div>
      </div>

      <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:20,justifyContent:"center" }}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{ background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:16 }}>‹</button>
        <div style={{ fontWeight:700,fontSize:16 }}>{getWeekLabel(weekOffset)}</div>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{ background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:16 }}>›</button>
      </div>

      {checkedCount > 0 && (
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,padding:"12px 16px",background:"#F0FDF4",borderRadius:10 }}>
          <span style={{ color:"#16A34A",fontWeight:600,fontSize:14 }}>✓ {checkedCount} marcados</span>
          <button onClick={deleteChecked}
            style={{ display:"flex",alignItems:"center",gap:6,background:"#FEE2E2",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"#EF4444",fontWeight:600,fontSize:13 }}>
            🗑️ Eliminar todos
          </button>
        </div>
      )}

      <div style={{ display:"flex",gap:10,marginBottom:24 }}>
        <input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Añadir alimento..."
          onKeyDown={e=>e.key==="Enter"&&addExtra()}
          style={{ flex:1,padding:"12px 16px",borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none" }} />
        <button onClick={addExtra}
          style={{ padding:"12px 18px",background:"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:18,cursor:"pointer" }}>+</button>
      </div>

      {SHOPPING_CATEGORIES.map(cat => {
        const items = grouped[cat.id];
        if (!items.length) return null;
        return (
          <div key={cat.id} style={{ marginBottom:20 }}>
            <h3 style={{ margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#9CA3AF",letterSpacing:.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:6 }}>
              {cat.emoji} {cat.label}
            </h3>
            <div style={{ background:"#fff",borderRadius:14,border:"1.5px solid #E5E7EB",overflow:"hidden" }}>
              {items.map((item, idx) => (
                <div key={item.id}>
                  {idx>0 && <div style={{ height:1,background:"#F3F4F6",margin:"0 16px" }} />}
                  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px" }}>
                    <button onClick={()=>toggleCheck(item.id)}
                      style={{ width:22,height:22,borderRadius:50,border:`2px solid ${checked[item.id]?"#F97316":"#D1D5DB"}`,background:checked[item.id]?"#F97316":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s" }}>
                      {checked[item.id] && <span style={{ color:"#fff",fontSize:13 }}>✓</span>}
                    </button>
                    <span style={{ flex:1,fontSize:14,fontWeight:500,color:checked[item.id]?"#9CA3AF":"#111",textDecoration:checked[item.id]?"line-through":"none" }}>
                      {item.name}
                      {item.amount && <span style={{ color:"#9CA3AF",fontWeight:400,marginLeft:6 }}>({item.amount} {item.unit})</span>}
                    </span>
                    {checked[item.id]
                      ? <button onClick={()=>{ if(extraItems.find(e=>e.id===item.id)) setExtraItems(p=>p.filter(i=>i.id!==item.id)); setChecked(p=>{const n={...p};delete n[item.id];return n}); }}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16 }}>🗑️</button>
                      : <button onClick={()=>setEditItem({...item})}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:16 }}>✏️</button>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {allItems.length===0 && (
        <div style={{ textAlign:"center",padding:"60px",color:"#9CA3AF" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>🛒</div>
          <p>Añade recetas al menú semanal para generar la lista automáticamente</p>
        </div>
      )}

      {/* Edit item modal */}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Editar ingrediente" width={400}>
        {editItem && (
          <>
            <div style={{ display:"flex",gap:8,marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>Cantidad</label>
                <input value={editItem.amount} onChange={e=>setEditItem(p=>({...p,amount:e.target.value}))}
                  style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>Unidad</label>
                <input value={editItem.unit} onChange={e=>setEditItem(p=>({...p,unit:e.target.value}))}
                  style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:4 }}>Nombre</label>
              <input value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))}
                style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setEditItem(null)} style={{ flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600 }}>Cancelar</button>
              <button onClick={()=>{
                setExtraItems(prev => {
                  const idx = prev.findIndex(i=>i.id===editItem.id);
                  if (idx>=0) { const next=[...prev]; next[idx]=editItem; return next; }
                  return prev;
                });
                setEditItem(null);
              }} style={{ flex:1,padding:"11px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700 }}>Guardar</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("recetas");
  const [recipes, setRecipes] = useState([]);
  const [weekMenu, setWeekMenu] = useState({});
  const [currentWeekOffset] = useState(0);

  function addRecipe(r) { setRecipes(prev => [r, ...prev]); }
  function deleteRecipe(id) { setRecipes(prev => prev.filter(r=>r.id!==id)); }
  function updateRecipe(r) { setRecipes(prev => prev.map(x=>x.id===r.id?r:x)); }

  const navItems = [
    { id:"recetas",    label:"Recetas",        icon:"📖" },
    { id:"menu",       label:"Menú Semanal",    icon:"📅" },
    { id:"compra",     label:"Lista de Compra", icon:"🛒" },
  ];

  return (
    <div style={{ display:"flex",height:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#F8F7F4" }}>
      {/* Sidebar */}
      <div style={{ width:220,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0 }}>
        <div style={{ padding:"20px 20px 16px",borderBottom:"1px solid #F3F4F6" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:40,height:40,background:"#FFF7ED",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🍳</div>
            <div>
              <div style={{ fontWeight:800,fontSize:14,color:"#111" }}>COCINA CASA</div>
              <div style={{ fontSize:11,color:"#9CA3AF" }}>Menú Semanal</div>
            </div>
          </div>
        </div>
        <nav style={{ padding:"12px 12px",flex:1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={()=>setPage(item.id)}
              style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",borderRadius:10,border:"none",background:page===item.id?"#F97316":"transparent",color:page===item.id?"#fff":"#374151",fontWeight:page===item.id?700:500,fontSize:14,cursor:"pointer",marginBottom:4,transition:"all .15s",textAlign:"left" }}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex:1,overflowY:"auto" }}>
        {page==="recetas" && (
          <RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe}
            weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset} />
        )}
        {page==="menu" && (
          <WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} setWeekMenu={setWeekMenu} />
        )}
        {page==="compra" && (
          <ShoppingListPage weekMenu={weekMenu} recipes={recipes} />
        )}
      </div>
    </div>
  );
}
