#!/usr/bin/env python3
# fix_v13.py

content = open('src/App.jsx').read()
fixes = []

# 1. Week starts on Saturday instead of Monday
old1 = "function getWeekKey(off=0){const n=new Date();const d=n.getDay();const diff=n.getDate()-d+(d===0?-6:1);const m=new Date(new Date().setDate(diff+off*7));return m.toISOString().split(\"T\")[0];}"
new1 = "function getWeekKey(off=0){const n=new Date();const d=n.getDay();const diff=n.getDate()-d+(d===0?1:d===6?0:-d+6-7+1);const sat=new Date(n);sat.setDate(n.getDate()+(6-((n.getDay()+1)%7)%7)+off*7- (6-((n.getDay()+1)%7)%7 - (6-((n.getDay()+1)%7)%7)));const m=new Date(n.setDate(n.getDate()-((n.getDay()+1)%7)+off*7));return m.toISOString().split(\"T\")[0];}"
# Better approach - Saturday=6, find last Saturday
old1 = "function getWeekKey(off=0){const n=new Date();const d=n.getDay();const diff=n.getDate()-d+(d===0?-6:1);const m=new Date(new Date().setDate(diff+off*7));return m.toISOString().split(\"T\")[0];}"
new1 = """function getWeekKey(off=0){
  const n=new Date();
  const day=n.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diffToSat=day===6?0:-(day+1); // days back to last Saturday
  const sat=new Date(n);
  sat.setDate(n.getDate()+diffToSat+off*7);
  sat.setHours(0,0,0,0);
  return sat.toISOString().split("T")[0];
}"""
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("week starts Saturday - getWeekKey")

old2 = "function getWeekDates(off=0){const n=new Date();const d=n.getDay();const diff=n.getDate()-d+(d===0?-6:1);const mon=new Date(new Date().setDate(diff+off*7));const sun=new Date(mon);sun.setDate(mon.getDate()+6);const f=x=>x.toLocaleDateString(\"es-ES\",{day:\"numeric\",month:\"short\"});return f(mon)+\" - \"+f(sun);}"
new2 = """function getWeekDates(off=0){
  const n=new Date();
  const day=n.getDay();
  const diffToSat=day===6?0:-(day+1);
  const sat=new Date(n);
  sat.setDate(n.getDate()+diffToSat+off*7);
  sat.setHours(0,0,0,0);
  const fri=new Date(sat);
  fri.setDate(sat.getDate()+6);
  const f=x=>x.toLocaleDateString("es-ES",{day:"numeric",month:"short"});
  return f(sat)+" - "+f(fri);
}"""
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("week starts Saturday - getWeekDates")

# 2. Update DAYS to start from Saturday
old3 = 'const DAYS = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];'
new3 = 'const DAYS = ["Sabado","Domingo","Lunes","Martes","Miercoles","Jueves","Viernes"];'
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("DAYS starts Saturday")

# 3. Fix shopping list delete - the issue is ingMap items don't have mutable state
# The delete button calls setExtras but ingMap items aren't in extras
# Fix: separate ingMap items from extras in the UI, only extras can be deleted
# Actually the real fix is: when checked item is from ingMap, we need to track deletedKeys
old4 = "  const [checked,setChecked]=useState({});\n  const [extras,setExtras]=useState([]);"
new4 = "  const [checked,setChecked]=useState({});\n  const [extras,setExtras]=useState([]);\n  const [deletedKeys,setDeletedKeys]=useState([]);"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("deletedKeys state added")

# 4. Filter out deletedKeys from ingMap
old5 = "  const allItems=[...Object.values(ingMap),...extras].sort((a,b)=>a.name.localeCompare(b.name,\"es\"));"
new5 = "  const allItems=[...Object.values(ingMap).filter(i=>!deletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,\"es\"));"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("deletedKeys filter applied")

# 5. Fix delete single item button
old6 = "{checked[item.id]?<button onClick={()=>{setExtras(p=>p.filter(i=>i.id!==item.id));setChecked(p=>{const n={...p};delete n[item.id];return n;});}} style={{background:\"none\",border:\"none\",cursor:\"pointer\",color:\"#EF4444\",fontSize:14}}>🗑️</button>"
new6 = "{checked[item.id]?<button onClick={()=>{setExtras(p=>p.filter(i=>i.id!==item.id));setDeletedKeys(p=>[...p,item.id]);setChecked(p=>{const n={...p};delete n[item.id];return n;});}} style={{background:\"none\",border:\"none\",cursor:\"pointer\",color:\"#EF4444\",fontSize:14}}>🗑️</button>"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("single item delete fixed")

# 6. Fix bulk delete (Eliminar marcados)
old7 = "<button onClick={()=>{const ids=Object.entries(checked).filter(([,v])=>v).map(([k])=>k);setExtras(p=>p.filter(i=>!ids.includes(i.id)));setChecked(p=>{const n={...p};ids.forEach(id=>delete n[id]);return n;});}} style={{background:\"#FEE2E2\",border:\"none\",borderRadius:7,padding:\"6px 11px\",cursor:\"pointer\",color:\"#EF4444\",fontWeight:600,fontSize:12}}>🗑️ Eliminar marcados</button>"
new7 = "<button onClick={()=>{const ids=Object.entries(checked).filter(([,v])=>v).map(([k])=>k);setExtras(p=>p.filter(i=>!ids.includes(i.id)));setDeletedKeys(p=>[...new Set([...p,...ids])]);setChecked({});}} style={{background:\"#FEE2E2\",border:\"none\",borderRadius:7,padding:\"6px 11px\",cursor:\"pointer\",color:\"#EF4444\",fontWeight:600,fontSize:12}}>🗑️ Eliminar marcados</button>"
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("bulk delete fixed")

# 7. Add edit title button in RecipeDetail
old8 = "  const col=MEAL_TYPE_COLORS[recipe.mealType]||MEAL_TYPE_COLORS[\"Otros\"];\n  function upd(f,v){onUpdate({...recipe,[f]:v});}"
new8 = "  const col=MEAL_TYPE_COLORS[recipe.mealType]||MEAL_TYPE_COLORS[\"Otros\"];\n  const [editingTitle,setEditingTitle]=useState(false);\n  const [titleVal,setTitleVal]=useState(recipe.title);\n  useEffect(()=>{setTitleVal(recipe.title);},[recipe.title]);\n  function upd(f,v){onUpdate({...recipe,[f]:v});}"
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("title edit state added")

# 8. Replace static title with editable title in RecipeDetail
old9 = "      <h1 style={{fontSize:22,fontWeight:800,color:\"#111\",marginBottom:6,textAlign:\"left\"}}>{recipe.title}</h1>"
new9 = """      {editingTitle?(
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <input value={titleVal} onChange={e=>setTitleVal(e.target.value)} style={{flex:1,padding:"8px 12px",borderRadius:9,border:"2px solid #F97316",fontSize:18,fontWeight:800,color:"#111",outline:"none"}} autoFocus onKeyDown={e=>{if(e.key==="Enter"){upd("title",titleVal);setEditingTitle(false);}if(e.key==="Escape")setEditingTitle(false);}}/>
          <button onClick={()=>{upd("title",titleVal);setEditingTitle(false);}} style={{padding:"8px 14px",background:"#F97316",color:"#fff",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700}}>✓</button>
          <button onClick={()=>setEditingTitle(false)} style={{padding:"8px 12px",background:"#F3F4F6",border:"none",borderRadius:9,cursor:"pointer",color:"#111"}}>✕</button>
        </div>
      ):(
        <h1 onClick={()=>setEditingTitle(true)} style={{fontSize:22,fontWeight:800,color:"#111",marginBottom:6,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          {recipe.title}<span style={{fontSize:14,color:"#C4C4C4",fontWeight:400}}>✏️</span>
        </h1>
      )}"""
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("editable title in RecipeDetail")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
