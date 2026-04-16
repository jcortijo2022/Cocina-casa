#!/usr/bin/env python3
# fix_v12.py

content = open('src/App.jsx').read()
fixes = []

# 1. Fix shopping list amounts - the ingMap broke, restore proper amount display
old1 = "  const ingMap={};\n  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const rawName=ing.name.trim();const k=normalizeIngKey(rawName);const capName=cap(rawName);const amtStr=String(ing.amount||'').trim();const unit=(ing.unit||'').trim();const amtDisplay=amtStr&&amtStr!=='0'?(amtStr+(unit?' '+unit:'')):'al gusto';if(!ingMap[k]){ingMap[k]={id:k,name:capName,amounts:[amtDisplay],category:guessCategory(rawName)};}else{if(!ingMap[k].amounts.includes(amtDisplay))ingMap[k].amounts.push(amtDisplay);}});});});});"
new1 = """  const ingMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{
    const full=recipes.find(rec=>String(rec.id)===String(r.id));
    (full?.ingredients||r.ingredients||[]).forEach(ing=>{
      const rawName=(ing.name||"").trim();
      if(!rawName)return;
      const k=normalizeIngKey(rawName);
      const capName=cap(rawName);
      const amtStr=String(ing.amount||"").trim();
      const unit=(ing.unit||"").trim();
      const amtDisplay=amtStr&&amtStr!=="0"?(amtStr+(unit?" "+unit:"")):"al gusto";
      if(!ingMap[k]){
        ingMap[k]={id:k,name:capName,amounts:[amtDisplay],category:guessCategory(rawName)};
      }else{
        if(!ingMap[k].amounts.includes(amtDisplay))ingMap[k].amounts.push(amtDisplay);
      }
    });
  });});});"""
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("shopping list amounts fixed")
else:
    # Try to find and fix the ingMap block
    idx = content.find("const ingMap={};")
    if idx >= 0:
        fixes.append("WARN: ingMap found but pattern mismatch")

# 2. Fix amount display - make sure it shows
old2 = "{item.amounts&&item.amounts.length>0&&<span style={{color:\"#9CA3AF\",fontWeight:400,marginLeft:5}}>({item.amounts.join(' + ')})</span>}"
new2 = "{item.amounts&&item.amounts.filter(a=>a&&a!=='al gusto'||item.amounts.length===1).length>0&&<span style={{color:\"#9CA3AF\",fontWeight:400,marginLeft:5}}>({item.amounts.join(', ')})</span>}"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("amount display improved")

# 3. Fix useCount persistence - add to supabase update
# Make sure useCount is saved in recipes table
old3 = "    await supabase.from(\"recipes\").update({title:r.title,description:r.description,image:r.image,meal_type:r.mealType,recipe_type:r.recipeType,ingredients:r.ingredients,steps:r.steps,source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0}).eq(\"id\",r.id);"
new3 = "    await supabase.from(\"recipes\").update({title:r.title,description:r.description,image:r.image,meal_type:r.mealType,recipe_type:r.recipeType,ingredients:r.ingredients,steps:r.steps,source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0,use_count:r.useCount||0}).eq(\"id\",r.id);"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("useCount saved to supabase")

# 4. Fix useCount loading from supabase
old4 = "if(recs)setRecipes(recs.map(r=>({id:r.id,title:r.title,description:r.description||\"\"image:r.image||\"\"" 
# Try different pattern
old4b = "title:r.title,description:r.description||\"\"image:r.image||\"\"" 
# Let's find the map function
idx4 = content.find("if(recs)setRecipes(recs.map(r=>({")
if idx4 >= 0:
    end4 = content.find("})));", idx4) + 5
    old_map = content[idx4:end4]
    new_map = old_map.replace("rating:r.rating||0}", "rating:r.rating||0,useCount:r.use_count||0}")
    if new_map != old_map:
        content = content[:idx4] + new_map + content[end4:]
        fixes.append("useCount loaded from supabase")

# 5. Fix insert to also save use_count
old5 = "    await supabase.from(\"recipes\").insert({id:r.id,title:r.title,description:r.description,image:r.image,meal_type:r.mealType,recipe_type:r.recipeType,ingredients:r.ingredients,steps:r.steps,source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0});"
new5 = "    await supabase.from(\"recipes\").insert({id:r.id,title:r.title,description:r.description,image:r.image,meal_type:r.mealType,recipe_type:r.recipeType,ingredients:r.ingredients,steps:r.steps,source_url:r.sourceUrl,time:r.time,servings:r.servings,rating:r.rating||0,use_count:r.useCount||0});"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("useCount saved on insert")

# 6. Pass onUseRecipe to RecipesPage AddToMenuModal calls
old6 = "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset}/>}"
new6 = "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>}"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("onUseRecipe passed to RecipesPage AddToMenuModal")

# 7. RecipesPage accept onUseRecipe
old7 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile}){"
new7 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile,onUseRecipe}){"
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("RecipesPage accepts onUseRecipe")

# 8. Pass onUseRecipe to RecipeDetail AddToMenuModal
old8 = "<AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)} recipe={recipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset}/>"
new8 = "<AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)} recipe={recipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>"
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("RecipeDetail AddToMenuModal gets onUseRecipe")

# 9. RecipeDetail accept onUseRecipe
old9 = "function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,saveMenu,weekOffset}){"
new9 = "function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,onUseRecipe}){"
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("RecipeDetail accepts onUseRecipe")

# 10. Pass onUseRecipe from RecipesPage to RecipeDetail
old10 = "if(detail){return<RecipeDetail recipe={detail} onBack={()=>setDetailId(null)} onDelete={id=>{onDelete(id);setDetailId(null);}} onUpdate={onUpdate} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset}/>;}"
new10 = "if(detail){return<RecipeDetail recipe={detail} onBack={()=>setDetailId(null)} onDelete={id=>{onDelete(id);setDetailId(null);}} onUpdate={onUpdate} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>;}"
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("RecipeDetail gets onUseRecipe")

# 11. Add filter to AllRecipesPage
old11 = "function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe}){\n  const [addMenuRecipe,setAddMenuRecipe]=useState(null);"
new11 = """function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe}){
  const [addMenuRecipe,setAddMenuRecipe]=useState(null);
  const [filterMeal,setFilterMeal]=useState("Todas");"""
if old11 in content:
    content = content.replace(old11, new11)
    fixes.append("AllRecipesPage filter state")

# 12. Add filter UI and apply filter in AllRecipesPage
old12 = "  const grouped={};\n  MEAL_TYPES.forEach(mt=>{"
new12 = """  const filteredRecipes=filterMeal==="Todas"?recipes:recipes.filter(r=>r.mealType===filterMeal);
  const grouped={};
  MEAL_TYPES.forEach(mt=>{"""
if old12 in content:
    content = content.replace(old12, new12)
    # Also use filteredRecipes in grouped
    content = content.replace(
        "    const recs=recipes.filter(r=>r.mealType===mt&&r.recipeType===rt)",
        "    const recs=filteredRecipes.filter(r=>r.mealType===mt&&r.recipeType===rt)"
    )
    content = content.replace(
        "    const other=recipes.filter(r=>r.mealType===mt&&!RECIPE_TYPES.includes(r.recipeType))",
        "    const other=filteredRecipes.filter(r=>r.mealType===mt&&!RECIPE_TYPES.includes(r.recipeType))"
    )
    fixes.append("AllRecipesPage filter applied")

# 13. Add filter UI before recipe list in AllRecipesPage
old13 = '      <p style={{margin:"0 0 16px",color:"#9CA3AF",fontSize:12}}>{recipes.length} recetas ordenadas por tipo</p>'
new13 = '''      <p style={{margin:"0 0 10px",color:"#9CA3AF",fontSize:12}}>{recipes.length} recetas ordenadas por tipo</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <button onClick={()=>setFilterMeal("Todas")} style={{padding:"6px 14px",borderRadius:20,border:"2px solid "+(filterMeal==="Todas"?"#F97316":"#E5E7EB"),background:filterMeal==="Todas"?"#FFF7ED":"#fff",color:filterMeal==="Todas"?"#F97316":"#374151",fontWeight:600,fontSize:12,cursor:"pointer"}}>Todas</button>
        {MEAL_TYPES.map(mt=><button key={mt} onClick={()=>setFilterMeal(mt)} style={{padding:"6px 14px",borderRadius:20,border:"2px solid "+(filterMeal===mt?MEAL_TYPE_COLORS[mt]?.bg||"#F97316":"#E5E7EB"),background:filterMeal===mt?(MEAL_TYPE_COLORS[mt]?.bg||"#FFF7ED"):"#fff",color:filterMeal===mt?(MEAL_TYPE_COLORS[mt]?.text||"#F97316"):"#374151",fontWeight:600,fontSize:12,cursor:"pointer"}}>{mt}</button>)}
      </div>'''
if old13 in content:
    content = content.replace(old13, new13)
    fixes.append("AllRecipesPage filter UI")

# 14. Fix text alignment in AllRecipesPage - already left but ensure
old14 = '                          <div style={{fontWeight:600,fontSize:13,color:"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.title}</div>'
new14 = '                          <div style={{fontWeight:600,fontSize:13,color:"#111",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textAlign:"left"}}>{r.title}</div>'
if old14 in content:
    content = content.replace(old14, new14)
    fixes.append("AllRecipesPage text left aligned")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ahora necesitas añadir columna use_count en Supabase SQL Editor:")
print("ALTER TABLE recipes ADD COLUMN IF NOT EXISTS use_count integer DEFAULT 0;")
print("Luego: npm run build && vercel --prod")
