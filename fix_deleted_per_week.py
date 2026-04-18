#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# The fix: deletedKeys should be per week_key, not global
# Structure: {week_key: [ingredient_ids]}
# When week changes, different deleted list applies
# When recipe removed from menu, clean its ingredient keys from that week

# 1. Change deletedKeys state to object keyed by week
old1 = "  const [deletedKeys,setDeletedKeys]=useState([]);"
new1 = "  const [deletedByWeek,setDeletedByWeek]=useState({});"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("deletedKeys -> deletedByWeek")

# 2. Load deletedByWeek from Supabase - change structure
old2 = "        const {data:deleted}=await supabase.from(\"shopping_deleted\").select(\"id\");\n        if(deleted)setDeletedKeys(deleted.map(d=>d.id));"
new2 = "        const {data:deleted}=await supabase.from(\"shopping_deleted\").select(\"id,week_key\");\n        if(deleted){const dbw={};deleted.forEach(d=>{if(!dbw[d.week_key])dbw[d.week_key]=[];dbw[d.week_key].push(d.id);});setDeletedByWeek(dbw);}"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("load deletedByWeek from Supabase")

# 3. Pass deletedByWeek to ShoppingListPage
old3 = "{page===\"compra\"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes} deletedKeys={deletedKeys} setDeletedKeys={setDeletedKeys}/>"
new3 = "{page===\"compra\"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes} deletedByWeek={deletedByWeek} setDeletedByWeek={setDeletedByWeek}/>"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("pass deletedByWeek to ShoppingListPage")

# 4. ShoppingListPage accept new props
old4 = "function ShoppingListPage({weekMenu,recipes,deletedKeys,setDeletedKeys}){"
new4 = "function ShoppingListPage({weekMenu,recipes,deletedByWeek,setDeletedByWeek}){"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("ShoppingListPage accepts deletedByWeek")

# 5. Derive deletedKeys from deletedByWeek for current week
old5 = "  const safeDeletedKeys=deletedKeys||[];\n  const allItems=[...Object.values(ingMap).filter(i=>!safeDeletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,\"es\"));"
new5 = "  const weekDeletedKeys=(deletedByWeek||{})[key]||[];\n  const allItems=[...Object.values(ingMap).filter(i=>!weekDeletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,\"es\"));"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("filter by week deleted keys")

# 6. Fix checkedCount to use weekDeletedKeys
old6 = "  const checkedCount=allItems.filter(i=>checked[i.id]).length;"
new6 = "  const checkedCount=allItems.filter(i=>checked[i.id]).length;\n  function deleteItem(itemId){setDeletedByWeek(p=>{const cur=(p[key]||[]);if(cur.includes(itemId))return p;const n={...p,[key]:[...cur,itemId]};supabase.from('shopping_deleted').insert({id:itemId,week_key:key}).then(()=>{});return n;});setChecked(p=>{const n={...p};delete n[itemId];return n;});}"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("deleteItem function added")

# 7. Fix single item delete button to use deleteItem
old7 = "setDeletedKeys(p=>{const n=[...p,item.id];supabase.from('shopping_deleted').insert({id:item.id}).then(()=>{});return n;});"
new7 = "deleteItem(item.id);"
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("single delete uses deleteItem")

# Also fix the combined delete+uncheck button
old8 = "setExtras(p=>p.filter(i=>i.id!==item.id));setDeletedKeys(p=>{const n=[...p,item.id];supabase.from('shopping_deleted').insert({id:item.id}).then(()=>{});return n;});"
new8 = "setExtras(p=>p.filter(i=>i.id!==item.id));deleteItem(item.id);"
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("combined delete uses deleteItem")

# 8. Fix bulk delete
old9 = "setDeletedKeys(p=>{const n=[...new Set([...p,...ids])];supabase.from('shopping_deleted').upsert(ids.map(id=>({id}))).then(()=>{});return n;});"
new9 = "setDeletedByWeek(p=>{const cur=p[key]||[];const n={...p,[key]:[...new Set([...cur,...ids])]};supabase.from('shopping_deleted').upsert(ids.map(id=>({id,week_key:key}))).then(()=>{});return n;});setChecked({});"
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("bulk delete uses week key")

# 9. Fix clearDeleted to only clear current week
old10 = "  function clearDeleted(){setDeletedKeys([]);supabase.from('shopping_deleted').delete().neq('id','__none__').then(()=>{});}"
new10 = "  function clearDeleted(){setDeletedByWeek(p=>{const n={...p};delete n[key];supabase.from('shopping_deleted').delete().eq('week_key',key).then(()=>{});return n;});}"
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("clearDeleted only clears current week")

# 10. Fix restore button to use weekDeletedKeys
old11 = "{deletedKeys.length>0&&<button onClick={clearDeleted}"
new11 = "{weekDeletedKeys.length>0&&<button onClick={clearDeleted}"
if old11 in content:
    content = content.replace(old11, new11)
    fixes.append("restore button uses weekDeletedKeys")

# 11. Update Supabase table to add week_key column - add SQL comment
print("NOTE: Run this SQL in Supabase:")
print("ALTER TABLE shopping_deleted ADD COLUMN IF NOT EXISTS week_key text;")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
