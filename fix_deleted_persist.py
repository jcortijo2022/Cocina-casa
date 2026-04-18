#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# Replace deletedKeys useState with localStorage persistence
old1 = "  const [deletedKeys,setDeletedKeys]=useState([]);"
new1 = "  const [deletedKeys,setDeletedKeys]=useState(()=>{try{return JSON.parse(localStorage.getItem('cocina_deleted_items')||'[]');}catch{return [];}});"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("deletedKeys persisted in localStorage")

# Save to localStorage whenever deletedKeys changes
# Find where we use setDeletedKeys and wrap with save
old2 = "setDeletedKeys(p=>[...p,item.id]);"
new2 = "setDeletedKeys(p=>{const n=[...p,item.id];localStorage.setItem('cocina_deleted_items',JSON.stringify(n));return n;});"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("single delete saves to localStorage")

old3 = "setDeletedKeys(p=>[...new Set([...p,...ids])]);"
new3 = "setDeletedKeys(p=>{const n=[...new Set([...p,...ids])];localStorage.setItem('cocina_deleted_items',JSON.stringify(n));return n;});"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("bulk delete saves to localStorage")

# Also add a "Restaurar eliminados" button near the week navigation
old4 = "  function buildWA(){"
new4 = """  function clearDeleted(){setDeletedKeys([]);localStorage.removeItem('cocina_deleted_items');}

  function buildWA(){"""
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("clearDeleted function added")

# Add restore button next to the week nav arrows
old5 = "      <div style={{display:\"flex\",alignItems:\"center\",gap:12,marginBottom:16,justifyContent:\"center\"}}>\n        <button onClick={()=>setWeekOffset(v=>v-1)} style={{background:\"#F3F4F6\",border:\"none\",borderRadius:8,padding:\"7px 13px\",cursor:\"pointer\",fontSize:18,color:\"#374151\",fontWeight:700}}>‹</button>\n        <span style={{fontWeight:700,fontSize:14,color:\"#111\"}}>{getWeekDates(weekOffset)}</span>\n        <button onClick={()=>setWeekOffset(v=>v+1)} style={{background:\"#F3F4F6\",border:\"none\",borderRadius:8,padding:\"7px 13px\",cursor:\"pointer\",fontSize:18,color:\"#374151\",fontWeight:700}}>›</button>\n      </div>\n      {checkedCount>0"
new5 = """      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,justifyContent:"center"}}>
        <button onClick={()=>setWeekOffset(v=>v-1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>‹</button>
        <span style={{fontWeight:700,fontSize:14,color:"#111"}}>{getWeekDates(weekOffset)}</span>
        <button onClick={()=>setWeekOffset(v=>v+1)} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:18,color:"#374151",fontWeight:700}}>›</button>
        {deletedKeys.length>0&&<button onClick={clearDeleted} style={{background:"#F3F4F6",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:11,color:"#9CA3AF"}}>↺ Restaurar</button>}
      </div>
      {checkedCount>0"""
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("restore button added")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
