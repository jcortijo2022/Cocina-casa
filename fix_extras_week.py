content = open('src/App.jsx').read()
fixes = []

old1 = '        const {data:extrasData}=await supabase.from("shopping_extras").select("*");\n        if(extrasData)setExtras(extrasData.map(e=>({id:e.id,name:e.name,amount:e.amount||"",unit:e.unit||"",category:e.category||"otros"})));'
new1 = '        const {data:extrasData}=await supabase.from("shopping_extras").select("*");\n        if(extrasData)setExtras(extrasData.map(e=>({id:e.id,name:e.name,amount:e.amount||"",unit:e.unit||"",category:e.category||"otros",weekKey:e.week_key||""})));'
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("load extras with weekKey")

old2 = 'function addExtra(){if(!newItem.trim())return;const n=cap(newItem.trim());const item={id:"ex-"+Date.now(),name:n,amount:"",unit:"",category:guessCategory(n)};setExtras(p=>[...p,item]);supabase.from("shopping_extras").insert({id:item.id,name:item.name,amount:item.amount,unit:item.unit,category:item.category}).then(()=>{});setNewItem("");}'
new2 = 'function addExtra(){if(!newItem.trim())return;const n=cap(newItem.trim());const item={id:"ex-"+Date.now(),name:n,amount:"",unit:"",category:guessCategory(n),weekKey:key};setExtras(p=>[...p,item]);supabase.from("shopping_extras").insert({id:item.id,name:item.name,amount:item.amount,unit:item.unit,category:item.category,week_key:key}).then(()=>{});setNewItem("");}'
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("addExtra saves with week_key")

old3 = '  const weekDeletedKeys=(deletedByWeek||{})[key]||[];\n  const allItems=[...Object.values(ingMap).filter(i=>!weekDeletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,"es"));'
new3 = '  const weekDeletedKeys=(deletedByWeek||{})[key]||[];\n  const weekExtras=(extras||[]).filter(e=>!e.weekKey||e.weekKey===key);\n  const allItems=[...Object.values(ingMap).filter(i=>!weekDeletedKeys.includes(i.id)),...weekExtras].sort((a,b)=>a.name.localeCompare(b.name,"es"));'
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("filter extras by week")

old4 = ':<button onClick={()=>setEditItem({...item})} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14}}>✏️</button>}'
new4 = ':<button onClick={()=>setEditItem({...item,amount:item.amount||(item.amounts?item.amounts.join(", "):""),unit:item.unit||""})} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14}}>✏️</button>}'
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("edit button normalizes amounts")

old5 = 'setExtras(p=>{const idx=p.findIndex(i=>i.id===editItem.id);if(idx>=0){const n=[...p];n[idx]=editItem;return n;}return p;});setEditItem(null);'
new5 = 'setExtras(p=>{const idx=p.findIndex(i=>i.id===editItem.id);if(idx>=0){const n=[...p];n[idx]={...editItem,amounts:[editItem.amount].filter(Boolean)};supabase.from("shopping_extras").update({name:editItem.name,amount:editItem.amount,unit:editItem.unit}).eq("id",editItem.id).then(()=>{});return n;}return p;});setEditItem(null);'
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("save edit handles both types")

old6 = 'setExtras(p=>p.filter(i=>i.id!==item.id));deleteItem(item.id);setChecked(p=>{const n={...p};delete n[item.id];return n;});'
new6 = 'supabase.from("shopping_extras").delete().eq("id",item.id).then(()=>{});setExtras(p=>p.filter(i=>i.id!==item.id));deleteItem(item.id);setChecked(p=>{const n={...p};delete n[item.id];return n;});'
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("delete extra from Supabase")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
