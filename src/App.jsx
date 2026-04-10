import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qqgrdvtdstmqlhlpthxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ3JkdnRkc3RtcWxobHB0aHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjgyNzgsImV4cCI6MjA5MTM0NDI3OH0.5RCzKw6yM6w62T7UPrkdyWC8RILzvITubt8D6rXyASM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MEAL_TYPES = ["Comida","Cena","Fin de Semana","Postre","Entrante","Verano","Salsas","Otros"];
const RECIPE_TYPES = ["Carne","Guisos","Pescados","Arroz y Pasta","Verdura","Otros platos"];
const DAYS = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];
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
const SHOPPING_CATEGORIES = [
  {id:"carnes",label:"Carnes",emoji:"🥩"},
  {id:"pescados",label:"Pescados y Mariscos",emoji:"🐟"},
  {id:"verduras",label:"Verduras y Hortalizas",emoji:"🥦"},
  {id:"frutas",label:"Frutas",emoji:"🍎"},
  {id:"lacteos",label:"Lacteos y Huevos",emoji:"🥚"},
  {id:"cereales",label:"Cereales y Legumbres",emoji:"🌾"},
  {id:"conservas",label:"Conservas y Salsas",emoji:"🥫"},
  {id:"fiambres",label:"Fiambres y Embutidos",emoji:"🥓"},
  {id:"especias",label:"Especias y Condimentos",emoji:"🧂"},
  {id:"otros",label:"Otros",emoji:"🛒"},
];
const inputStyle = {display:"block",width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff",color:"#111"};
const selectStyle = {padding:"6px 12px",borderRadius:20,border:"2px solid #E5E7EB",background:"#fff",color:"#111",fontWeight:600,fontSize:12,cursor:"pointer"};

function getWeekKey(offset=0){const now=new Date();const day=now.getDay();const diff=now.getDate()-day+(day===0?-6:1);const monday=new Date(new Date().setDate(diff+offset*7));return monday.toISOString().split("T")[0];}

function getWeekDates(offset=0){
  const now=new Date();
  const day=now.getDay();
  const diff=now.getDate()-day+(day===0?-6:1);
  const monday=new Date(new Date().setDate(diff+offset*7));
  const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
  const fmt=(d)=>d.toLocaleDateString("es-ES",{day:"numeric",month:"long"});
  return fmt(monday)+" - "+fmt(sunday);
}

function normalizeIngredientKey(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  // Normalize aceite variants
  if(/aceite/.test(n))return"aceite";
  // Normalize arroz variants
  if(/\barroz\b/.test(n))return"arroz";
  // Normalize caldo variants
  if(/\bcaldo\b/.test(n))return"caldo";
  // Normalize tomate variants (not tomate frito)
  if(/\btomate\b/.test(n)&&!/frito|triturado|concentrado|conserva/.test(n))return"tomate";
  // Normalize ajo variants
  if(/\baj[oa]s?\b/.test(n))return"ajo";
  // Normalize cebolla variants
  if(/\bceboll/.test(n))return"cebolla";
  // Normalize sal variants
  if(/^sal(\s|$)/.test(n))return"sal";
  return n;
}

function guessCategory(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
  // Fiambres y embutidos - antes que carnes para no confundir
  if(/jamon (york|cocido|dulce|serrano|iberico|pata negra)|salchichon|fuet|mortadela|chopped|pavo (fiambre|cocido)|pechuga (pavo|pollo) (fiambre|cocida)|fiambre|embutido|sobrasada|lomo embuchado|cecina|bresaola|salami|pepperoni/.test(n))return"fiambres";
  // Carnes
  if(/pollo|carne (de |picada|molida)?|cerdo|ternera|jamon|chorizo|morcilla|panceta|costill|buey|cordero|pavo|pato|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|lomo|solomillo|codillo|carrillada|secreto|pluma iberic|cabrito|liebre|perdiz|codorniz|venado|res |chuleta|costillar|albondiga|hamburguesa/.test(n))return"carnes";
  // Pescados y mariscos
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja|berberecho|navaja|ostra|pulpo|jibia|choco|lenguado|rodaballo|trucha|anchoa|caballa|jurel|emperador|surimi|langosta|bogavante|centollo|nécora|vieira/.test(n))return"pescados";
  // Verduras y hortalizas - lista muy amplia
  if(/tomate|cebolla|ajo|pimiento|patata|papa|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|apio|pepino|brocoli|coliflor|alcachofa|judia verde|judias verdes|acelga|nabo|rabano|champin|champinon|seta|portobello|shiitake|calabaza|esparrago|guisante|haba|pak choi|boniato|batata|col |repollo|kale|canonigo|rucola|endivia|escarola|cebolleta|cebollino|perejil fresco|albahaca fresca|cilantro fresco|menta fresca|hierbabuena|romero fresco|tomillo fresco|verdura|hortaliza|berro|hinojo fresco|apio fresco|maiz dulce|elote|pimiento morrón/.test(n))return"verduras";
  // Frutas
  if(/manzana|naranja|limon|platano|fresa|uva|pera|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|pina|fruta|frutos rojos|frambuesa|mora|arandano|granada|higo|datil|ciruela|pomelo|mandarina|lima|coco|papaya|aguacate|fruto seco|almendra|nuez|pistacho|anacardo|avellana|cacahuete/.test(n))return"frutas";
  // Lacteos y huevos
  if(/leche|queso|yogur|nata|mantequilla|huevo|crema (de leche|agria)|requeson|mozzarella|parmesano|ricotta|mascarpone|burgos|manchego|brie|camembert|roquefort|gorgonzola|feta|lacteo|nata montada|creme fraiche/.test(n))return"lacteos";
  // Cereales y legumbres
  if(/arroz|pasta|fideo|espagueti|macarron|tallar|lasana|canelones|cuscus|bulgur|avena|trigo|centeno|cebada|mijo|amaranto|tapioca|polenta|semola|pan |harina|garbanzo|lenteja|alubia|judion|judia (seca|pinta|blanca)|maiz|cereal|quinoa/.test(n))return"cereales";
  // Conservas y salsas
  if(/caldo (de |vegetal|pollo|carne|pescado|marisco)|tomate frito|salsa (de tomate|bechamel|carbonara|boloñesa|pesto|soja|worcestershire|tabasco|barbacoa|agridulce)|conserva|lata de|bote de|aceitunas|alcaparra|pepinillo|atun (en lata|enlatado)|mejillones (en lata|escabeche)|concentrado|sofrito|pisto|caldo concentrado/.test(n))return"conservas";
  // Especias y condimentos
  if(/sal|pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|aceite (de oliva|vegetal|girasol)?|vinagre|canela|nuez moscada|clavo|cardamomo|especias|condimento|mostaza|ketchup|mayonesa|soja|tabasco|worcestershire|ras el hanout|curcuma|jengibre|cilantro (molido|en polvo)|cayena|guindilla|paprika|anis|hinojo seco|eneldo|estragón|mejorana|hierbas|aliño/.test(n))return"especias";
  return"otros";
}

function StarRating({value,onChange,size=18}){
  return(
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} onClick={()=>onChange(value===i?0:i)}
          style={{cursor:"pointer",fontSize:size,color:i<=value?"#F59E0B":"#D1D5DB",transition:"color .15s",userSelect:"none"}}>★</span>
      ))}
    </div>
  );
}

function Modal({open,onClose,children,title,width=520}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:1,background:"#fff",borderRadius:20,width:"min("+width+"px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.18)",padding:"28px 28px 24px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:"#111"}}>{title}</h2>
          <button onClick={onClose} style={{border:"none",background:"#F3F4F6",borderRadius:50,width:32,height:32,cursor:"pointer",fontSize:18,color:"#555",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
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
    <Modal open={open} onClose={onClose} title="⚙️ Configuracion API" width={460}>
      <p style={{color:"#6B7280",fontSize:14,marginBottom:6}}>Para importar recetas necesitas una API Key de Anthropic.</p>
      <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginBottom:16,color:"#F97316",fontSize:13,fontWeight:600}}>Obtener API Key en console.anthropic.com</a>
      <label style={{fontWeight:600,fontSize:13,color:"#374151",display:"block",marginBottom:6}}>API Key</label>
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder="sk-ant-..." type="password" style={{...inputStyle,marginBottom:8,fontFamily:"monospace"}}/>
      <p style={{color:"#9CA3AF",fontSize:12,marginBottom:20}}>La clave se guarda solo en tu navegador.</p>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button>
        <button onClick={()=>{const k=val.trim();setApiKey(k);localStorage.setItem("cocina_api_key",k);onClose();}} style={{flex:1,padding:"11px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Guardar</button>
      </div>
    </Modal>
  );
}

function AddRecipeModal({open,onClose,onAdd,apiKey,onNeedKey}){
  const [tab,setTab]=useState("buscar");
  const [url,setUrl]=useState("");
  const [textInput,setTextInput]=useState("");
  const [searchQuery,setSearchQuery]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const fileRef=useRef();

  async function callAnthropic(prompt,imgData=null){
    if(!apiKey){onNeedKey();return null;}
    const messages=[];
    if(imgData){
      messages.push({role:"user",content:[
        {type:"image",source:{type:"base64",media_type:imgData.type,data:imgData.data}},
        {type:"text",text:prompt}
      ]});
    }else{
      messages.push({role:"user",content:prompt});
    }
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2000,system:"Eres un asistente de cocina. Devuelve SOLO JSON valido sin texto adicional ni backticks.",messages})
    });
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err?.error?.message||"HTTP "+res.status);}
    const d=await res.json();
    const text=d.content?.[0]?.text||"";
    if(!text)throw new Error("Respuesta vacia");
    const m=text.match(/\{[\s\S]*\}/);
    if(!m)throw new Error("No JSON en respuesta");
    return JSON.parse(m[0]);
  }

  const TPL='{"title":"TITULO","description":"DESCRIPCION breve","image":"https://URL-imagen-real.jpg","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno completo","paso dos completo"],"sourceUrl":"","time":"30 min","servings":4}';
  const PROMPT_SUFFIX="mealType debe ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros. recipeType debe ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos. Infiere el mealType y recipeType correctamente. IMPORTANTE: Para el campo image, busca y pon la URL directa de una imagen real del plato terminada en .jpg o .png, que sea una URL publica y accesible. Los pasos de preparacion deben ser COMPLETOS y DETALLADOS, sin resumir. Cada paso debe explicar exactamente que hacer, con tiempos, temperaturas y tecnicas.";

  async function importRecipe(prompt,imgData=null,photoDataUrl=null){
    setLoading(true);setError("");
    try{
      const data=await callAnthropic(prompt,imgData);
      if(!data){setLoading(false);return;}
      const finalImage=data.image==="USAR_FOTO_SUBIDA"?(photoDataUrl||""): (data.image||photoDataUrl||"");
      onAdd({id:Date.now(),title:data.title||"Receta",description:data.description||"",image:finalImage,mealType:MEAL_TYPES.includes(data.mealType)?data.mealType:"Comida",recipeType:RECIPE_TYPES.includes(data.recipeType)?data.recipeType:"Otros platos",ingredients:(data.ingredients||[]).map((ing,i)=>({id:Date.now()+i,amount:String(ing.amount||""),unit:String(ing.unit||""),name:String(ing.name||"")})),steps:Array.isArray(data.steps)?data.steps:data.steps?data.steps.split("\n").filter(s=>s.trim()):[],sourceUrl:data.sourceUrl||"",time:data.time||"",servings:Number(data.servings)||4,rating:0});
      onClose();
    }catch(e){setError("Error: "+e.message);}
    setLoading(false);
  }

  async function importByUrl(urlVal,photoDataUrl=null,isSearch=false){
    if(!apiKey){onNeedKey();return;}
    setLoading(true);setError("");
    try{
      const payload=isSearch?{search:urlVal.replace("buscar:",""),apiKey}:{url:urlVal,apiKey};
      const r=await fetch("/api/import-recipe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"Error del servidor");
      const finalImage=data.image==="USAR_FOTO_SUBIDA"?(photoDataUrl||""): (data.image||photoDataUrl||"");
      const finalImage2 = data.image || photoDataUrl || "";
      onAdd({id:Date.now(),title:data.title||"Receta",description:data.description||"",image:finalImage,mealType:MEAL_TYPES.includes(data.mealType)?data.mealType:"Comida",recipeType:RECIPE_TYPES.includes(data.recipeType)?data.recipeType:"Otros platos",ingredients:(data.ingredients||[]).map((ing,i)=>({id:Date.now()+i,amount:String(ing.amount||""),unit:String(ing.unit||""),name:String(ing.name||"")})),steps:Array.isArray(data.steps)?data.steps:data.steps?data.steps.split("\n").filter(s=>s.trim()):[],sourceUrl:data.sourceUrl||urlVal,time:data.time||"",servings:Number(data.servings)||4,rating:0});
      onClose();
    }catch(e){setError("Error: "+e.message);}
    setLoading(false);
  }

  function handleImport(){
    if(tab==="enlace"||tab==="video"){if(!url.trim()){setError("Introduce una URL");return;}importByUrl(url);}
    else if(tab==="buscar"){if(!searchQuery.trim()){setError("Escribe el nombre de un plato");return;}importByUrl("buscar:"+searchQuery,null,true);}
    else if(tab==="texto"){if(!textInput.trim()){setError("Pega el texto de la receta");return;}importRecipe("Analiza este texto y extrae la receta completa. Devuelve JSON: "+TPL+" "+PROMPT_SUFFIX+" TEXTO: "+textInput);}
  }

  function handleImage(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const base64=reader.result.split(",")[1];const dataUrl=reader.result;importRecipe("Analiza esta imagen de receta. Extrae titulo, ingredientes y pasos. Para el campo image pon exactamente este valor: USAR_FOTO_SUBIDA. Devuelve JSON: "+TPL+" "+PROMPT_SUFFIX,{type:file.type,data:base64},dataUrl);};reader.readAsDataURL(file);}

  const tabs=[{id:"buscar",label:"🔍 Buscar"},{id:"enlace",label:"🔗 Enlace"},{id:"video",label:"🎥 Video"},{id:"foto",label:"📷 Foto"},{id:"texto",label:"📝 Texto"}];
  return(
    <Modal open={open} onClose={onClose} title="Añadir Receta" width={520}>
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setError("");}} style={{padding:"7px 14px",borderRadius:20,border:"2px solid "+(tab===t.id?"#F97316":"#E5E7EB"),background:tab===t.id?"#FFF7ED":"#fff",color:tab===t.id?"#F97316":"#111",fontWeight:600,cursor:"pointer",fontSize:13}}>{t.label}</button>)}
      </div>
      {tab==="foto"&&(<div><p style={{color:"#6B7280",fontSize:14,marginBottom:12}}>Sube una foto y la IA extraera la receta.</p><input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{display:"none"}}/><button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"40px 20px",border:"2px dashed #E5E7EB",borderRadius:12,background:"#fff",cursor:"pointer",color:"#9CA3AF",fontSize:15}}>📸 Seleccionar imagen</button></div>)}
      {(tab==="enlace"||tab==="video")&&(<div><p style={{color:"#6B7280",fontSize:14,marginBottom:8}}>Pega el enlace y la IA importara la receta real de esa pagina.</p><input value={url} onChange={e=>{setUrl(e.target.value);setError("");}} placeholder="https://ejemplo.com/receta..." style={{...inputStyle,marginTop:4}} onKeyDown={e=>e.key==="Enter"&&handleImport()}/></div>)}
      {tab==="buscar"&&(<div><p style={{color:"#6B7280",fontSize:14,marginBottom:8}}>Escribe el nombre de un plato y la IA creara la receta.</p><input value={searchQuery} onChange={e=>{setSearchQuery(e.target.value);setError("");}} placeholder="Ej: Paella valenciana..." style={{...inputStyle,marginTop:4}} onKeyDown={e=>e.key==="Enter"&&handleImport()}/></div>)}
      {tab==="texto"&&(<div><p style={{color:"#6B7280",fontSize:14,marginBottom:8}}>Pega el texto de la receta.</p><textarea value={textInput} onChange={e=>{setTextInput(e.target.value);setError("");}} rows={7} style={{...inputStyle,resize:"vertical",fontFamily:"inherit",marginTop:4}}/></div>)}
      {!apiKey&&(<div style={{marginTop:12,padding:"10px 14px",background:"#FFFBEB",borderRadius:8,color:"#92400E",fontSize:13,border:"1px solid #FCD34D"}}>Necesitas configurar una API Key. <button onClick={onNeedKey} style={{background:"none",border:"none",color:"#F97316",fontWeight:700,cursor:"pointer",fontSize:13}}>Configurar</button></div>)}
      {error&&(<div style={{marginTop:12,padding:"10px 14px",background:"#FEF2F2",borderRadius:8,color:"#DC2626",fontSize:13,border:"1px solid #FCA5A5"}}>{error}</div>)}
      <button disabled={loading||tab==="foto"} onClick={handleImport} style={{marginTop:16,width:"100%",padding:"14px",background:loading?"#FED7AA":"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer"}}>
        {loading?"⏳ Importando con IA...":"✨ Importar Receta"}
      </button>
    </Modal>
  );
}

function EditIngredientsModal({open,onClose,ingredients,onSave}){
  const [local,setLocal]=useState([]);
  useEffect(()=>{if(open)setLocal(ingredients.map(i=>({...i})));},[open,ingredients]);
  function update(id,field,val){setLocal(prev=>prev.map(i=>i.id===id?{...i,[field]:val}:i));}
  function save(){onSave(local.filter(i=>i.name.trim()!==""));onClose();}
  return(
    <Modal open={open} onClose={onClose} title="Editar Ingredientes" width={600}>
      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"55vh",overflowY:"auto"}}>
        {local.map(ing=>(<div key={ing.id} style={{display:"flex",gap:8,alignItems:"center"}}><input value={ing.amount} onChange={e=>update(ing.id,"amount",e.target.value)} style={{width:70,padding:"8px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111"}} placeholder="Cant."/><input value={ing.unit} onChange={e=>update(ing.id,"unit",e.target.value)} style={{width:90,padding:"8px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111"}} placeholder="Unidad"/><input value={ing.name} onChange={e=>update(ing.id,"name",e.target.value)} style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111"}} placeholder="Ingrediente"/><button onClick={()=>setLocal(prev=>prev.filter(i=>i.id!==ing.id))} style={{padding:"6px 10px",background:"#FEE2E2",border:"none",borderRadius:8,cursor:"pointer",color:"#EF4444"}}>🗑</button></div>))}
      </div>
      <button onClick={()=>setLocal(prev=>[...prev,{id:Date.now(),amount:"",unit:"unidad",name:""}])} style={{marginTop:12,padding:"9px 16px",background:"#F3F4F6",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,color:"#374151",fontSize:13}}>+ Añadir línea</button>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
        <button onClick={onClose} style={{padding:"10px 20px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button>
        <button onClick={save} style={{padding:"10px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Guardar</button>
      </div>
    </Modal>
  );
}

function AddToMenuModal({open,onClose,recipe,weekMenu,setWeekMenu,currentWeekOffset}){
  const [day,setDay]=useState("Lunes");
  const [slot,setSlot]=useState("Comida");
  function add(){const key=getWeekKey(currentWeekOffset);setWeekMenu(prev=>{const week={...(prev[key]||{})};if(!week[day])week[day]={};if(!week[day][slot])week[day][slot]=[];if(!week[day][slot].find(r=>r.id===recipe.id))week[day][slot]=[...week[day][slot],recipe];return{...prev,[key]:week};});onClose();}
  return(
    <Modal open={open} onClose={onClose} title="Añadir al Menú Semanal" width={400}>
      <div style={{marginBottom:14}}><label style={{fontWeight:600,fontSize:13,color:"#374151",display:"block",marginBottom:6}}>Día</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{DAYS.map(d=>(<button key={d} onClick={()=>setDay(d)} style={{padding:"7px 14px",borderRadius:20,border:"2px solid "+(day===d?"#F97316":"#E5E7EB"),background:day===d?"#FFF7ED":"#fff",color:day===d?"#F97316":"#111",fontWeight:600,cursor:"pointer",fontSize:12}}>{d}</button>))}</div></div>
      <div style={{marginBottom:20}}><label style={{fontWeight:600,fontSize:13,color:"#374151",display:"block",marginBottom:6}}>Momento</label><div style={{display:"flex",gap:8}}>{MEAL_SLOTS.map(s=>(<button key={s} onClick={()=>setSlot(s)} style={{flex:1,padding:"10px",borderRadius:10,border:"2px solid "+(slot===s?"#F97316":"#E5E7EB"),background:slot===s?"#FFF7ED":"#fff",color:slot===s?"#F97316":"#111",fontWeight:600,cursor:"pointer"}}>{s}</button>))}</div></div>
      <div style={{display:"flex",gap:10}}><button onClick={onClose} style={{flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button><button onClick={add} style={{flex:1,padding:"11px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Añadir</button></div>
    </Modal>
  );
}

function CopyWeekModal({open,onClose,weekMenu,currentWeekOffset,setWeekMenu}){
  const [selected,setSelected]=useState(null);
  const offsets=[-4,-3,-2,-1,0,1,2,3,4].filter(o=>o!==currentWeekOffset);
  function copy(){if(selected===null)return;const srcKey=getWeekKey(currentWeekOffset);const dstKey=getWeekKey(selected);setWeekMenu(prev=>({...prev,[dstKey]:JSON.parse(JSON.stringify(prev[srcKey]||{}))}));onClose();}
  return(
    <Modal open={open} onClose={onClose} title="Copiar menú a otra semana" width={380}>
      <p style={{color:"#6B7280",fontSize:14,marginBottom:14}}>Selecciona la semana destino:</p>
      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"55vh",overflowY:"auto"}}>
        {offsets.map(o=>{const key=getWeekKey(o);const has=weekMenu[key]&&Object.keys(weekMenu[key]).length>0;const isSel=selected===o;return(<button key={o} onClick={()=>setSelected(o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:12,border:"2px solid "+(isSel?"#F97316":"#E5E7EB"),background:isSel?"#FFF7ED":"#fff",cursor:"pointer",textAlign:"left"}}><span style={{fontWeight:600,color:isSel?"#F97316":"#111",fontSize:14}}>{getWeekDates(o)}</span>{has&&<span style={{fontSize:12,color:"#9CA3AF"}}>tiene menú</span>}</button>);})}
      </div>
      <div style={{display:"flex",gap:10,marginTop:20}}><button onClick={onClose} style={{flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button><button onClick={copy} disabled={selected===null} style={{flex:1,padding:"11px",background:selected===null?"#FED7AA":"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:selected===null?"not-allowed":"pointer",fontWeight:700}}>Copiar</button></div>
    </Modal>
  );
}


function CardImageUpload({recipe,onUpdate}){
  const fileRef=useRef();
  function handleUpload(e){
    e.stopPropagation();
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>onUpdate({...recipe,image:reader.result});
    reader.readAsDataURL(file);
  }
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,color:"#C4C4C4",background:"#F9FAFB"}}
      onClick={e=>{e.stopPropagation();fileRef.current.click();}}>
      <span style={{fontSize:32}}>📷</span>
      <span style={{fontSize:11,fontWeight:500}}>Añadir foto</span>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/>
    </div>
  );
}

function RecipeCard({recipe,onOpen,onDelete,onAddMenu,onUpdate}){
  const [menuOpen,setMenuOpen]=useState(false);
  const col=MEAL_TYPE_COLORS[recipe.mealType]||MEAL_TYPE_COLORS["Otros"];
  return(
    <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.07)",cursor:"pointer",position:"relative",transition:"transform .15s,box-shadow .15s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.12)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.07)"}}>
      <div style={{position:"relative",height:180,background:"#F3F4F6",overflow:"hidden"}} onClick={()=>onOpen(recipe)}>
        {recipe.image?<img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<CardImageUpload recipe={recipe} onUpdate={onUpdate}/>}
        <span style={{position:"absolute",top:10,left:10,padding:"4px 10px",borderRadius:20,background:col.bg,color:col.text,fontWeight:700,fontSize:11}}>{recipe.mealType}</span>
        <div style={{position:"absolute",top:8,right:8}}>
          <button onClick={e=>{e.stopPropagation();setMenuOpen(v=>!v)}}
            style={{width:30,height:30,borderRadius:50,background:"rgba(255,255,255,.92)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}>
            <span style={{fontSize:16,lineHeight:1,letterSpacing:1,color:"#555"}}>⋮</span>
          </button>
          {menuOpen&&(
            <div style={{position:"absolute",right:0,top:34,background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.15)",minWidth:180,zIndex:10,overflow:"hidden"}}
              onMouseLeave={()=>setMenuOpen(false)}>
              <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onAddMenu(recipe)}} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",width:"100%",fontSize:13,fontWeight:600,color:"#374151",textAlign:"left"}}>📅 Añadir al menú semanal</button>
              <button onClick={e=>{e.stopPropagation();setMenuOpen(false);onDelete(recipe.id)}} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",background:"none",border:"none",cursor:"pointer",width:"100%",fontSize:13,fontWeight:600,color:"#EF4444",textAlign:"left"}}>🗑️ Eliminar receta</button>
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"12px 12px 10px"}} onClick={()=>onOpen(recipe)}>
        <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#111",lineHeight:1.3,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{recipe.title}</h3>
        <p style={{margin:"0 0 8px",fontSize:12,color:"#6B7280",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{recipe.description}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:10,fontSize:11,color:"#9CA3AF"}}>
            {recipe.time&&<span>⏱ {recipe.time}</span>}
            <span>👥 {recipe.servings}p</span>
          </div>
          <StarRating value={recipe.rating} onChange={()=>{}} size={13}/>
        </div>
      </div>
    </div>
  );
}


function RecipeImageSection({recipe,onUpdate}){
  const fileRef=useRef();
  function handleImageUpload(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>onUpdate({...recipe,image:reader.result});
    reader.readAsDataURL(file);
  }
  if(recipe.image){
    return(
      <div style={{borderRadius:16,overflow:"hidden",marginBottom:16,height:280,position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current.click()}>
        <img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentNode.style.background="#F3F4F6";}}/>
        <div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.5)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:12,cursor:"pointer"}}>📷 Cambiar foto</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
      </div>
    );
  }
  return(
    <div style={{borderRadius:16,marginBottom:16,height:180,background:"#F9FAFB",border:"2px dashed #E5E7EB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:8}} onClick={()=>fileRef.current.click()}>
      <span style={{fontSize:40}}>📷</span>
      <span style={{color:"#9CA3AF",fontSize:14,fontWeight:500}}>Añadir foto de la receta</span>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
    </div>
  );
}

function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,setWeekMenu,currentWeekOffset}){
  const detailRef=useRef(null);
  useEffect(()=>{const el=document.getElementById('main-scroll');if(el)el.scrollTo({top:0,behavior:'instant'});window.scrollTo(0,0);},[recipe?.id]);
  const [editIngOpen,setEditIngOpen]=useState(false);
  const [addMenuOpen,setAddMenuOpen]=useState(false);
  const col=MEAL_TYPE_COLORS[recipe.mealType]||MEAL_TYPE_COLORS["Otros"];
  function updateField(field,val){onUpdate({...recipe,[field]:val});}
  return(
    <div ref={detailRef} style={{maxWidth:720,margin:"0 auto",padding:"20px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",fontWeight:600,color:"#374151",fontSize:15}}>← Volver</button>
        <button onClick={()=>onDelete(recipe.id)} style={{background:"#FEE2E2",border:"none",borderRadius:10,padding:"10px 14px",cursor:"pointer",color:"#EF4444",fontSize:18}}>🗑️</button>
      </div>

      <RecipeImageSection recipe={recipe} onUpdate={onUpdate}/>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <select value={recipe.mealType} onChange={e=>updateField("mealType",e.target.value)} style={{...selectStyle,border:"2px solid "+col.bg,background:col.bg,color:col.text}}>
          {MEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={recipe.recipeType} onChange={e=>updateField("recipeType",e.target.value)} style={selectStyle}>
          {RECIPE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <h1 style={{fontSize:24,fontWeight:800,color:"#111",marginBottom:6,textAlign:"left"}}>{recipe.title}</h1>
      <p style={{fontSize:14,color:"#6B7280",marginBottom:16,lineHeight:1.6,textAlign:"left"}}>{recipe.description}</p>

      <div style={{display:"flex",gap:20,marginBottom:16,fontSize:14,color:"#6B7280"}}>
        {recipe.time&&<span>⏱ {recipe.time}</span>}
        <span>👥 {recipe.servings} porciones</span>
      </div>

      {recipe.sourceUrl&&(
        <div style={{textAlign:"left",marginBottom:16}}>
          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:6,color:"#F97316",fontWeight:600,fontSize:14,textDecoration:"none"}}>
            🔗 Ver fuente original
          </a>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px",background:"#FFF7ED",borderRadius:14,marginBottom:24}}>
        <button onClick={()=>setAddMenuOpen(true)}
          style={{padding:"10px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
          📅 Añadir al menú semanal
        </button>
        <div style={{textAlign:"right"}}>
          <p style={{margin:"0 0 4px",fontSize:12,color:"#9CA3AF",fontWeight:600}}>Tu valoración</p>
          <StarRating value={recipe.rating} onChange={v=>updateField("rating",v)} size={22}/>
        </div>
      </div>

      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#111",textAlign:"left"}}>Ingredientes</h2>
          <button onClick={()=>setEditIngOpen(true)} style={{padding:"8px 16px",background:"#F3F4F6",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13,color:"#111"}}>✏️ Editar</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {recipe.ingredients.map(ing=>(
            <div key={ing.id} style={{display:"flex",gap:12,padding:"10px 14px",background:"#F9FAFB",borderRadius:10,fontSize:14,textAlign:"left"}}>
              <span style={{fontWeight:700,color:"#F97316",minWidth:50}}>{ing.amount}</span>
              <span style={{color:"#9CA3AF",minWidth:80}}>{ing.unit}</span>
              <span style={{color:"#374151"}}>{ing.name}</span>
            </div>
          ))}
        </div>
      </div>

      {recipe.steps&&recipe.steps.length>0&&(
        <div>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:14,color:"#111",textAlign:"left"}}>Preparación</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {(Array.isArray(recipe.steps)?recipe.steps:recipe.steps.split("\n").filter(s=>s.trim())).map((step,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",background:"#F9FAFB",borderRadius:10,textAlign:"left"}}>
                <span style={{fontWeight:800,color:"#F97316",fontSize:16,minWidth:24,flexShrink:0}}>{i+1}.</span>
                <span style={{fontSize:14,color:"#374151",lineHeight:1.7}}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditIngredientsModal open={editIngOpen} onClose={()=>setEditIngOpen(false)} ingredients={recipe.ingredients} onSave={ings=>onUpdate({...recipe,ingredients:ings})}/>
      <AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)} recipe={recipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset}/>
    </div>
  );
}

function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,setWeekMenu,currentWeekOffset,apiKey,onNeedKey,detailId,setDetailId}){
  const [addOpen,setAddOpen]=useState(false);
  const detail=detailId?recipes.find(r=>r.id===detailId)||null:null;
  function setDetail(r){if(setDetailId)setDetailId(r?r.id:null);}
  const [addMenuRecipe,setAddMenuRecipe]=useState(null);
  const [search,setSearch]=useState("");
  const [filterMeal,setFilterMeal]=useState("Todas");
  const [filterType,setFilterType]=useState("Todos los tipos");

  if(detail){const live=recipes.find(r=>r.id===detail.id)||detail;return<RecipeDetail recipe={live} onBack={()=>setDetail(null)} onDelete={id=>{onDelete(id);setDetail(null)}} onUpdate={onUpdate} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset}/>;}

  const filtered=recipes.filter(r=>r.title.toLowerCase().includes(search.toLowerCase())&&(filterMeal==="Todas"||r.mealType===filterMeal)&&(filterType==="Todos los tipos"||r.recipeType===filterType));

  return(
    <div style={{padding:"24px 20px"}}>
      <div style={{marginBottom:6}}>
        <h1 style={{margin:"0 0 4px",fontSize:26,fontWeight:800,color:"#111"}}>Nuestras Recetas</h1>
        <p style={{margin:"0 0 10px",color:"#9CA3AF",fontSize:13}}>{recipes.length} recetas guardadas</p>
        <button onClick={()=>setAddOpen(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",background:"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"}}>+ Añadir Receta</button>
      </div>
      <div style={{margin:"12px 0"}}>
        <div style={{marginBottom:8}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar recetas..." style={{...inputStyle,padding:"10px 14px"}}/></div>
        <div style={{display:"flex",gap:8}}>
          <select value={filterMeal} onChange={e=>setFilterMeal(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todas">Todas</option>{MEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todos los tipos">Todos los tipos</option>{RECIPE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
        {filtered.map(r=><RecipeCard key={r.id} recipe={r} onOpen={setDetail} onDelete={onDelete} onAddMenu={setAddMenuRecipe} onUpdate={onUpdate}/>)}
        {filtered.length===0&&(<div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px",color:"#9CA3AF"}}><div style={{fontSize:48,marginBottom:12}}>🍽️</div><p style={{fontSize:16}}>No hay recetas. ¡Añade la primera!</p></div>)}
      </div>
      <AddRecipeModal open={addOpen} onClose={()=>setAddOpen(false)} onAdd={r=>{onAdd(r);setAddOpen(false)}} apiKey={apiKey} onNeedKey={()=>{setAddOpen(false);onNeedKey();}}/>
      {addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset}/>}
    </div>
  );
}

function WeeklyMenuPage({recipes,weekMenu,setWeekMenu}){
  const [weekOffset,setWeekOffset]=useState(0);
  const [copyOpen,setCopyOpen]=useState(false);
  const [addRecipeModal,setAddRecipeModal]=useState(null);
  const [recipePickerOpen,setRecipePickerOpen]=useState(false);
  const [searchPicker,setSearchPicker]=useState("");
  const key=getWeekKey(weekOffset);
  const menu=weekMenu[key]||{};

  function removeFromMenu(day,slot,id){setWeekMenu(prev=>{const w={...(prev[key]||{})};w[day]={...(w[day]||{})};w[day][slot]=(w[day][slot]||[]).filter(r=>r.id!==id);return{...prev,[key]:w};});}
  function addToMenu(recipe){if(!addRecipeModal)return;const{day,slot}=addRecipeModal;setWeekMenu(prev=>{const w={...(prev[key]||{})};w[day]={...(w[day]||{})};w[day][slot]=w[day][slot]||[];if(!w[day][slot].find(r=>r.id===recipe.id))w[day][slot]=[...w[day][slot],recipe];return{...prev,[key]:w};});setRecipePickerOpen(false);setAddRecipeModal(null);}
  function buildWhatsApp(){let txt="🍽️ Menu Semanal - "+getWeekDates(weekOffset)+"\n\n";DAYS.forEach(day=>{const slots=menu[day];if(!slots)return;txt+=day+"\n";MEAL_SLOTS.forEach(slot=>{const items=slots[slot];if(items&&items.length)txt+="  "+slot+": "+items.map(r=>r.title).join(", ")+"\n";});txt+="\n";});window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");}
  const filteredPicker=recipes.filter(r=>r.title.toLowerCase().includes(searchPicker.toLowerCase()));

  // Get week start date for display
  const now=new Date();
  const day=now.getDay();
  const diff=now.getDate()-day+(day===0?-6:1);
  const weekStart=new Date(new Date().setDate(diff+weekOffset*7));
  const weekLabel=weekStart.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"});

  return(
    <div style={{padding:"24px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#111"}}>Menú Semanal</h1>
          <p style={{margin:"4px 0 0",color:"#9CA3AF",fontSize:13}}>Planifica tus comidas de la semana</p>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>setCopyOpen(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",color:"#111"}}>📋 Copiar semana</button>
          <button onClick={buildWhatsApp} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#25D366",color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer"}}>💬 WhatsApp</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,justifyContent:"center"}}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:700,fontSize:16,color:"#111"}}>{getWeekDates(weekOffset)}</div>
          <div style={{fontSize:12,color:"#9CA3AF"}}>{weekLabel}</div>
        </div>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>›</button>
      </div>
      <div style={{borderRadius:16,overflow:"hidden",border:"1.5px solid #E5E7EB",background:"#fff"}}>
        <div style={{display:"grid",gridTemplateColumns:"110px 1fr 1fr"}}>
          <div style={{padding:"14px 16px",background:"#F9FAFB"}}></div>
          {MEAL_SLOTS.map(s=><div key={s} style={{padding:"14px 16px",background:"#F9FAFB",fontWeight:700,fontSize:14,color:"#374151",borderLeft:"1px solid #E5E7EB",textAlign:"center"}}>{s}</div>)}
        </div>
        {DAYS.map(day=>(
          <div key={day} style={{display:"grid",gridTemplateColumns:"110px 1fr 1fr",borderTop:"1px solid #E5E7EB"}}>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",background:"#FAFAFA",fontWeight:700,fontSize:13,color:"#374151"}}>{day}</div>
            {MEAL_SLOTS.map(slot=>{const items=menu[day]?.[slot]||[];return(
              <div key={slot} style={{padding:"10px",borderLeft:"1px solid #E5E7EB",minHeight:60}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{
                  e.preventDefault();
                  try{
                    const {recipe:r,fromDay,fromSlot}=JSON.parse(e.dataTransfer.getData("recipe"));
                    if(fromDay===day&&fromSlot===slot)return;
                    saveMenuToSupabase(prev=>{
                      const w=JSON.parse(JSON.stringify(prev[key]||{}));
                      w[fromDay]=w[fromDay]||{};w[fromDay][fromSlot]=(w[fromDay][fromSlot]||[]).filter(x=>x.id!==r.id);
                      w[day]=w[day]||{};w[day][slot]=w[day][slot]||[];
                      if(!w[day][slot].find(x=>x.id===r.id))w[day][slot]=[...w[day][slot],r];
                      return{...prev,[key]:w};
                    });
                  }catch(e){}
                }}>
                {items.map(r=>(<div key={r.id} draggable onDragStart={e=>{e.dataTransfer.setData("recipe",JSON.stringify({recipe:r,fromDay:day,fromSlot:slot}));}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#F3F4F6",borderRadius:8,marginBottom:6,fontSize:12,cursor:"grab"}}>
                  <span style={{color:"#C4C4C4",fontSize:10,marginRight:2}}>⠿</span>
                  <span style={{flex:1,fontWeight:500,color:"#111"}}>{r.title}</span>
                  <button onClick={()=>removeFromMenu(day,slot,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14,padding:2}}>×</button>
                </div>))}
                <button onClick={()=>{setAddRecipeModal({day,slot});setRecipePickerOpen(true);setSearchPicker("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:22,width:"100%",padding:"2px"}}>+</button>
              </div>
            );})}
          </div>
        ))}
      </div>
      <CopyWeekModal open={copyOpen} onClose={()=>setCopyOpen(false)} weekMenu={weekMenu} currentWeekOffset={weekOffset} setWeekMenu={setWeekMenu}/>
      <Modal open={recipePickerOpen} onClose={()=>{setRecipePickerOpen(false);setAddRecipeModal(null);}} title={"Añadir - "+(addRecipeModal?.day||"")+" "+(addRecipeModal?.slot||"")} width={480}>
        <input value={searchPicker} onChange={e=>setSearchPicker(e.target.value)} placeholder="Buscar receta..." style={{...inputStyle,marginBottom:14}}/>
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:"50vh",overflowY:"auto"}}>
          {filteredPicker.map(r=>(<button key={r.id} onClick={()=>addToMenu(r)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#F9FAFB",border:"1.5px solid transparent",borderRadius:10,cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#F97316"} onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
            {r.image?<img src={r.image} style={{width:40,height:40,borderRadius:8,objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<div style={{width:40,height:40,borderRadius:8,background:"#E5E7EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🍽️</div>}
            <div><div style={{fontWeight:600,fontSize:14,color:"#111"}}>{r.title}</div><div style={{fontSize:12,color:"#9CA3AF"}}>{r.mealType} · {r.recipeType}</div></div>
          </button>))}
          {filteredPicker.length===0&&<p style={{textAlign:"center",color:"#9CA3AF",padding:20}}>No hay recetas guardadas</p>}
        </div>
      </Modal>
    </div>
  );
}

function ShoppingListPage({weekMenu,recipes}){
  const [weekOffset,setWeekOffset]=useState(0);
  const [checked,setChecked]=useState({});
  const [extraItems,setExtraItems]=useState([]);
  const [newItem,setNewItem]=useState("");
  const [editItem,setEditItem]=useState(null);
  const key=getWeekKey(weekOffset);
  const menu=weekMenu[key]||{};

  const ingredientMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const rawName=ing.name.trim();const k=rawName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();const capName=rawName.charAt(0).toUpperCase()+rawName.slice(1);const amt=parseFloat(String(ing.amount).replace(",",".").replace(/[^\d.]/g,""))||0;const unit=(ing.unit||"").toLowerCase().trim();if(!ingredientMap[k]){ingredientMap[k]={id:k,name:capName,amount:amt>0?String(amt):(ing.amount||""),unit:ing.unit||"",category:guessCategory(rawName),totalAmount:amt,unitKey:unit};}else{const ex=ingredientMap[k];if(ex.unitKey===unit&&amt>0){ex.totalAmount=(ex.totalAmount||0)+amt;ex.amount=String(Math.round(ex.totalAmount*10)/10);}}});});});});

  const allItems=[...Object.values(ingredientMap),...extraItems].sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const grouped={};SHOPPING_CATEGORIES.forEach(c=>{grouped[c.id]=[];});
  allItems.forEach(item=>{const cat=item.category||"otros";if(grouped[cat])grouped[cat].push(item);else grouped["otros"].push(item);});
  const checkedCount=allItems.filter(i=>checked[i.id]).length;

  function buildWhatsApp(){let txt="🛒 Lista de la Compra\n\n";SHOPPING_CATEGORIES.forEach(c=>{const items=grouped[c.id];if(!items.length)return;txt+=c.emoji+" "+c.label+"\n";items.forEach(i=>{txt+="  - "+i.name+(i.amount?" ("+i.amount+" "+i.unit+")":"")+"\n";});txt+="\n";});window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");}
  function copyList(){let txt="";SHOPPING_CATEGORIES.forEach(c=>{const items=grouped[c.id];if(!items.length)return;txt+=c.label+":\n";items.forEach(i=>{txt+="  - "+i.name+(i.amount?" ("+i.amount+" "+i.unit+")":"")+"\n";});txt+="\n";});navigator.clipboard.writeText(txt).catch(()=>{});}
  function addExtra(){if(!newItem.trim())return;setExtraItems(p=>[...p,{id:"extra-"+Date.now(),amount:"",unit:"",name:newItem.trim(),category:guessCategory(newItem)}]);setNewItem("");}

  return(
    <div style={{padding:"24px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#111"}}>Lista de Compra</h1>
          <p style={{margin:"4px 0 0",color:"#9CA3AF",fontSize:13}}>Cantidades ajustadas para 4 personas</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={buildWhatsApp} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#25D366",color:"#fff",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer"}}>💬 WhatsApp</button>
          <button onClick={copyList} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#fff",border:"1.5px solid #E5E7EB",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer",color:"#111"}}>📋 Copiar lista</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,justifyContent:"center"}}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>‹</button>
        <div style={{fontWeight:700,fontSize:15,color:"#111"}}>{getWeekDates(weekOffset)}</div>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>›</button>
      </div>
      {checkedCount>0&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,padding:"12px 16px",background:"#F0FDF4",borderRadius:10}}>
          <span style={{color:"#16A34A",fontWeight:600,fontSize:14}}>✓ {checkedCount} marcados</span>
          <button onClick={()=>{const ids=Object.entries(checked).filter(([,v])=>v).map(([k])=>k);setExtraItems(p=>p.filter(i=>!ids.includes(i.id)));setChecked(p=>{const n={...p};ids.forEach(id=>delete n[id]);return n;});}} style={{display:"flex",alignItems:"center",gap:6,background:"#FEE2E2",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",color:"#EF4444",fontWeight:600,fontSize:13}}>🗑️ Eliminar todos</button>
        </div>
      )}
      <div style={{display:"flex",gap:10,marginBottom:24}}>
        <input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Añadir alimento..." onKeyDown={e=>e.key==="Enter"&&addExtra()} style={{...inputStyle,flex:1}}/>
        <button onClick={addExtra} style={{padding:"12px 18px",background:"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:18,cursor:"pointer"}}>+</button>
      </div>
      {SHOPPING_CATEGORIES.map(cat=>{
        const items=grouped[cat.id];if(!items.length)return null;
        return(
          <div key={cat.id} style={{marginBottom:20}}>
            <h3 style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#9CA3AF",letterSpacing:.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:6,textAlign:"left"}}>
              {cat.emoji} {cat.label}
            </h3>
            <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #E5E7EB",overflow:"hidden"}}>
              {items.map((item,idx)=>(
                <div key={item.id}>
                  {idx>0&&<div style={{height:1,background:"#F3F4F6",margin:"0 16px"}}/>}
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
                    <button onClick={()=>setChecked(p=>({...p,[item.id]:!p[item.id]}))}
                      style={{width:22,height:22,borderRadius:50,border:"2px solid "+(checked[item.id]?"#F97316":"#D1D5DB"),background:checked[item.id]?"#F97316":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {checked[item.id]&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
                    </button>
                    <span style={{flex:1,fontSize:14,fontWeight:500,color:checked[item.id]?"#9CA3AF":"#111",textDecoration:checked[item.id]?"line-through":"none",textAlign:"left"}}>
                      {item.name}
                      {item.amount&&<span style={{color:"#9CA3AF",fontWeight:400,marginLeft:6}}>({item.amount} {item.unit})</span>}
                    </span>
                    {checked[item.id]
                      ?<button onClick={()=>{setExtraItems(p=>p.filter(i=>i.id!==item.id));setChecked(p=>{const n={...p};delete n[item.id];return n;});}} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:16}}>🗑️</button>
                      :<button onClick={()=>setEditItem({...item})} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:16}}>✏️</button>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {allItems.length===0&&(<div style={{textAlign:"center",padding:"60px",color:"#9CA3AF"}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><p>Añade recetas al menú semanal para generar la lista automáticamente</p></div>)}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Editar ingrediente" width={400}>
        {editItem&&(<>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <div style={{flex:1}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Cantidad</label><input value={editItem.amount} onChange={e=>setEditItem(p=>({...p,amount:e.target.value}))} style={{...inputStyle}}/></div>
            <div style={{flex:1}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Unidad</label><input value={editItem.unit} onChange={e=>setEditItem(p=>({...p,unit:e.target.value}))} style={{...inputStyle}}/></div>
          </div>
          <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Nombre</label><input value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))} style={{...inputStyle}}/></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setEditItem(null)} style={{flex:1,padding:"11px",background:"#F3F4F6",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,color:"#111"}}>Cancelar</button>
            <button onClick={()=>{setExtraItems(prev=>{const idx=prev.findIndex(i=>i.id===editItem.id);if(idx>=0){const next=[...prev];next[idx]=editItem;return next;}return prev;});setEditItem(null);}} style={{flex:1,padding:"11px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700}}>Guardar</button>
          </div>
        </>)}
      </Modal>
    </div>
  );
}

const LogoSVG = () => (
  <img src="data:image/jpeg;base64,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" alt="Cocina Casa" style={{width:44,height:44,borderRadius:8,objectFit:"cover"}}/>
);

function useIsMobile(){
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener('resize',h);
    return()=>window.removeEventListener('resize',h);
  },[]);
  return isMobile;
}



export default function App(){
  const [page,setPage]=useState("recetas");
  const [recipes,setRecipes]=useState([]);
  const [weekMenu,setWeekMenu]=useState({});
  const [loading,setLoading]=useState(true);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("cocina_api_key")||"");
  const [apiKeyOpen,setApiKeyOpen]=useState(false);
  const currentWeekOffset=0;

  // Load recipes from Supabase
  useEffect(()=>{
    async function loadData(){
      setLoading(true);
      try{
        const {data:recs}=await supabase.from("recipes").select("*").order("created_at",{ascending:false});
        if(recs)setRecipes(recs.map(r=>({
          id:r.id,title:r.title,description:r.description,image:r.image,
          mealType:r.meal_type,recipeType:r.recipe_type,
          ingredients:r.ingredients||[],steps:r.steps||[],
          sourceUrl:r.source_url,time:r.time,servings:r.servings,rating:r.rating||0
        })));
        const {data:menu}=await supabase.from("week_menu").select("*");
        if(menu){
          const menuObj={};
          menu.forEach(m=>{
            if(!menuObj[m.week_key])menuObj[m.week_key]={};
            if(!menuObj[m.week_key][m.day])menuObj[m.week_key][m.day]={};
            if(!menuObj[m.week_key][m.day][m.slot])menuObj[m.week_key][m.day][m.slot]=[];
            if(m.recipe_data)menuObj[m.week_key][m.day][m.slot].push(m.recipe_data);
          });
          setWeekMenu(menuObj);
        }
      }catch(e){console.error("Error loading:",e);}
      setLoading(false);
    }
    loadData();
  },[]);

  async function addRecipe(r){
    const {error}=await supabase.from("recipes").insert({
      id:r.id,title:r.title,description:r.description,image:r.image,
      meal_type:r.mealType,recipe_type:r.recipeType,
      ingredients:r.ingredients,steps:r.steps,
      source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0
    });
    if(!error)setRecipes(p=>[r,...p]);
  }

  async function deleteRecipe(id){
    await supabase.from("recipes").delete().eq("id",id);
    await supabase.from("week_menu").delete().eq("recipe_id",id);
    setRecipes(p=>p.filter(r=>r.id!==id));
  }

  async function updateRecipe(r){
    await supabase.from("recipes").update({
      title:r.title,description:r.description,image:r.image,
      meal_type:r.mealType,recipe_type:r.recipeType,
      ingredients:r.ingredients,steps:r.steps,
      source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0
    }).eq("id",r.id);
    setRecipes(p=>p.map(x=>x.id===r.id?r:x));
  }

  const navItems=[
    {id:"recetas",label:"Recetas",icon:"📖"},
    {id:"menu",label:"Menú Semanal",icon:"📅"},
    {id:"compra",label:"Lista de Compra",icon:"🛒"},
  ];
  const [detailId,setDetailId]=useState(null);
  const isMobile=useIsMobile();
  const [sidebarOpen,setSidebarOpen]=useState(false);

  async function saveMenuToSupabase(newMenuOrFn){
    const newMenu=typeof newMenuOrFn==="function"?newMenuOrFn(weekMenu):newMenuOrFn;
    setWeekMenu(newMenu);
    // Sync to Supabase - delete all and reinsert
    try{
      await supabase.from("week_menu").delete().neq("id","00000000-0000-0000-0000-000000000000");
      const rows=[];
      Object.entries(newMenu).forEach(([weekKey,days])=>{
        Object.entries(days).forEach(([day,slots])=>{
          Object.entries(slots).forEach(([slot,recipeList])=>{
            recipeList.forEach(r=>{
              rows.push({week_key:weekKey,day,slot,recipe_id:r.id,recipe_data:r});
            });
          });
        });
      });
      if(rows.length>0)await supabase.from("week_menu").insert(rows);
    }catch(e){console.error("Error saving menu:",e);}
  }

  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#F8F7F4",overflow:"hidden",position:"fixed",top:0,left:0}}>
      {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:99}}/>}
      {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:99}}/>}
      <div style={{width:210,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0,position:isMobile?"fixed":"relative",top:isMobile?0:"auto",left:isMobile?(sidebarOpen?0:-210):"auto",height:isMobile?"100vh":"auto",zIndex:isMobile?100:"auto",transition:"left .25s",boxShadow:isMobile&&sidebarOpen?"4px 0 20px rgba(0,0,0,.15)":"none"}}>
        <div style={{padding:"16px 16px 14px",borderBottom:"1px solid #F3F4F6"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <LogoSVG/>
            <div>
              <div style={{fontWeight:800,fontSize:13,color:"#111",letterSpacing:.5}}>COCINA CASA</div>
              <div style={{fontSize:10,color:"#9CA3AF",letterSpacing:.3}}>MENÚ SEMANAL</div>
            </div>
          </div>
        </div>
        <nav style={{padding:"10px 10px",flex:1}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",borderRadius:10,border:"none",background:page===item.id?"#F97316":"transparent",color:page===item.id?"#fff":"#374151",fontWeight:page===item.id?700:500,fontSize:14,cursor:"pointer",marginBottom:4,textAlign:"left"}}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"6px 12px 4px"}}>
          <p style={{margin:0,fontSize:10,color:"#C4C4C4",lineHeight:1.6,textAlign:"center"}}>© Jesús Cortijo<br/>Abril 2026</p>
        </div>
        <div style={{padding:"4px 10px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",background:apiKey?"#F0FDF4":"#FFF7ED",color:apiKey?"#16A34A":"#F97316",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            {apiKey?"✅ API Key OK":"⚙️ Configurar API Key"}
          </button>
        </div>
      </div>
      <div data-scroll="true" id="main-scroll" style={{flex:1,overflowY:"auto",minWidth:0}}>
        {isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{position:"fixed",top:12,right:12,zIndex:98,background:"#F97316",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",color:"#fff",fontSize:20,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>☰</button>}
        {isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{position:"fixed",top:12,right:12,zIndex:98,background:"#F97316",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",color:"#fff",fontSize:20,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>☰</button>}
        {loading?(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><div style={{fontSize:48}}>🍳</div><p style={{color:"#9CA3AF"}}>Cargando...</p></div>):page==="recetas"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} setWeekMenu={saveMenuToSupabase} currentWeekOffset={currentWeekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId}/>}
        {!loading&&page==="menu"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} setWeekMenu={saveMenuToSupabase}/>}
        {!loading&&page==="compra"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes}/>}
      </div>
      <ApiKeyModal open={apiKeyOpen} onClose={()=>setApiKeyOpen(false)} apiKey={apiKey} setApiKey={setApiKey}/>
    </div>
  );
}