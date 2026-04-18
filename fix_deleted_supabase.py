#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# 1. Replace localStorage deletedKeys with Supabase
old1 = "  const [deletedKeys,setDeletedKeys]=useState(()=>{try{return JSON.parse(localStorage.getItem('cocina_deleted_items')||'[]');}catch{return [];}});"
new1 = "  const [deletedKeys,setDeletedKeys]=useState([]);"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("deletedKeys reset to simple state")

# 2. Load deletedKeys from Supabase on mount - add to existing load() function
old2 = "        const {data:menu}=await supabase.from(\"week_menu\").select(\"*\");"
new2 = "        const {data:deleted}=await supabase.from(\"shopping_deleted\").select(\"id\");\n        if(deleted)setDeletedKeys(deleted.map(d=>d.id));\n        const {data:menu}=await supabase.from(\"week_menu\").select(\"*\");"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("load deletedKeys from Supabase")

# 3. Fix single item delete - save to Supabase
old3 = "setDeletedKeys(p=>{const n=[...p,item.id];localStorage.setItem('cocina_deleted_items',JSON.stringify(n));return n;});"
new3 = "setDeletedKeys(p=>{const n=[...p,item.id];supabase.from('shopping_deleted').insert({id:item.id}).then(()=>{});return n;});"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("single delete saves to Supabase")

# 4. Fix bulk delete - save to Supabase
old4 = "setDeletedKeys(p=>{const n=[...new Set([...p,...ids])];localStorage.setItem('cocina_deleted_items',JSON.stringify(n));return n;});"
new4 = "setDeletedKeys(p=>{const n=[...new Set([...p,...ids])];supabase.from('shopping_deleted').upsert(ids.map(id=>({id}))).then(()=>{});return n;});"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("bulk delete saves to Supabase")

# 5. Fix clearDeleted - also clear from Supabase
old5 = "  function clearDeleted(){setDeletedKeys([]);localStorage.removeItem('cocina_deleted_items');}"
new5 = "  function clearDeleted(){setDeletedKeys([]);supabase.from('shopping_deleted').delete().neq('id','__none__').then(()=>{});}"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("clearDeleted uses Supabase")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
