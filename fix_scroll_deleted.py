#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# 1. Fix scroll - add paddingBottom to ShoppingListPage and WeeklyMenuPage main divs
old1 = '    <div style={{padding:"18px 16px"}}>\n      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>\n        <div><h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#111"}}>Menu Semanal</h1></div>'
new1 = '    <div style={{padding:"18px 16px",paddingBottom:80}}>\n      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>\n        <div><h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#111"}}>Menu Semanal</h1></div>'
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("WeeklyMenuPage paddingBottom")

old2 = '    <div style={{padding:"18px 16px"}}>\n      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>\n        <div><h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#111"}}>Lista de Compra</h1>'
new2 = '    <div style={{padding:"18px 16px",paddingBottom:80}}>\n      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>\n        <div><h1 style={{margin:0,fontSize:24,fontWeight:800,color:"#111"}}>Lista de Compra</h1>'
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("ShoppingListPage paddingBottom")

# 2. Fix deleted items - the real issue is normalizeIngKey is used for grouping
# but the deleted key stored is the normalized key from the UI item
# When recipe re-added, clearRecipeDeletedItems uses normalizeIngKey on ingredient names
# which should match. Let's verify the flow and simplify.

# The simplest fix: when a recipe is RE-ADDED to the menu for a week,
# remove from shopping_deleted all keys that belong to that recipe's ingredients
# We need to make sure normalizeIngKey is called the same way in both places

# Find clearRecipeDeletedItems and verify it uses normalizeIngKey correctly
idx = content.find("function clearRecipeDeletedItems(")
if idx >= 0:
    end = content.find("\n  }", idx) + 4
    old_func = content[idx:end]
    new_func = """function clearRecipeDeletedItems(recipe,weekKey){
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
  }"""
    content = content[:idx] + new_func + content[end:]
    fixes.append("clearRecipeDeletedItems improved")

# 3. Also pass onClearDeleted to WeeklyMenuPage's picker AddToMenuModal
# Find WeeklyMenuPage's AddToMenuModal call in the recipe picker
old3 = "<Modal open={pickerOpen} onClose={()=>{setPickerOpen(false);setPickerTarget(null);}} title={\"Anadir - \"+(pickerTarget?.day||\"\")+\" \"+(pickerTarget?.slot||\"\")} width={460}>"
# The issue is WeeklyMenuPage doesn't receive onClearDeleted
# Add it to WeeklyMenuPage
old4 = "function WeeklyMenuPage({recipes,weekMenu,saveMenu,onUseRecipe,getUseCount}){"
new4 = "function WeeklyMenuPage({recipes,weekMenu,saveMenu,onUseRecipe,getUseCount,onClearDeleted}){"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("WeeklyMenuPage accepts onClearDeleted")
else:
    old4b = "function WeeklyMenuPage({recipes,weekMenu,saveMenu,onUseRecipe}){"
    new4b = "function WeeklyMenuPage({recipes,weekMenu,saveMenu,onUseRecipe,onClearDeleted}){"
    if old4b in content:
        content = content.replace(old4b, new4b)
        fixes.append("WeeklyMenuPage accepts onClearDeleted (v2)")

# Pass from App to WeeklyMenuPage
old5 = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount}/>"
new5 = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount} onClearDeleted={clearRecipeDeletedItems}/>"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("App passes onClearDeleted to WeeklyMenuPage")
else:
    old5b = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount}/>"
    new5b = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount} onClearDeleted={clearRecipeDeletedItems}/>"
    if old5b in content:
        content = content.replace(old5b, new5b)
        fixes.append("App passes onClearDeleted to WeeklyMenuPage (v2)")

# 4. In WeeklyMenuPage addToMenu function, call onClearDeleted
old6 = "  function addToMenu(recipe){\n    if(!pickerTarget)return;\n    const{day,slot}=pickerTarget;\n    const nm=JSON.parse(JSON.stringify(weekMenu));\n    if(!nm[key])nm[key]={};\n    if(!nm[key][day])nm[key][day]={};\n    if(!nm[key][day][slot])nm[key][day][slot]=[];\n    if(!nm[key][day][slot].find(r=>r.id===recipe.id))nm[key][day][slot].push(recipe);\n    saveMenu(nm);\n    setPickerOpen(false);setPickerTarget(null);\n  }"
new6 = "  function addToMenu(recipe){\n    if(!pickerTarget)return;\n    const{day,slot}=pickerTarget;\n    const nm=JSON.parse(JSON.stringify(weekMenu));\n    if(!nm[key])nm[key]={};\n    if(!nm[key][day])nm[key][day]={};\n    if(!nm[key][day][slot])nm[key][day][slot]=[];\n    if(!nm[key][day][slot].find(r=>r.id===recipe.id))nm[key][day][slot].push(recipe);\n    saveMenu(nm);\n    if(onClearDeleted)onClearDeleted(recipe,key);\n    setPickerOpen(false);setPickerTarget(null);\n  }"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("WeeklyMenuPage addToMenu clears deleted")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
