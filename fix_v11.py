#!/usr/bin/env python3
# fix_v11.py

content = open('src/App.jsx').read()
fixes = []

# 1. Clear inputs on tab change - find the exact TABS line
import re
old1 = "const TABS=[{id:\"buscar\","
idx = content.find(old1)
if idx >= 0:
    # Find end of that line
    end_line = content.find("\n", idx)
    insert = "\n      useEffect(()=>{setUrl(\"\");setQuery(\"\");setText(\"\");setError(\"\");},[tab]);"
    content = content[:end_line] + insert + content[end_line:]
    fixes.append("clear inputs on tab change")

# 2. Validate duplicate recipe - add check in addRecipe
old2 = "  async function addRecipe(r){"
new2 = """  async function addRecipe(r){
    const existing=recipes.find(x=>x.title.toLowerCase().trim()===r.title.toLowerCase().trim());
    if(existing){alert("Ya tienes una receta con el nombre: "+r.title);return;}"""
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("duplicate recipe validation")

# 3. Add useCount to recipe - track how many times added to menu
# Update addToMenu in AddToMenuModal to increment counter
old3 = "    saveMenu(newMenu);\n    onClose();\n  }\n  return(\n    <Modal open={open} onClose={onClose} title=\"Anadir al Menu Semanal\""
new3 = "    saveMenu(newMenu);\n    // Increment use counter\n    if(onUseRecipe)onUseRecipe(recipe.id,1);\n    onClose();\n  }\n  return(\n    <Modal open={open} onClose={onClose} title=\"Anadir al Menu Semanal\""
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("increment counter in AddToMenuModal")

# 4. AddToMenuModal accept onUseRecipe prop
old4 = "function AddToMenuModal({open,onClose,recipe,saveMenu,weekMenu,weekOffset}){"
new4 = "function AddToMenuModal({open,onClose,recipe,saveMenu,weekMenu,weekOffset,onUseRecipe}){"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("AddToMenuModal accepts onUseRecipe")

# 5. Add useCount field display on RecipeCard
old5 = "        <div style={{display:\"flex\",alignItems:\"center\",justifyContent:\"space-between\"}}>\n          <div style={{display:\"flex\",gap:8,fontSize:10,color:\"#9CA3AF\"}}>{recipe.time&&<span>⏱ {recipe.time}</span>}<span>👥 {recipe.servings}p</span></div>\n          <StarRating value={recipe.rating} onChange={()=>{}} size={12}/>\n        </div>"
new5 = "        <div style={{display:\"flex\",alignItems:\"center\",justifyContent:\"space-between\"}}>\n          <div style={{display:\"flex\",gap:8,fontSize:10,color:\"#9CA3AF\"}}>{recipe.time&&<span>⏱ {recipe.time}</span>}<span>👥 {recipe.servings}p</span>{recipe.useCount>0&&<span style={{color:\"#F97316\",fontWeight:700}}>×{recipe.useCount}</span>}</div>\n          <StarRating value={recipe.rating} onChange={()=>{}} size={12}/>\n        </div>"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("useCount displayed on card")

# 6. Add updateRecipeCount function in App
old6 = "  async function saveMenu(newMenu){"
new6 = """  async function updateRecipeCount(id,delta){
    const r=recipes.find(x=>x.id===id||String(x.id)===String(id));
    if(!r)return;
    const newCount=Math.max(0,(r.useCount||0)+delta);
    await updateRecipe({...r,useCount:newCount});
  }

  async function saveMenu(newMenu){"""
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("updateRecipeCount function added")

# 7. Pass updateRecipeCount to RecipesPage and WeeklyMenuPage
old7 = "{page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile}/>"
new7 = "{page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile} onUseRecipe={updateRecipeCount}/>"
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("pass updateRecipeCount to RecipesPage")

old8 = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu}/>"
new8 = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount}/>"
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("pass updateRecipeCount to WeeklyMenuPage")

# 8. WeeklyMenuPage - pass onUseRecipe to AddToMenuModal and decrement on remove
old9 = "function WeeklyMenuPage({recipes,weekMenu,saveMenu}){"
new9 = "function WeeklyMenuPage({recipes,weekMenu,saveMenu,onUseRecipe}){"
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("WeeklyMenuPage accepts onUseRecipe")

# 9. Decrement counter when removing from menu
old10 = "  function removeFromMenu(day,slot,id){\n    const nm=JSON.parse(JSON.stringify(weekMenu));\n    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}\n    saveMenu(nm);\n  }"
new10 = "  function removeFromMenu(day,slot,id){\n    const nm=JSON.parse(JSON.stringify(weekMenu));\n    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}\n    saveMenu(nm);\n    if(onUseRecipe)onUseRecipe(id,-1);\n  }"
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("decrement counter on remove from menu")

# 10. Fix shopping list amounts - concatenate different amounts instead of summing
old11 = "      const ingMap={};\n  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const rawName=ing.name.trim();const k=normalizeIngKey(rawName);const capName=cap(rawName);const amt=parseFloat(String(ing.amount).replace(\",\",\".\").replace(/[^\\d.]/g,\"\"))||0;const unit=(ing.unit||\"\")\\.toLowerCase()\\.trim();if(!ingMap[k]){ingMap[k]={id:k,name:capName,amount:amt>0?String(amt):(ing.amount||\"\"),unit:ing.unit||\"\",category:guessCategory(rawName),total:amt,unitKey:unit};}else{const ex=ingMap[k];if(ex.unitKey===unit&&amt>0){ex.total=(ex.total||0)+amt;ex.amount=String(Math.round(ex.total*10)/10);}}}); });});});"
# This pattern might not match exactly, let's do a broader search
lines = content.split('\n')
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if 'const ingMap={}' in line and 'Object.values(menu)' in lines[i] if i < len(lines) else False:
        # Replace this block
        new_lines.append("  const ingMap={};")
        new_lines.append("  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const rawName=ing.name.trim();const k=normalizeIngKey(rawName);const capName=cap(rawName);const amtStr=String(ing.amount||'').trim();const unit=(ing.unit||'').trim();const amtDisplay=amtStr&&amtStr!=='0'?(amtStr+(unit?' '+unit:'')):'al gusto';if(!ingMap[k]){ingMap[k]={id:k,name:capName,amounts:[amtDisplay],category:guessCategory(rawName)};}else{if(!ingMap[k].amounts.includes(amtDisplay))ingMap[k].amounts.push(amtDisplay);}});});});});")
        fixes.append("shopping list concatenate amounts")
        i += 1
        # Skip old forEach line
        while i < len(lines) and 'ingMap' in lines[i] and i < len(lines):
            if 'const allItems' in lines[i]:
                break
            i += 1
        continue
    new_lines.append(line)
    i += 1
content = '\n'.join(new_lines)

# Fix display of amounts in shopping list
old12 = "{item.name}{item.amount&&<span style={{color:\"#9CA3AF\",fontWeight:400,marginLeft:5}}>({item.amount} {item.unit})</span>}"
new12 = "{item.name}{item.amounts&&item.amounts.length>0&&<span style={{color:\"#9CA3AF\",fontWeight:400,marginLeft:5}}>({item.amounts.join(' + ')})</span>}"
if old12 in content:
    content = content.replace(old12, new12)
    fixes.append("display concatenated amounts")

# Fix WhatsApp and copy for amounts
old13 = "items.forEach(i=>{t+=\"  - \"+i.name+(i.amount?\" (\"+i.amount+\" \"+i.unit+\")\":\"\")+\"\\n\";"
new13 = "items.forEach(i=>{t+=\"  - \"+i.name+(i.amounts&&i.amounts.length?\" (\"+i.amounts.join(\" + \")+\")\":\"\")+\"\\n\";"
content = content.replace(old13, new13)

# 11. Add "Todas las Recetas" page to NAV
old14 = "  const NAV=[{id:\"recetas\",label:\"Recetas\",icon:\"📖\"},{id:\"menu\",label:\"Menu Semanal\",icon:\"📅\"},{id:\"compra\",label:\"Lista de Compra\",icon:\"🛒\"}];"
new14 = "  const NAV=[{id:\"recetas\",label:\"Recetas\",icon:\"📖\"},{id:\"todas\",label:\"Todas las Recetas\",icon:\"📋\"},{id:\"menu\",label:\"Menu Semanal\",icon:\"📅\"},{id:\"compra\",label:\"Lista de Compra\",icon:\"🛒\"}];"
if old14 in content:
    content = content.replace(old14, new14)
    fixes.append("Todas las Recetas nav item")

# 12. Add AllRecipesPage render
old15 = "{page===\"menu\"&&<WeeklyMenuPage"
new15 = "{page===\"todas\"&&<AllRecipesPage recipes={recipes} onDelete={deleteRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={0} onUseRecipe={updateRecipeCount}/>}\n        {page===\"menu\"&&<WeeklyMenuPage"
if old15 in content:
    content = content.replace(old15, new15)
    fixes.append("AllRecipesPage render added")

# 13. Add AllRecipesPage component before App
all_recipes_component = """
function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe}){
  const [addMenuRecipe,setAddMenuRecipe]=useState(null);
  const grouped={};
  MEAL_TYPES.forEach(mt=>{
    const byType={};
    RECIPE_TYPES.forEach(rt=>{
      const recs=recipes.filter(r=>r.mealType===mt&&r.recipeType===rt).sort((a,b)=>a.title.localeCompare(b.title,'es'));
      if(recs.length>0)byType[rt]=recs;
    });
    // Also catch unmatched
    const other=recipes.filter(r=>r.mealType===mt&&!RECIPE_TYPES.includes(r.recipeType)).sort((a,b)=>a.title.localeCompare(b.title,'es'));
    if(other.length>0)byType["Otros platos"]=[...(byType["Otros platos"]||[]),...other];
    if(Object.keys(byType).length>0)grouped[mt]=byType;
  });

  return(
    <div style={{padding:"18px 16px"}}>
      <h1 style={{margin:"0 0 4px",fontSize:24,fontWeight:800,color:"#111"}}>Todas las Recetas</h1>
      <p style={{margin:"0 0 16px",color:"#9CA3AF",fontSize:12}}>{recipes.length} recetas ordenadas por tipo</p>
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
                          <div style={{fontWeight:600,fontSize:13,color:"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.title}</div>
                          {r.useCount>0&&<div style={{fontSize:10,color:"#F97316",fontWeight:600}}>Añadida al menu {r.useCount} {r.useCount===1?"vez":"veces"}</div>}
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
      {addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>}
    </div>
  );
}

"""

if "function AllRecipesPage(" not in content:
    # Insert before App component
    insert_before = "\nconst LOGO_IMG ="
    idx = content.find(insert_before)
    if idx >= 0:
        content = content[:idx] + all_recipes_component + content[idx:]
        fixes.append("AllRecipesPage component added")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
