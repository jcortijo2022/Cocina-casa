#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# The problem: setDeletedKeys is defined inside ShoppingListPage
# but saveMenu or some other function references it at App level
# Solution: move deletedKeys state to App level

# 1. Remove deletedKeys from ShoppingListPage
old1 = "  const [checked,setChecked]=useState({});\n  const [extras,setExtras]=useState([]);\n  const [deletedKeys,setDeletedKeys]=useState([]);"
new1 = "  const [checked,setChecked]=useState({});\n  const [extras,setExtras]=useState([]);"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("removed deletedKeys from ShoppingListPage")

# 2. Add deletedKeys to App state (after weekMenu state)
old2 = "  const [loadingData,setLoadingData]=useState(true);"
new2 = "  const [loadingData,setLoadingData]=useState(true);\n  const [deletedKeys,setDeletedKeys]=useState([]);"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("deletedKeys added to App state")

# 3. Load deletedKeys in App's load() - already there from previous fix
# Check if it's already loading
if "shopping_deleted" in content:
    fixes.append("shopping_deleted load already present")

# 4. Pass deletedKeys and setDeletedKeys to ShoppingListPage
old4 = "{page===\"compra\"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes}/>"
new4 = "{page===\"compra\"&&<ShoppingListPage weekMenu={weekMenu} recipes={recipes} deletedKeys={deletedKeys} setDeletedKeys={setDeletedKeys}/>"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("deletedKeys passed to ShoppingListPage")

# 5. ShoppingListPage accept deletedKeys props
old5 = "function ShoppingListPage({weekMenu,recipes}){"
new5 = "function ShoppingListPage({weekMenu,recipes,deletedKeys,setDeletedKeys}){"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("ShoppingListPage accepts deletedKeys props")

# 6. Add safety check - if deletedKeys is undefined use empty array
old6 = "  const allItems=[...Object.values(ingMap).filter(i=>!deletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,\"es\"));"
new6 = "  const safeDeletedKeys=deletedKeys||[];\n  const allItems=[...Object.values(ingMap).filter(i=>!safeDeletedKeys.includes(i.id)),...extras].sort((a,b)=>a.name.localeCompare(b.name,\"es\"));"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("safety check for deletedKeys")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
