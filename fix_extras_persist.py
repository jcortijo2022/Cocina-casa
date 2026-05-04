content = open('src/App.jsx').read()
fixes = []

old1 = "        const {data:deleted}=await supabase.from(\"shopping_deleted\").select(\"id,week_key\");"
new1 = "        const {data:deleted}=await supabase.from(\"shopping_deleted\").select(\"id,week_key\");\n        const {data:extrasData}=await supabase.from(\"shopping_extras\").select(\"*\");\n        if(extrasData)setExtras(extrasData.map(e=>({id:e.id,name:e.name,amount:e.amount||'',unit:e.unit||'',category:e.category||'otros'})));"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("load extras from Supabase")

old3 = "  const [deletedByWeek,setDeletedByWeek]=useState({});"
new3 = "  const [deletedByWeek,setDeletedByWeek]=useState({});\n  const [extras,setExtras]=useState([]);"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("extras state in App")

old2 = "  const [checked,setChecked]=useState({});\n  const [extras,setExtras]=useState([]);"
new2 = "  const [checked,setChecked]=useState({});"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("removed extras from ShoppingListPage")

old4 = "{page===\"compra\"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes} deletedByWeek={deletedByWeek} setDeletedByWeek={setDeletedByWeek}/>"
new4 = "{page===\"compra\"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes} deletedByWeek={deletedByWeek} setDeletedByWeek={setDeletedByWeek} extras={extras} setExtras={setExtras}/>"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("extras passed to ShoppingListPage")

old5 = "function ShoppingListPage({weekMenu,recipes,deletedByWeek,setDeletedByWeek}){"
new5 = "function ShoppingListPage({weekMenu,recipes,deletedByWeek,setDeletedByWeek,extras,setExtras}){"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("ShoppingListPage accepts extras")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
