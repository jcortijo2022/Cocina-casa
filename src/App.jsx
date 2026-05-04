import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qqgrdvtdstmqlhlpthxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ3JkdnRkc3RtcWxobHB0aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjgyNzgsImV4cCI6MjA5MTM0NDI3OH0.5RCzKw6yM6w62T7UPrkdyWC8RILzvITubt8D6rXyASM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MEAL_TYPES = ["Comida","Cena","Fin de Semana","Postre","Entrante","Verano","Salsas","Otros"];
const RECIPE_TYPES = ["Carne","Guisos","Pescados","Arroz y Pasta","Verdura","Otros platos"];
const DAYS = ["Sabado","Domingo","Lunes","Martes","Miercoles","Jueves","Viernes"];
const MEAL_SLOTS = ["Comida","Cena"];
const MEAL_TYPE_COLORS = {
  "Comida":{"bg":"#F97316","text":"#fff"},
  "Cena":{"bg":"#6366F1","text":"#fff"},
  "Fin de Semana":{"bg":"#10B981","text":"#fff"},
  "Postre":{"bg":"#EC4899","text":"#fff"},
  "Entrante":{"bg":"#8B5CF6","text":"#fff"},
  "Verano":{"bg":"#0EA5E9","text":"#fff"},
  "Salsas":{"bg":"#EF4444","text":"#fff"},
  "Otros":{"bg":"#6B7280","text":"#fff"},
};
const SHOPPING_CATS = [
  {id:"carnes",label:"Carnes",emoji:"🥩"},
  {id:"fiambres",label:"Fiambres y Embutidos",emoji:"🥓"},
  {id:"pescados",label:"Pescados y Mariscos",emoji:"🐟"},
  {id:"congelados",label:"Congelados",emoji:"🧊"},
  {id:"verduras",label:"Verduras y Hortalizas",emoji:"🥦"},
  {id:"frutas",label:"Frutas",emoji:"🍎"},
  {id:"lacteos",label:"Lacteos y Huevos",emoji:"🥚"},
  {id:"cereales",label:"Cereales y Legumbres",emoji:"🌾"},
  {id:"conservas",label:"Conservas y Salsas",emoji:"🥫"},
  {id:"especias",label:"Especias y Condimentos",emoji:"🧂"},
  {id:"limpieza",label:"Limpieza y Bano",emoji:"🧹"},
  {id:"otros",label:"Otros",emoji:"🛒"},
];
const S={
  input:{display:"block",width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff",color:"#111"},
  sel:{padding:"6px 12px",borderRadius:20,border:"2px solid #E5E7EB",background:"#fff",color:"#111",fontWeight:600,fontSize:12,cursor:"pointer"},
};

function getWeekKey(off=0){
  const n=new Date();
  const day=n.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diffToSat=(day===6)?0:(day===0)?-1:-(day+1);
  const sat=new Date();
  sat.setDate(n.getDate()+diffToSat+off*7);
  sat.setHours(0,0,0,0);
  return sat.toISOString().split("T")[0];
}
function getWeekDates(off=0){
  const n=new Date();
  const day=n.getDay();
  const diffToSat=(day===6)?0:(day===0)?-1:-(day+1);
  const sat=new Date();
  sat.setDate(n.getDate()+diffToSat+off*7);
  sat.setHours(0,0,0,0);
  const fri=new Date(sat);
  fri.setDate(sat.getDate()+6);
  const f=x=>x.toLocaleDateString("es-ES",{day:"numeric",month:"short"});
  return f(sat)+" - "+f(fri);
}

function normalizeIngKey(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  if(/aceite/.test(n))return"aceite";
  if(/\barroz\b/.test(n))return"arroz";
  if(/\bcaldo\b/.test(n))return"caldo";
  if(/\bceboll/.test(n))return"cebolla";
  if(/\btomate\b/.test(n)&&!/frito|triturado|concentrado|salsa/.test(n))return"tomate";
  if(/\baj[oa]s?\b/.test(n))return"ajo";
  if(n==="sal"||/^sal\s/.test(n)||/\bsal\s*(gorda|fina|marina|comun)?$/.test(n))return"sal";
  if(/\bazucar\b/.test(n))return"azucar";
  if(/\bhuevo/.test(n))return"huevo";
  if(/\bleche\b/.test(n))return"leche";
  if(/\bharina\b/.test(n))return"harina";
  if(/\bpimiento\b/.test(n))return"pimiento";
  if(/\bpatata/.test(n))return"patata";
  if(/\bzanahoria/.test(n))return"zanahoria";
  if(/\bqueso\b/.test(n))return"queso";
  if(/\bmantequilla\b/.test(n))return"mantequilla";
  if(/espagueti|macarron|tallar|lasana|\bfideo/.test(n))return"pasta";
  if(/\bpan\b/.test(n)&&!/pan(ceta|ado)/.test(n))return"pan";
  if(/\bchocolate\b/.test(n))return"chocolate";
  if(/\bvinagre\b/.test(n))return"vinagre";
  if(/\bpimienta\b/.test(n))return"pimienta";
  return n;
}

function guessCategory(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  // Sal y azucar -> especias
  if(n==="sal"||/^sal\s/.test(n)||n==="azucar"||/^azucar\b/.test(n))return"especias";
  // Caldo -> conservas
  if(/\bcaldo\b/.test(n))return"conservas";
  // Limpieza y bano
  if(/jabon|champu|gel de ducha|pasta de dientes|cepillo de dientes|cepillo oidos|compresas|salvaslip|desodorante|papel (del )?water|papel higienico|lejia|suavizante|lavaplatos|lavavajillas|limpiacristales|detergente|estropajo|\bmopa\b|fregona|\bcubo\b|escoba|recogedor|limpiamopas|limpiamuebles|bayeta|papel cocina|bolsas basura/.test(n))return"limpieza";
  // Congelados
  if(/croqueta|empanadilla|gyoza|tortilla de camaron|\bpizza\b|helado|tempura|nuggets|bastones de pescado|guisantes congelados|espinacas congeladas|verduras congeladas|patatas fritas congeladas|precocinado/.test(n))return"congelados";
  // Fiambres
  if(/jamon (york|cocido|dulce|serrano|iberico)|salchichon|fuet|mortadela|chopped|pavo fiambre|pechuga (pavo|pollo) (fiambre|cocida)|fiambre|embutido|sobrasada|lomo embuchado|cecina|salami|pepperoni/.test(n))return"fiambres";
  // Carnes
  if(/\bpollo\b|\bcarne\b|\bcerdo\b|ternera|\bjamon\b|chorizo|morcilla|panceta|costill|buey|cordero|\bpavo\b|\bpato\b|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|\blomo\b|solomillo|codillo|carrillada|chuleta|albondiga|hamburguesa|tocino|papada|lacon/.test(n))return"carnes";
  // Pescados
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja|pulpo|lenguado|trucha|anchoa|caballa/.test(n))return"pescados";
  // Verduras
  if(/tomate|cebolla|\baj[oa]|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|\bapio\b|pepino|brocoli|coliflor|alcachofa|judia verde|judias verdes|acelga|champin|champinon|seta|portobello|calabaza|esparrago|guisante|haba|boniato|batata|\bcol\b|repollo|kale|canonigo|rucola|endivia|cebolleta|cebollino|maiz dulce|verdura|hortaliza|nabo|chiriva/.test(n))return"verduras";
  // Frutas
  if(/manzana|naranja|limon|platano|fresa|\buva\b|\bpera\b|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|\bpina\b|fruta|frambuesa|mora|arandano|granada|higo|ciruela|pomelo|mandarina|lima|coco|aguacate|fruto seco|almendra|nuez|pistacho|anacardo|avellana|cacahuete/.test(n))return"frutas";
  // Lacteos
  if(/\bleche\b|queso|yogur|\bnata\b|mantequilla|huevo|crema (de leche|agria)|requeson|mozzarella|parmesano|ricotta|mascarpone|manchego|brie|feta/.test(n))return"lacteos";
  // Cereales y legumbres
  if(/\barroz\b|espagueti|macarron|tallar|lasana|tortellini|ravioli|canelone|\bfideo|\bpasta\b|cuscus|bulgur|avena|\btrigo\b|quinoa|garbanzo|lenteja|alubia|judia blanca|judia pinta|\bharina\b|\bpan\b/.test(n))return"cereales";
  // Conservas y salsas
  if(/tomate frito|salsa (de tomate|bechamel|carbonara|bolonesa|pesto)|conserva|lata de|bote de|aceitunas|alcaparra|pepinillo|concentrado|sofrito|pisto/.test(n))return"conservas";
  // Especias y condimentos
  if(/pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|\baceite\b|vinagre|canela|nuez moscada|clavo|especias|condimento|mostaza|ketchup|mayonesa|\bsoja\b|tabasco|curcuma|jengibre|cayena|guindilla|paprika|anis|hierbas|aliño|perejil|albahaca|cilantro|eneldo|estragón|mejorana|menta|hierbabuena/.test(n))return"especias";
  return"otros";
}

function cap(s){if(!s)return s;return s.charAt(0).toUpperCase()+s.slice(1);}

function StarRating({value,onChange,size=18}){
  return(<div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=>(<span key={i} onClick={()=>onChange(value===i?0:i)} style={{cursor:"pointer",fontSize:size,color:i<=value?"#F59E0B":"#D1D5DB",userSelect:"none"}}>★</span>))}</div>);
}

function Modal({open,onClose,children,title,width=520}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:1,background:"#fff",borderRadius:20,width:"min("+width+"px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.2)",padding:"24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <h2 style={{margin:0,fontSize:19,fontWeight:700,color:"#111"}}>{title}</h2>
          <button onClick={onClose} style={{border:"none",background:"#F3F4F6",borderRadius:50,width:30,height:30,cursor:"pointer",fontSize:17,color:"#555",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApiKeyModal({open,onClose,apiKey,setApiKey}){
  const [val,setVal]=useState(apiKey);
  useEffect(()=>{if(open)setVal(apiKey);},[open,apiKey]);
  return(
    <Modal open={open} onClose={onClose} title="Configuracion API" width={440}>
      <p style={{color:"#6B7280",fontSize:13,marginBottom:6}}>API Key de Anthropic para importar recetas con IA.</p>
      <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginBottom:14,color:"#F97316",fontSize:13,fontWeight:600}}>Obtener en console.anthropic.com</a>
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="sk-ant-..." type="password" style={{...S.input,marginBottom:8,fontFamily:"monospace"}}/>
      <p style={{color:"#9CA3AF",fontSize:11,marginBottom:16}}>Se guarda solo en tu navegador.</p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:"10px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button>
        <button onClick={()=>{const k=val.trim();setApiKey(k);localStorage.setItem("cocina_api_key",k);onClose();}} style={{flex:1,padding:"10px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Guardar</button>
      </div>
    </Modal>
  );
}

function AddRecipeModal({open,onClose,onAdd,apiKey,onNeedKey}){
  const [tab,setTab]=useState("buscar");
  const [url,setUrl]=useState("");
  const [text,setText]=useState("");
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const fileRef=useRef();

  const TABS=[{id:"buscar",label:"🔍 Buscar"},{id:"enlace",label:"🔗 Enlace"},{id:"video",label:"🎥 Video"},{id:"foto",label:"📷 Foto"},{id:"texto",label:"📝 Texto"}];
      useEffect(()=>{setUrl("");setQuery("");setText("");setError("");},[tab]);
      useEffect(()=>{setUrl("");setQuery("");setText("");setError("");},[tab]);

  async function callAPI(prompt,imgData=null){
    if(!apiKey){onNeedKey();return null;}
    const msgs=imgData?[{role:"user",content:[{type:"image",source:{type:"base64",media_type:imgData.type,data:imgData.data}},{type:"text",text:prompt}]}]:[{role:"user",content:prompt}];
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2000,system:"Eres chef experto. Devuelve SOLO JSON valido sin texto adicional.",messages:msgs})});
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||"HTTP "+r.status);}
    const d=await r.json();
    const t=d.content?.[0]?.text||"";
    const m=t.match(/\{[\s\S]*\}/);
    if(!m)throw new Error("Sin JSON en respuesta");
    return JSON.parse(m[0]);
  }

  async function callServerless(payload){
    if(!apiKey){onNeedKey();return null;}
    const r=await fetch("/api/import-recipe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,apiKey})});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Error servidor");
    return d;
  }

  function makeRecipe(data,photoUrl=null){
    return{id:Date.now(),title:data.title||"Receta",description:data.description||"",image:data.image&&data.image!=="FOTO_SUBIDA"?data.image:(photoUrl||""),mealType:MEAL_TYPES.includes(data.mealType)?data.mealType:"Comida",recipeType:RECIPE_TYPES.includes(data.recipeType)?data.recipeType:"Otros platos",ingredients:(data.ingredients||[]).map((ing,i)=>({id:Date.now()+i,amount:String(ing.amount||""),unit:String(ing.unit||""),name:cap(String(ing.name||""))})),steps:Array.isArray(data.steps)?data.steps:(data.steps||"").split("\n").filter(s=>s.trim()),sourceUrl:data.sourceUrl||"",time:data.time||"",servings:Number(data.servings)||4,rating:0};
  }

  async function doImport(){
    setLoading(true);setError("");
    try{
      let data;
      if(tab==="enlace"||tab==="video"){
        if(!url.trim()){setError("Introduce una URL");setLoading(false);return;}
        data=await callServerless({url});
      }else if(tab==="buscar"){
        if(!query.trim()){setError("Escribe un plato");setLoading(false);return;}
        data=await callServerless({search:query});
      }else if(tab==="texto"){
        if(!text.trim()){setError("Pega el texto");setLoading(false);return;}
        const TPL='{"title":"","description":"","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"","unit":"","name":""}],"steps":[""],"sourceUrl":"","time":"","servings":4}';
        data=await callAPI("Extrae la receta de este texto. JSON: "+TPL+" TEXTO: "+text);
      }
      if(data){onAdd(makeRecipe(data));onClose();}
    }catch(e){setError("Error: "+e.message);}
    setLoading(false);
  }

  function handlePhoto(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async()=>{
      setLoading(true);setError("");
      try{
        const b64=reader.result.split(",")[1];
        const TPL='{"title":"","description":"","image":"FOTO_SUBIDA","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"","unit":"","name":""}],"steps":[""],"sourceUrl":"","time":"","servings":4}';
        const data=await callAPI("Analiza esta imagen de receta. JSON: "+TPL,{type:file.type,data:b64});
        if(data){onAdd(makeRecipe(data,reader.result));onClose();}
      }catch(e){setError("Error: "+e.message);}
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  return(
    <Modal open={open} onClose={onClose} title="Añadir Receta" width={500}>
      <div style={{display:"flex",gap:5,marginBottom:18,flexWrap:"wrap"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setError("");}} style={{padding:"6px 12px",borderRadius:20,border:"2px solid "+(tab===t.id?"#F97316":"#E5E7EB"),background:tab===t.id?"#FFF7ED":"#fff",color:tab===t.id?"#F97316":"#111",fontWeight:600,cursor:"pointer",fontSize:12}}>{t.label}</button>)}
      </div>
      {tab==="foto"&&(<div><p style={{color:"#6B7280",fontSize:13,marginBottom:10}}>Sube una foto y la IA extraera la receta con esa foto.</p><input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/><button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"36px",border:"2px dashed #E5E7EB",borderRadius:12,background:"#fff",cursor:"pointer",color:"#9CA3AF",fontSize:14}}>📸 Seleccionar imagen</button></div>)}
      {(tab==="enlace"||tab==="video")&&(<div><p style={{color:"#6B7280",fontSize:13,marginBottom:8}}>Pega el enlace y la IA importara la receta real.</p><input value={url} onChange={e=>{setUrl(e.target.value);setError("");}} placeholder="https://ejemplo.com/receta..." style={{...S.input}} onKeyDown={e=>e.key==="Enter"&&doImport()}/></div>)}
      {tab==="buscar"&&(<div><p style={{color:"#6B7280",fontSize:13,marginBottom:8}}>Escribe el nombre del plato.</p><input value={query} onChange={e=>{setQuery(e.target.value);setError("");}} placeholder="Ej: Paella valenciana..." style={{...S.input}} onKeyDown={e=>e.key==="Enter"&&doImport()}/></div>)}
      {tab==="texto"&&(<div><p style={{color:"#6B7280",fontSize:13,marginBottom:8}}>Pega el texto de la receta.</p><textarea value={text} onChange={e=>{setText(e.target.value);setError("");}} rows={6} style={{...S.input,resize:"vertical",fontFamily:"inherit"}}/></div>)}
      {!apiKey&&<div style={{marginTop:10,padding:"9px 12px",background:"#FFFBEB",borderRadius:8,color:"#92400E",fontSize:12,border:"1px solid #FCD34D"}}>Configura la API Key. <button onClick={onNeedKey} style={{background:"none",border:"none",color:"#F97316",fontWeight:700,cursor:"pointer",fontSize:12}}>Configurar</button></div>}
      {error&&<div style={{marginTop:10,padding:"9px 12px",background:"#FEF2F2",borderRadius:8,color:"#DC2626",fontSize:12,border:"1px solid #FCA5A5"}}>{error}</div>}
      {tab!=="foto"&&<button disabled={loading} onClick={doImport} style={{marginTop:14,width:"100%",padding:"13px",background:loading?"#FED7AA":"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer"}}>{loading?"Importando...":"Importar Receta"}</button>}
    </Modal>
  );
}

function EditIngModal({open,onClose,ingredients,onSave}){
  const [local,setLocal]=useState([]);
  useEffect(()=>{if(open)setLocal(ingredients.map(i=>({...i})));},[open,ingredients]);
  function upd(id,f,v){setLocal(p=>p.map(i=>i.id===id?{...i,[f]:v}:i));}
  return(
    <Modal open={open} onClose={onClose} title="Editar Ingredientes" width={580}>
      <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:"52vh",overflowY:"auto"}}>
        {local.map(ing=>(<div key={ing.id} style={{display:"flex",gap:7,alignItems:"center"}}>
          <input value={ing.amount} onChange={e=>upd(ing.id,"amount",e.target.value)} style={{width:65,padding:"8px 9px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:12,background:"#fff",color:"#111"}} placeholder="Cant."/>
          <input value={ing.unit} onChange={e=>upd(ing.id,"unit",e.target.value)} style={{width:85,padding:"8px 9px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:12,background:"#fff",color:"#111"}} placeholder="Unidad"/>
          <input value={ing.name} onChange={e=>upd(ing.id,"name",e.target.value)} style={{flex:1,padding:"8px 9px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:12,background:"#fff",color:"#111"}} placeholder="Ingrediente"/>
          <button onClick={()=>setLocal(p=>p.filter(i=>i.id!==ing.id))} style={{padding:"6px 9px",background:"#FEE2E2",border:"none",borderRadius:8,cursor:"pointer",color:"#EF4444"}}>🗑</button>
        </div>))}
      </div>
      <button onClick={()=>setLocal(p=>[...p,{id:Date.now(),amount:"",unit:"",name:""}])} style={{marginTop:10,padding:"8px 14px",background:"#F3F4F6",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,color:"#374151",fontSize:12}}>+ Anadir linea</button>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <button onClick={onClose} style={{padding:"9px 18px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button>
        <button onClick={()=>{onSave(local.filter(i=>i.name.trim()));onClose();}} style={{padding:"9px 18px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Guardar</button>
      </div>
    </Modal>
  );
}

function AddToMenuModal({open,onClose,recipe,saveMenu,weekMenu,weekOffset,onUseRecipe,onClearDeleted}){
  const [day,setDay]=useState("Lunes");
  const [slot,setSlot]=useState("Comida");
  function add(){
    const key=getWeekKey(weekOffset);
    const newMenu=JSON.parse(JSON.stringify(weekMenu));
    if(!newMenu[key])newMenu[key]={};
    if(!newMenu[key][day])newMenu[key][day]={};
    if(!newMenu[key][day][slot])newMenu[key][day][slot]=[];
    if(!newMenu[key][day][slot].find(r=>r.id===recipe.id))newMenu[key][day][slot].push(recipe);
    saveMenu(newMenu);
    // Clear deleted ingredients for this recipe this week
    if(onClearDeleted)onClearDeleted(recipe,key);
    onClose();
  }
  return(
    <Modal open={open} onClose={onClose} title="Anadir al Menu Semanal" width={380}>
      <div style={{marginBottom:12}}><label style={{fontWeight:600,fontSize:12,color:"#374151",display:"block",marginBottom:5}}>Dia</label><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{DAYS.map(d=>(<button key={d} onClick={()=>setDay(d)} style={{padding:"6px 12px",borderRadius:20,border:"2px solid "+(day===d?"#F97316":"#E5E7EB"),background:day===d?"#FFF7ED":"#fff",color:day===d?"#F97316":"#111",fontWeight:600,cursor:"pointer",fontSize:11}}>{d}</button>))}</div></div>
      <div style={{marginBottom:18}}><label style={{fontWeight:600,fontSize:12,color:"#374151",display:"block",marginBottom:5}}>Momento</label><div style={{display:"flex",gap:8}}>{MEAL_SLOTS.map(s=>(<button key={s} onClick={()=>setSlot(s)} style={{flex:1,padding:"9px",borderRadius:10,border:"2px solid "+(slot===s?"#F97316":"#E5E7EB"),background:slot===s?"#FFF7ED":"#fff",color:slot===s?"#F97316":"#111",fontWeight:600,cursor:"pointer"}}>{s}</button>))}</div></div>
      <div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:"10px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button><button onClick={add} style={{flex:1,padding:"10px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Anadir</button></div>
    </Modal>
  );
}

function CopyWeekModal({open,onClose,weekMenu,weekOffset,saveMenu}){
  const [sel,setSel]=useState(null);
  const offs=[-4,-3,-2,-1,0,1,2,3,4].filter(o=>o!==weekOffset);
  function copy(){if(sel===null)return;const srcKey=getWeekKey(weekOffset);const dstKey=getWeekKey(sel);const nm={...weekMenu,[dstKey]:JSON.parse(JSON.stringify(weekMenu[srcKey]||{}))};saveMenu(nm);onClose();}
  return(
    <Modal open={open} onClose={onClose} title="Copiar menu a otra semana" width={360}>
      <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:"52vh",overflowY:"auto",marginBottom:16}}>
        {offs.map(o=>{const key=getWeekKey(o);const has=weekMenu[key]&&Object.keys(weekMenu[key]).length>0;const isSel=sel===o;return(<button key={o} onClick={()=>setSel(o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:11,border:"2px solid "+(isSel?"#F97316":"#E5E7EB"),background:isSel?"#FFF7ED":"#fff",cursor:"pointer",textAlign:"left"}}><span style={{fontWeight:600,color:isSel?"#F97316":"#111",fontSize:13}}>{getWeekDates(o)}</span>{has&&<span style={{fontSize:11,color:"#9CA3AF"}}>tiene menu</span>}</button>);})}
      </div>
      <div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:"10px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button><button onClick={copy} disabled={sel===null} style={{flex:1,padding:"10px",background:sel===null?"#FED7AA":"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:sel===null?"not-allowed":"pointer",fontWeight:700}}>Copiar</button></div>
    </Modal>
  );
}

function RecipeImageSection({recipe,onUpdate}){
  const fileRef=useRef();
  const [imgError,setImgError]=useState(false);
  function handleUpload(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{onUpdate({...recipe,image:r.result});setImgError(false);};r.readAsDataURL(file);}
  const hasValidImg=recipe.image&&!imgError;
  if(hasValidImg){return(<div style={{borderRadius:14,overflow:"hidden",marginBottom:14,height:260,position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current.click()}><img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgError(true)}/><div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.5)",borderRadius:7,padding:"5px 9px",color:"#fff",fontSize:11}}>📷 Cambiar</div><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);}
  return(<div style={{borderRadius:14,marginBottom:14,height:140,background:"#F9FAFB",border:"2px dashed #E5E7EB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:6}} onClick={()=>fileRef.current.click()}><span style={{fontSize:36}}>📷</span><span style={{color:"#9CA3AF",fontSize:13}}>Añadir foto</span><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);
}

function CardImageUpload({recipe,onUpdate}){
  const fileRef=useRef();
  function handleUpload(e){e.stopPropagation();const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>onUpdate({...recipe,image:r.result});r.readAsDataURL(file);}
  return(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,color:"#C4C4C4",background:"#F9FAFB",cursor:"pointer"}} onClick={e=>{e.stopPropagation();fileRef.current.click();}}><span style={{fontSize:28}}>📷</span><span style={{fontSize:10,fontWeight:500}}>Añadir foto</span><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);
}

function RecipeCard({recipe,onOpen,onDelete,onAddMenu,onUpdate,getUseCount}){
  const [menuOpen,setMenuOpen]=useState(false);
  const col=MEAL_TYPE_COLORS[recipe.mealType]||MEAL_TYPE_COLORS["Otros"];
  return(
    <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.07)",cursor:"pointer",position:"relative",transition:"transform .15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
      <div style={{position:"relative",height:165,background:"#F3F4F6",overflow:"hidden"}} onClick={()=>onOpen(recipe)}>
        {recipe.image?<img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<CardImageUpload recipe={recipe} onUpdate={onUpdate}/>}
        <span style={{position:"absolute",top:8,left:8,padding:"3px 9px",borderRadius:18,background:col.bg,color:col.text,fontWeight:700,fontSize:10}}>{recipe.mealType}</span>
        <div style={{position:"absolute",top:6,right:6}}>
          <button onClick={e=>{e.stopPropagation();setMenuOpen(v=>!v);}} style={{width:28,height:28,borderRadius:50,background:"rgba(255,255,255,.95)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 6px rgba(0,0,0,.25)",color:"#111",fontWeight:900,fontSize:18}}>⋮</button>
          {menuOpen&&(<div style={{position:"absolute",right:0,top:32,background:"#fff",borderRadius:11,boxShadow:"0 8px 28px rgba(0,0,0,.14)",minWidth:170,zIndex:10,overflow:"hidden"}} onMouseLeave={()=>setMenuOpen(false)}>
            <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onAddMenu(recipe);}} style={{display:"flex",alignItems:"center",gap:7,padding:"11px 14px",background:"none",border:"none",cursor:"pointer",width:"100%",fontSize:12,fontWeight:600,color:"#374151",textAlign:"left"}}>📅 Añadir al menu semanal</button>
            <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onDelete(recipe.id);}} style={{display:"flex",alignItems:"center",gap:7,padding:"11px 14px",background:"none",border:"none",cursor:"pointer",width:"100%",fontSize:12,fontWeight:600,color:"#EF4444",textAlign:"left"}}>🗑️ Eliminar receta</button>
          </div>)}
        </div>
      </div>
      <div style={{padding:"11px 11px 9px"}} onClick={()=>onOpen(recipe)}>
        <h3 style={{margin:"0 0 4px",fontSize:13,fontWeight:700,color:"#111",lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{recipe.title}</h3>
        <p style={{margin:"0 0 8px",fontSize:11,color:"#6B7280",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{recipe.description}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:8,fontSize:10,color:"#9CA3AF"}}>{recipe.time&&<span>⏱ {recipe.time}</span>}<span>👥 {recipe.servings}p</span>{(getUseCount?getUseCount(recipe.id):recipe.useCount||0)>0&&<span style={{color:"#F97316",fontWeight:700}}>×{getUseCount?getUseCount(recipe.id):recipe.useCount||0}</span>}</div>
          <StarRating value={recipe.rating} onChange={()=>{}} size={12}/>
        </div>
      </div>
    </div>
  );
}

function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,onUseRecipe,onClearDeleted}){
  const [editIngOpen,setEditIngOpen]=useState(false);
  const [addMenuOpen,setAddMenuOpen]=useState(false);
  const scrollRef=useRef();
  useEffect(()=>{document.getElementById("main-scroll")?.scrollTo({top:0,behavior:"instant"});},[recipe?.id]);
  const col=MEAL_TYPE_COLORS[recipe.mealType]||MEAL_TYPE_COLORS["Otros"];
  const [editingTitle,setEditingTitle]=useState(false);
  const [titleVal,setTitleVal]=useState(recipe.title);
  useEffect(()=>{setTitleVal(recipe.title);},[recipe.title]);
  function upd(f,v){onUpdate({...recipe,[f]:v});}
  const steps=Array.isArray(recipe.steps)?recipe.steps:(recipe.steps||"").split("\n").filter(s=>s.trim());
  return(
    <div ref={scrollRef} style={{maxWidth:700,margin:"0 auto",padding:"18px 18px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontWeight:600,color:"#374151",fontSize:14}}>← Volver</button>
        <button onClick={()=>onDelete(recipe.id)} style={{background:"#FEE2E2",border:"none",borderRadius:9,padding:"9px 12px",cursor:"pointer",color:"#EF4444",fontSize:17}}>🗑️</button>
      </div>
      <RecipeImageSection recipe={recipe} onUpdate={onUpdate}/>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:11}}>
        <select value={recipe.mealType} onChange={e=>upd("mealType",e.target.value)} style={{...S.sel,border:"2px solid "+col.bg,background:col.bg,color:col.text}}>{MEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        <select value={recipe.recipeType} onChange={e=>upd("recipeType",e.target.value)} style={S.sel}>{RECIPE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
      </div>
      {editingTitle?(
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <input value={titleVal} onChange={e=>setTitleVal(e.target.value)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"2px solid #F97316",fontSize:18,fontWeight:800,color:"#111",outline:"none"}} autoFocus onKeyDown={e=>{if(e.key==="Enter"){upd("title",titleVal);setEditingTitle(false);}if(e.key==="Escape")setEditingTitle(false);}}/>
          <button onClick={()=>{upd("title",titleVal);setEditingTitle(false);}} style={{padding:"8px 14px",background:"#F97316",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700}}>✓</button>
          <button onClick={()=>setEditingTitle(false)} style={{padding:"8px 12px",background:"#F3F4F6",border:"none",borderRadius:9,cursor:"pointer",color:"#111"}}>✕</button>
        </div>
      ):(
        <h1 onClick={()=>setEditingTitle(true)} style={{fontSize:22,fontWeight:800,color:"#111",marginBottom:6,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          {recipe.title}<span style={{fontSize:14,color:"#C4C4C4",fontWeight:400}}>✏️</span>
        </h1>
      )}
      <p style={{fontSize:13,color:"#6B7280",marginBottom:12,lineHeight:1.6,textAlign:"left"}}>{recipe.description}</p>
      <div style={{display:"flex",gap:16,marginBottom:12,fontSize:13,color:"#6B7280"}}>{recipe.time&&<span>⏱ {recipe.time}</span>}<span>👥 {recipe.servings} porciones</span></div>
      {recipe.sourceUrl&&<div style={{textAlign:"left",marginBottom:14}}><a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,color:"#F97316",fontWeight:600,fontSize:13,textDecoration:"none"}}>🔗 Ver fuente original</a></div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px",background:"#FFF7ED",borderRadius:13,marginBottom:20}}>
        <button onClick={()=>setAddMenuOpen(true)} style={{padding:"9px 18px",background:"#F97316",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:12,cursor:"pointer"}}>📅 Añadir al menu semanal</button>
        <div style={{textAlign:"right"}}><p style={{margin:"0 0 3px",fontSize:11,color:"#9CA3AF",fontWeight:600}}>Tu valoracion</p><StarRating value={recipe.rating} onChange={v=>upd("rating",v)} size={20}/></div>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <h2 style={{margin:0,fontSize:16,fontWeight:700,color:"#111"}}>Ingredientes</h2>
          <button onClick={()=>setEditIngOpen(true)} style={{padding:"7px 14px",background:"#F3F4F6",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12,color:"#111"}}>✏️ Editar</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {recipe.ingredients.map(ing=>(<div key={ing.id} style={{display:"flex",gap:10,padding:"9px 12px",background:"#F9FAFB",borderRadius:9,fontSize:13,textAlign:"left"}}>
            <span style={{fontWeight:700,color:"#F97316",minWidth:45}}>{ing.amount}</span>
            <span style={{color:"#9CA3AF",minWidth:70}}>{ing.unit}</span>
            <span style={{color:"#374151"}}>{ing.name}</span>
          </div>))}
        </div>
      </div>
      {steps.length>0&&(<div>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#111",textAlign:"left"}}>Preparacion</h2>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {steps.map((step,i)=>(<div key={i} style={{display:"flex",gap:10,padding:"11px 12px",background:"#F9FAFB",borderRadius:9,textAlign:"left"}}>
            <span style={{fontWeight:800,color:"#F97316",fontSize:15,minWidth:22,flexShrink:0}}>{i+1}.</span>
            <span style={{fontSize:13,color:"#374151",lineHeight:1.7}}>{step}</span>
          </div>))}
        </div>
      </div>)}
      <EditIngModal open={editIngOpen} onClose={()=>setEditIngOpen(false)} ingredients={recipe.ingredients} onSave={ings=>onUpdate({...recipe,ingredients:ings})}/>
      <AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)} recipe={recipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>
    </div>
  );
}

function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile,onUseRecipe,getUseCount,onClearDeleted}){
  const [addOpen,setAddOpen]=useState(false);
  const [addMenuRecipe,setAddMenuRecipe]=useState(null);
  const [search,setSearch]=useState("");
  const [filterMeal,setFilterMeal]=useState("Todas");
  const [filterType,setFilterType]=useState("Todos los tipos");

  const detail=detailId?recipes.find(r=>String(r.id)===String(detailId))||null:null;
  if(detail){return<RecipeDetail recipe={detail} onBack={()=>setDetailId(null)} onDelete={id=>{onDelete(id);setDetailId(null);}} onUpdate={onUpdate} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>;}

  const filtered=recipes.filter(r=>r.title.toLowerCase().includes(search.toLowerCase())&&(filterMeal==="Todas"||r.mealType===filterMeal)&&(filterType==="Todos los tipos"||r.recipeType===filterType));

  return(
    <div style={{padding:"18px 16px"}}>
      <div style={{marginBottom:12}}>
        <h1 style={{margin:"0 0 3px",fontSize:24,fontWeight:800,color:"#111"}}>Nuestras Recetas</h1>
        <p style={{margin:"0 0 10px",color:"#9CA3AF",fontSize:12}}>{recipes.length} recetas guardadas</p>
        <button onClick={()=>setAddOpen(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",background:"#F97316",color:"#fff",border:"none",borderRadius:11,fontWeight:700,fontSize:13,cursor:"pointer",width:"100%",marginBottom:8}}>+ Añadir Receta</button>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar recetas..." style={{...S.input,marginBottom:8}}/>
        <div style={{display:"flex",gap:8}}>
          <select value={filterMeal} onChange={e=>setFilterMeal(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:12,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todas">Todas</option>{MEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:12,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todos los tipos">Todos los tipos</option>{RECIPE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,paddingBottom:80}}>
        {filtered.map(r=><RecipeCard key={r.id} recipe={r} onOpen={rec=>setDetailId(String(rec.id))} onDelete={onDelete} onAddMenu={setAddMenuRecipe} onUpdate={onUpdate}/>)}
        {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"50px",color:"#9CA3AF"}}><div style={{fontSize:44,marginBottom:10}}>🍽️</div><p>No hay recetas. Anade la primera!</p></div>}
      </div>
      <AddRecipeModal open={addOpen} onClose={()=>setAddOpen(false)} onAdd={r=>{onAdd(r);setAddOpen(false);}} apiKey={apiKey} onNeedKey={()=>{setAddOpen(false);onNeedKey();}}/>
      {addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>}
    </div>
  );
}

function WeeklyMenuPage({recipes,weekMenu,saveMenu,onUseRecipe,onClearDeleted}){
  const [weekOffset,setWeekOffset]=useState(0);
  const [copyOpen,setCopyOpen]=useState(false);
  const [pickerOpen,setPickerOpen]=useState(false);
  const [pickerTarget,setPickerTarget]=useState(null);
  const [pickerSearch,setPickerSearch]=useState("");
  const key=getWeekKey(weekOffset);
  const menu=weekMenu[key]||{};

  function removeFromMenu(day,slot,id){
    const nm=JSON.parse(JSON.stringify(weekMenu));
    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}
    saveMenu(nm);
    // If recipe no longer in menu this week, clear its deleted ingredients
    const stillInMenu=Object.values(nm[key]||{}).some(slots=>Object.values(slots).some(rs=>rs.some(r=>String(r.id)===String(id))));
    if(!stillInMenu){
      const recipe=recipes.find(r=>String(r.id)===String(id));
      if(recipe&&onClearDeleted)onClearDeleted(recipe,key);
    }
  }

  function addToMenu(recipe){
    if(!pickerTarget)return;
    const{day,slot}=pickerTarget;
    const nm=JSON.parse(JSON.stringify(weekMenu));
    if(!nm[key])nm[key]={};if(!nm[key][day])nm[key][day]={};if(!nm[key][day][slot])nm[key][day][slot]=[];
    if(!nm[key][day][slot].find(r=>r.id===recipe.id))nm[key][day][slot].push(recipe);
    saveMenu(nm);
    setPickerOpen(false);setPickerTarget(null);
  }

  function handleDrop(e,toDay,toSlot,touchData=null){
    if(e)e.preventDefault();
    try{
      const{recipe:r,fromDay,fromSlot}=touchData||JSON.parse(e.dataTransfer.getData("recipe"));
      if(fromDay===toDay&&fromSlot===toSlot)return;
      const nm=JSON.parse(JSON.stringify(weekMenu));
      if(!nm[key])nm[key]={};
      nm[key][fromDay]=nm[key][fromDay]||{};nm[key][fromDay][fromSlot]=(nm[key][fromDay][fromSlot]||[]).filter(x=>x.id!==r.id);
      nm[key][toDay]=nm[key][toDay]||{};nm[key][toDay][toSlot]=nm[key][toDay][toSlot]||[];
      if(!nm[key][toDay][toSlot].find(x=>x.id===r.id))nm[key][toDay][toSlot].push(r);
      saveMenu(nm);
    }catch(e){}
  }

  function clearDeleted(){setDeletedByWeek(p=>{const n={...p};delete n[key];supabase.from('shopping_deleted').delete().eq('week_key',key).then(()=>{});return n;});}

  function buildWA(){let t="Menu Semanal - "+getWeekDates(weekOffset)+"\n\n";DAYS.forEach(day=>{const slots=menu[day];if(!slots)return;t+=day+"\n";MEAL_SLOTS.forEach(slot=>{const items=slots[slot];if(items&&items.length)t+="  "+slot+": "+items.map(r=>r.title).join(", ")+"\n";});t+="\n";});window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank");}

  const fp=recipes.filter(r=>r.title.toLowerCase().includes(pickerSearch.toLowerCase()));

  return(
    <div style={{padding:"18px 16px",paddingBottom:80}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#111"}}>Menu Semanal</h1></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setCopyOpen(true)} style={{padding:"9px 14px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",color:"#111"}}>📋 Copiar</button>
          <button onClick={buildWA} style={{padding:"9px 14px",background:"#25D366",color:"#fff",border:"none",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer"}}>💬 WhatsApp</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,justifyContent:"center"}}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>‹</button>
        <span style={{fontWeight:700,fontSize:14,color:"#111"}}>{getWeekDates(weekOffset)}</span>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>›</button>
      </div>
      <div style={{borderRadius:14,overflow:"hidden",border:"1.5px solid #E5E7EB",background:"#fff"}}>
        <div style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr"}}>
          <div style={{padding:"12px",background:"#F9FAFB"}}></div>
          {MEAL_SLOTS.map(s=><div key={s} style={{padding:"12px",background:"#F9FAFB",fontWeight:700,fontSize:13,color:"#374151",borderLeft:"1px solid #E5E7EB",textAlign:"center"}}>{s}</div>)}
        </div>
        {DAYS.map(day=>(
          <div key={day} style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr",borderTop:"1px solid #E5E7EB"}}>
            <div style={{padding:"12px",display:"flex",alignItems:"center",background:"#FAFAFA",fontWeight:700,fontSize:12,color:"#374151"}}>{day}</div>
            {MEAL_SLOTS.map(slot=>{const items=menu[day]?.[slot]||[];return(
              <div key={slot} style={{padding:"8px",borderLeft:"1px solid #E5E7EB",minHeight:55,background:"transparent"}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>handleDrop(e,day,slot)}
                onTouchMove={e=>{
                  const t=e.touches[0];
                  const el=document.elementFromPoint(t.clientX,t.clientY);
                  const cell=el?.closest("[data-day][data-slot]");
                  if(cell)window._dropTarget={toDay:cell.dataset.day,toSlot:cell.dataset.slot};
                }}
                data-day={day} data-slot={slot}>
                {items.map(r=>(<div key={r.id}
                  draggable
                  onDragStart={e=>e.dataTransfer.setData("recipe",JSON.stringify({recipe:r,fromDay:day,fromSlot:slot}))}
                  onTouchStart={e=>{window._dragData={recipe:r,fromDay:day,fromSlot:slot};e.currentTarget.style.opacity="0.5";}}
                  onTouchEnd={e=>{e.currentTarget.style.opacity="1";if(window._dropTarget){const{toDay,toSlot}=window._dropTarget;if(!(toDay===day&&toSlot===slot)){handleDrop(null,toDay,toSlot,window._dragData);}window._dropTarget=null;}window._dragData=null;}}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",background:"#F3F4F6",borderRadius:7,marginBottom:5,fontSize:11,cursor:"grab"}}>
                  <span style={{color:"#C4C4C4",fontSize:9}}>⠿</span>
                  <span style={{flex:1,fontWeight:500,color:"#111"}}>{r.title}</span>
                  <button onClick={()=>removeFromMenu(day,slot,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:12,padding:1}}>×</button>
                </div>))}
                <button onClick={()=>{setPickerTarget({day,slot});setPickerOpen(true);setPickerSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:20,width:"100%",padding:"2px"}}>+</button>
              </div>
            );})}
          </div>
        ))}
      </div>
      <CopyWeekModal open={copyOpen} onClose={()=>setCopyOpen(false)} weekMenu={weekMenu} weekOffset={weekOffset} saveMenu={saveMenu}/>
      <Modal open={pickerOpen} onClose={()=>{setPickerOpen(false);setPickerTarget(null);}} title={"Anadir - "+(pickerTarget?.day||"")+" "+(pickerTarget?.slot||"")} width={460}>
        <input value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} placeholder="Buscar receta..." style={{...S.input,marginBottom:12}}/>
        <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:"48vh",overflowY:"auto"}}>
          {fp.map(r=>(<button key={r.id} onClick={()=>addToMenu(r)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#F9FAFB",border:"1.5px solid transparent",borderRadius:9,cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#F97316"} onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
            {r.image?<img src={r.image} style={{width:36,height:36,borderRadius:7,objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<div style={{width:36,height:36,borderRadius:7,background:"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🍽️</div>}
            <div><div style={{fontWeight:600,fontSize:13,color:"#111"}}>{r.title}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{r.mealType} · {r.recipeType}</div></div>
          </button>))}
          {fp.length===0&&<p style={{textAlign:"center",color:"#9CA3AF",padding:16}}>No hay recetas</p>}
        </div>
      </Modal>
    </div>
  );
}

function ShoppingListPage({weekMenu,recipes,deletedByWeek,setDeletedByWeek,extras,setExtras}){
  const [weekOffset,setWeekOffset]=useState(0);
  const [checked,setChecked]=useState({});
  const [newItem,setNewItem]=useState("");
  const [editItem,setEditItem]=useState(null);
  const key=getWeekKey(weekOffset);
  const menu=weekMenu[key]||{};

  // Build grouped ingredients
  const ingMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{
    const full=recipes.find(rec=>String(rec.id)===String(r.id));
    (full?.ingredients||r.ingredients||[]).forEach(ing=>{
      const rawName=(ing.name||'').trim();
      if(!rawName)return;
      const k=normalizeIngKey(rawName);
      const capName=cap(rawName);
      const amtStr=String(ing.amount||'').trim();
      const unit=(ing.unit||'').trim();
      const amtDisplay=amtStr&&amtStr!=='0'?(amtStr+(unit?' '+unit:'')):'al gusto';
      if(!ingMap[k]){
        ingMap[k]={id:k,name:capName,amounts:[amtDisplay],category:guessCategory(rawName)};
      }else{
        const exists=ingMap[k].amounts.includes(amtDisplay);
        if(!exists)ingMap[k].amounts.push(amtDisplay);
      }
    });
  });});});
  const weekDeletedKeys=(deletedByWeek||{})[key]||[];
  const allItems=[...Object.values(ingMap).filter(i=>!weekDeletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,"es"));
  const grouped={};SHOPPING_CATS.forEach(c=>{grouped[c.id]=[];});
  allItems.forEach(item=>{const cat=item.category||"otros";if(grouped[cat])grouped[cat].push(item);else grouped["otros"].push(item);});
  const checkedCount=allItems.filter(i=>checked[i.id]).length;
  function deleteItem(itemId){setDeletedByWeek(p=>{const cur=(p[key]||[]);if(cur.includes(itemId))return p;const n={...p,[key]:[...cur,itemId]};supabase.from('shopping_deleted').insert({id:itemId,week_key:key}).then(()=>{});return n;});setChecked(p=>{const n={...p};delete n[itemId];return n;});}

  function clearDeleted(){setDeletedByWeek(p=>{const n={...p};delete n[key];supabase.from('shopping_deleted').delete().eq('week_key',key).then(()=>{});return n;});}

  function buildWA(){let t="Lista de la Compra\n\n";SHOPPING_CATS.forEach(c=>{const items=grouped[c.id];if(!items.length)return;t+=c.emoji+" "+c.label+"\n";items.forEach(i=>{t+="  - "+i.name+(i.amounts&&i.amounts.length?" ("+i.amounts.join(" + ")+")":"")+"\n";});t+="\n";});window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank");}
  function copyList(){let t="";SHOPPING_CATS.forEach(c=>{const items=grouped[c.id];if(!items.length)return;t+=c.label+":\n";items.forEach(i=>{t+="  - "+i.name+(i.amounts&&i.amounts.length?" ("+i.amounts.join(" + ")+")":"")+"\n";});t+="\n";});navigator.clipboard.writeText(t).catch(()=>{});}
  function addExtra(){if(!newItem.trim())return;const n=cap(newItem.trim());const item={id:"ex-"+Date.now(),name:n,amount:"",unit:"",category:guessCategory(n)};setExtras(p=>[...p,item]);supabase.from("shopping_extras").insert({id:item.id,name:item.name,amount:item.amount,unit:item.unit,category:item.category}).then(()=>{});setNewItem("");}

  return(
    <div style={{padding:"18px 16px",paddingBottom:80}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#111"}}>Lista de Compra</h1><p style={{margin:"3px 0 0",color:"#9CA3AF",fontSize:12}}>4 personas</p></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={buildWA} style={{padding:"9px 14px",background:"#25D366",color:"#fff",border:"none",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer"}}>💬 WhatsApp</button>
          <button onClick={copyList} style={{padding:"9px 14px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",color:"#111"}}>📋 Copiar</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,justifyContent:"center"}}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>‹</button>
        <span style={{fontWeight:700,fontSize:14,color:"#111"}}>{getWeekDates(weekOffset)}</span>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>›</button>
        {weekDeletedKeys.length>0&&<button onClick={clearDeleted} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,color:"#9CA3AF"}}>↺ Restaurar</button>}
      </div>
      {checkedCount>0&&(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"10px 14px",background:"#F0FDF4",borderRadius:9}}><span style={{color:"#16A34A",fontWeight:600,fontSize:13}}>✓ {checkedCount} marcados</span><button onClick={()=>{const ids=Object.entries(checked).filter(([,v])=>v).map(([k])=>k);setExtras(p=>p.filter(i=>!ids.includes(i.id)));setDeletedByWeek(p=>{const cur=p[key]||[];const n={...p,[key]:[...new Set([...cur,...ids])]};supabase.from('shopping_deleted').upsert(ids.map(id=>({id,week_key:key}))).then(()=>{});return n;});setChecked({});setChecked({});}} style={{background:"#FEE2E2",border:"none",borderRadius:7,padding:"6px 11px",cursor:"pointer",color:"#EF4444",fontWeight:600,fontSize:12}}>🗑️ Eliminar marcados</button></div>)}
      <div style={{display:"flex",gap:9,marginBottom:20}}>
        <input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Anadir alimento..." onKeyDown={e=>e.key==="Enter"&&addExtra()} style={{...S.input,flex:1}}/>
        <button onClick={addExtra} style={{padding:"11px 16px",background:"#F97316",color:"#fff",border:"none",borderRadius:11,fontWeight:700,fontSize:17,cursor:"pointer"}}>+</button>
      </div>
      {SHOPPING_CATS.map(cat=>{const items=grouped[cat.id];if(!items.length)return null;return(
        <div key={cat.id} style={{marginBottom:18}}>
          <h3 style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#9CA3AF",letterSpacing:.5,textTransform:"uppercase",textAlign:"left"}}>{cat.emoji} {cat.label}</h3>
          <div style={{background:"#fff",borderRadius:13,border:"1.5px solid #E5E7EB",overflow:"hidden"}}>
            {items.map((item,idx)=>(<div key={item.id}>
              {idx>0&&<div style={{height:1,background:"#F3F4F6",margin:"0 14px"}}/>}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
                <button onClick={()=>setChecked(p=>({...p,[item.id]:!p[item.id]}))} style={{width:21,height:21,borderRadius:50,border:"2px solid "+(checked[item.id]?"#F97316":"#D1D5DB"),background:checked[item.id]?"#F97316":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {checked[item.id]&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
                </button>
                <span style={{flex:1,fontSize:13,fontWeight:500,color:checked[item.id]?"#9CA3AF":"#111",textDecoration:checked[item.id]?"line-through":"none",textAlign:"left"}}>
                  {item.name}{item.amounts&&item.amounts.filter(a=>a&&a!=='al gusto'||item.amounts.length===1).length>0&&<span style={{color:"#9CA3AF",fontWeight:400,marginLeft:5}}>({item.amounts.join(', ')})</span>}
                </span>
                {checked[item.id]?<button onClick={()=>{setExtras(p=>p.filter(i=>i.id!==item.id));deleteItem(item.id);setChecked(p=>{const n={...p};delete n[item.id];return n;});}} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:14}}>🗑️</button>:<button onClick={()=>setEditItem({...item})} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14}}>✏️</button>}
              </div>
            </div>))}
          </div>
        </div>
      );})}
      {allItems.length===0&&(<div style={{textAlign:"center",padding:"50px",color:"#9CA3AF"}}><div style={{fontSize:44,marginBottom:10}}>🛒</div><p>Anade recetas al menu semanal para generar la lista</p></div>)}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Editar ingrediente" width={380}>
        {editItem&&(<><div style={{display:"flex",gap:7,marginBottom:12}}>
          <div style={{flex:1}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>Cantidad</label><input value={editItem.amount} onChange={e=>setEditItem(p=>({...p,amount:e.target.value}))} style={{...S.input}}/></div>
          <div style={{flex:1}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>Unidad</label><input value={editItem.unit} onChange={e=>setEditItem(p=>({...p,unit:e.target.value}))} style={{...S.input}}/></div>
        </div>
        <div style={{marginBottom:16}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:3}}>Nombre</label><input value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))} style={{...S.input}}/></div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setEditItem(null)} style={{flex:1,padding:"10px",background:"#F3F4F6",border:"none",borderRadius:9,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button>
          <button onClick={()=>{setExtras(p=>{const idx=p.findIndex(i=>i.id===editItem.id);if(idx>=0){const n=[...p];n[idx]=editItem;return n;}return p;});setEditItem(null);}} style={{flex:1,padding:"10px",background:"#F97316",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700}}>Guardar</button>
        </div></>)}
      </Modal>
    </div>
  );
}

function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe,getUseCount,onClearDeleted}){
  const [addMenuRecipe,setAddMenuRecipe]=useState(null);
  const [filterMeal,setFilterMeal]=useState("Todas");
  const filteredRecipes=filterMeal==="Todas"?recipes:recipes.filter(r=>r.mealType===filterMeal);
  const grouped={};
  MEAL_TYPES.forEach(mt=>{
    const byType={};
    RECIPE_TYPES.forEach(rt=>{
      const recs=filteredRecipes.filter(r=>r.mealType===mt&&r.recipeType===rt).sort((a,b)=>a.title.localeCompare(b.title,'es'));
      if(recs.length>0)byType[rt]=recs;
    });
    // Also catch unmatched
    const other=filteredRecipes.filter(r=>r.mealType===mt&&!RECIPE_TYPES.includes(r.recipeType)).sort((a,b)=>a.title.localeCompare(b.title,'es'));
    if(other.length>0)byType["Otros platos"]=[...(byType["Otros platos"]||[]),...other];
    if(Object.keys(byType).length>0)grouped[mt]=byType;
  });

  return(
    <div style={{padding:"18px 16px"}}>
      <h1 style={{margin:"0 0 4px",fontSize:24,fontWeight:800,color:"#111"}}>Todas las Recetas</h1>
      <p style={{margin:"0 0 10px",color:"#9CA3AF",fontSize:12}}>{recipes.length} recetas ordenadas por tipo</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <button onClick={()=>setFilterMeal("Todas")} style={{padding:"6px 14px",borderRadius:20,border:"2px solid "+(filterMeal==="Todas"?"#F97316":"#E5E7EB"),background:filterMeal==="Todas"?"#FFF7ED":"#fff",color:filterMeal==="Todas"?"#F97316":"#374151",fontWeight:600,fontSize:12,cursor:"pointer"}}>Todas</button>
        {MEAL_TYPES.map(mt=><button key={mt} onClick={()=>setFilterMeal(mt)} style={{padding:"6px 14px",borderRadius:20,border:"2px solid "+(filterMeal===mt?MEAL_TYPE_COLORS[mt]?.bg||"#F97316":"#E5E7EB"),background:filterMeal===mt?(MEAL_TYPE_COLORS[mt]?.bg||"#FFF7ED"):"#fff",color:filterMeal===mt?(MEAL_TYPE_COLORS[mt]?.text||"#F97316"):"#374151",fontWeight:600,fontSize:12,cursor:"pointer"}}>{mt}</button>)}
      </div>
      {MEAL_TYPES.map(mt=>{
        if(!grouped[mt])return null;
        return(
          <div key={mt} style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{padding:"4px 12px",borderRadius:20,background:MEAL_TYPE_COLORS[mt]?.bg||"#6B7280",color:MEAL_TYPE_COLORS[mt]?.text||"#fff",fontWeight:700,fontSize:13}}>{mt}</span>
            </div>
            {Object.entries(grouped[mt]).map(([rt,recs])=>(
              <div key={rt} style={{marginBottom:14}}>
                <h3 style={{margin:"0 0 6px",fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:.5}}>{rt}</h3>
                <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #E5E7EB",overflow:"hidden"}}>
                  {recs.map((r,idx)=>(
                    <div key={r.id}>
                      {idx>0&&<div style={{height:1,background:"#F3F4F6",margin:"0 14px"}}/>}
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px"}}>
                        {r.image?<img src={r.image} style={{width:38,height:38,borderRadius:7,objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none"}}/>:<div style={{width:38,height:38,borderRadius:7,background:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>🍽️</div>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,color:"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textAlign:"left"}}>{r.title}</div>
                          {(getUseCount?getUseCount(r.id):0)>0&&<div style={{fontSize:10,color:"#F97316",fontWeight:600}}>Añadida al menu {getUseCount?getUseCount(r.id):0} {(getUseCount?getUseCount(r.id):0)===1?"vez":"veces"}</div>}
                        </div>
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <button onClick={()=>setAddMenuRecipe(r)} style={{padding:"5px 9px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,color:"#F97316"}}>+ Menu</button>
                          <button onClick={()=>{if(window.confirm("Eliminar "+r.title+"?"))onDelete(r.id);}} style={{padding:"5px 9px",background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,color:"#EF4444"}}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {recipes.length===0&&<div style={{textAlign:"center",padding:"50px",color:"#9CA3AF"}}><div style={{fontSize:44,marginBottom:10}}>📋</div><p>No hay recetas guardadas</p></div>}
      {addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>}
    </div>
  );
}


const LOGO_IMG = "data:image/jpeg;base64,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";

export default function App(){
  const [page,setPage]=useState("recetas");
  const [recipes,setRecipes]=useState([]);
  const [weekMenu,setWeekMenu]=useState({});
  const [loadingData,setLoadingData]=useState(true);
  const [deletedByWeek,setDeletedByWeek]=useState({});
  const [extras,setExtras]=useState([]);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("cocina_api_key")||"");
  const [apiKeyOpen,setApiKeyOpen]=useState(false);
  const [detailId,setDetailId]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const weekOffset=0;

  // Detect mobile
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  // Load from Supabase
  useEffect(()=>{
    async function load(){
      setLoadingData(true);
      try{
        const {data:recs}=await supabase.from("recipes").select("*").order("created_at",{ascending:false});
        if(recs)setRecipes(recs.map(r=>({id:r.id,title:r.title,description:r.description||"",image:r.image||"",mealType:r.meal_type||"Comida",recipeType:r.recipe_type||"Otros platos",ingredients:r.ingredients||[],steps:r.steps||[],sourceUrl:r.source_url||"",time:r.time||"",servings:r.servings||4,rating:r.rating||0,useCount:r.use_count||0})));
        const {data:deleted}=await supabase.from("shopping_deleted").select("id,week_key");
        const {data:extrasData}=await supabase.from("shopping_extras").select("*");
        if(extrasData)setExtras(extrasData.map(e=>({id:e.id,name:e.name,amount:e.amount||'',unit:e.unit||'',category:e.category||'otros'})));
        if(deleted){const dbw={};deleted.forEach(d=>{if(!dbw[d.week_key])dbw[d.week_key]=[];dbw[d.week_key].push(d.id);});setDeletedByWeek(dbw);}
        const {data:menu}=await supabase.from("week_menu").select("*");
        if(menu){const m={};menu.forEach(x=>{if(!m[x.week_key])m[x.week_key]={};if(!m[x.week_key][x.day])m[x.week_key][x.day]={};if(!m[x.week_key][x.day][x.slot])m[x.week_key][x.day][x.slot]=[];if(x.recipe_data)m[x.week_key][x.day][x.slot].push(x.recipe_data);});setWeekMenu(m);}
      }catch(e){console.error(e);}
      setLoadingData(false);
    }
    load();
  },[]);

  async function addRecipe(r){
    const existing=recipes.find(x=>x.title.toLowerCase().trim()===r.title.toLowerCase().trim());
    if(existing){if(!window.confirm("Ya tienes una receta llamada '"+r.title+"'. ¿Añadir de todas formas?"))return;}
    await supabase.from("recipes").insert({id:r.id,title:r.title,description:r.description,image:r.image,meal_type:r.mealType,recipe_type:r.recipeType,ingredients:r.ingredients,steps:r.steps,source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0,use_count:r.useCount||0});
    setRecipes(p=>[r,...p]);
  }

  async function deleteRecipe(id){
    await supabase.from("recipes").delete().eq("id",id);
    await supabase.from("week_menu").delete().eq("recipe_id",id);
    setRecipes(p=>p.filter(r=>r.id!==id));
  }

  async function updateRecipe(r){
    await supabase.from("recipes").update({title:r.title,description:r.description,image:r.image,meal_type:r.mealType,recipe_type:r.recipeType,ingredients:r.ingredients,steps:r.steps,source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0,use_count:r.useCount||0}).eq("id",r.id);
    setRecipes(p=>p.map(x=>x.id===r.id?r:x));
  }

  function clearRecipeDeletedItems(recipe,weekKey){
    if(!recipe||!weekKey)return;
    const ingKeys=(recipe.ingredients||[]).map(ing=>{
      const rawName=(ing.name||'').trim();
      return normalizeIngKey(rawName);
    }).filter(Boolean);
    if(ingKeys.length===0)return;
    setDeletedByWeek(p=>{
      const cur=p[weekKey]||[];
      const remaining=cur.filter(k=>!ingKeys.includes(k));
      if(remaining.length===cur.length)return p;
      const n={...p,[weekKey]:remaining};
      supabase.from('shopping_deleted').delete()
        .eq('week_key',weekKey)
        .in('id',ingKeys)
        .then(()=>{});
      return n;
    });
  }

  // Counter is computed from weekMenu - always accurate
  function getRecipeUseCount(id){
    let count=0;
    Object.values(weekMenu).forEach(days=>{
      Object.values(days).forEach(slots=>{
        Object.values(slots).forEach(rs=>{
          rs.forEach(r=>{if(String(r.id)===String(id))count++;});
        });
      });
    });
    return count;
  }

  async function updateRecipeCount(id,delta){
    // No-op - count is now computed from weekMenu
  }

  async function saveMenu(newMenu){
    setWeekMenu(newMenu);
    try{
      await supabase.from("week_menu").delete().neq("id","00000000-0000-0000-0000-000000000000");
      const rows=[];
      Object.entries(newMenu).forEach(([wk,days])=>Object.entries(days).forEach(([day,slots])=>Object.entries(slots).forEach(([slot,rs])=>rs.forEach(r=>rows.push({week_key:wk,day,slot,recipe_id:r.id,recipe_data:r})))));
      if(rows.length>0)await supabase.from("week_menu").insert(rows);
    }catch(e){console.error("saveMenu error:",e);}
  }

  const NAV=[{id:"recetas",label:"Recetas",icon:"📖"},{id:"todas",label:"Todas las Recetas",icon:"📋"},{id:"menu",label:"Menu Semanal",icon:"📅"},{id:"compra",label:"Lista de Compra",icon:"🛒"}];

  function navigate(id){setPage(id);if(id==="recetas")setDetailId(null);setMenuOpen(false);}

  if(loadingData)return(<div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,background:"#F8F7F4"}}><img src={LOGO_IMG} style={{width:80,height:80,borderRadius:16}} alt="Logo"/><p style={{color:"#9CA3AF",fontSize:14}}>Cargando...</p></div>);

  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#F8F7F4",overflow:"hidden",position:"fixed",top:0,left:0}}>
      {/* Sidebar - hidden on mobile unless open */}
      {isMobile&&menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:99}}/>}
      <div style={{width:200,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0,position:isMobile?"fixed":"relative",top:0,left:isMobile?(menuOpen?0:-200):"auto",height:"100vh",zIndex:isMobile?100:"auto",transition:"left .25s",boxShadow:isMobile&&menuOpen?"4px 0 20px rgba(0,0,0,.15)":"none"}}>
        <div style={{padding:"14px 14px 12px",borderBottom:"1px solid #F3F4F6"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src={LOGO_IMG} style={{width:40,height:40,borderRadius:9,objectFit:"cover"}} alt="Logo"/>
            <div><div style={{fontWeight:800,fontSize:12,color:"#111",letterSpacing:.4}}>COCINA CASA</div><div style={{fontSize:10,color:"#9CA3AF"}}>MENU SEMANAL</div></div>
          </div>
        </div>
        <nav style={{padding:"10px",flex:1}}>
          {NAV.map(item=>(<button key={item.id} onClick={()=>navigate(item.id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"10px 12px",borderRadius:9,border:"none",background:page===item.id?"#F97316":"transparent",color:page===item.id?"#fff":"#374151",fontWeight:page===item.id?700:500,fontSize:13,cursor:"pointer",marginBottom:3,textAlign:"left"}}><span>{item.icon}</span>{item.label}</button>))}
        </nav>
        <div style={{padding:"6px 10px 4px"}}>
          <p style={{margin:0,fontSize:9,color:"#C4C4C4",lineHeight:1.6,textAlign:"center"}}>© Jesus Cortijo<br/>Abril 2026</p>
        </div>
        <div style={{padding:"4px 10px 10px"}}>
          <button onClick={()=>{setApiKeyOpen(true);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #E5E7EB",background:apiKey?"#F0FDF4":"#FFF7ED",color:apiKey?"#16A34A":"#F97316",fontWeight:600,fontSize:11,cursor:"pointer"}}>{apiKey?"✅ API Key OK":"⚙️ Configurar API Key"}</button>
        </div>
      </div>

      {/* Main content */}
      <div id="main-scroll" style={{flex:1,overflowY:"auto",minWidth:0,position:"relative"}}>
        {/* Mobile top bar */}
        {isMobile&&(
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#fff",borderBottom:"1px solid #F3F4F6",position:"sticky",top:0,zIndex:50}}>
            <img src={LOGO_IMG} style={{width:32,height:32,borderRadius:7,objectFit:"cover"}} alt="Logo"/>
            <span style={{fontWeight:800,fontSize:13,color:"#111"}}>COCINA CASA</span>
            <button onClick={()=>setMenuOpen(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#374151",padding:"2px 6px"}}>☰</button>
          </div>
        )}
        {page==="recetas"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount} onClearDeleted={clearRecipeDeletedItems}/>}
        {page==="todas"&&<AllRecipesPage recipes={recipes} onDelete={deleteRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={0} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount} onClearDeleted={clearRecipeDeletedItems}/>}
        {page==="menu"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount} onClearDeleted={clearRecipeDeletedItems}/>}
        {page==="compra"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes} deletedByWeek={deletedByWeek} setDeletedByWeek={setDeletedByWeek} extras={extras} setExtras={setExtras}/>}
      </div>
      <ApiKeyModal open={apiKeyOpen} onClose={()=>setApiKeyOpen(false)} apiKey={apiKey} setApiKey={setApiKey}/>
    </div>
  );
}
