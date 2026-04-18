#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# 1. Fix counter - calculate it from weekMenu instead of storing it
# This way it's always accurate and never gets out of sync
# Replace updateRecipeCount with a computed count from weekMenu

old1 = """  async function updateRecipeCount(id,delta){
    const r=recipes.find(x=>x.id===id||String(x.id)===String(id));
    if(!r)return;
    const newCount=Math.max(0,(r.useCount||0)+delta);
    await updateRecipe({...r,useCount:newCount});
  }"""

new1 = """  // Counter is computed from weekMenu - always accurate
  function getRecipeUseCount(id){
    let count=0;
    Object.values(weekMenu).forEach(days=>{
      Object.values(days).forEach(slots=>{
        Object.values(slots).forEach(rs=>{
          rs.forEach(r=>{if(String(r.id)===String(id))count++;});
        });
      });
    });
    return count;
  }

  async function updateRecipeCount(id,delta){
    // No-op - count is now computed from weekMenu
  }"""

if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("counter computed from weekMenu")

# 2. Pass getRecipeUseCount to pages that need it
old2 = "{page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile} onUseRecipe={updateRecipeCount}/>"
new2 = "{page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount}/>"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("getUseCount passed to RecipesPage")

old3 = "{page===\"todas\"&&<AllRecipesPage recipes={recipes} onDelete={deleteRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={0} onUseRecipe={updateRecipeCount}/>"
new3 = "{page===\"todas\"&&<AllRecipesPage recipes={recipes} onDelete={deleteRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={0} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount}/>"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("getUseCount passed to AllRecipesPage")

old4 = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount}/>"
new4 = "{page===\"menu\"&&<WeeklyMenuPage recipes={recipes} weekMenu={weekMenu} saveMenu={saveMenu} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount}/>"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("getUseCount passed to WeeklyMenuPage")

# 3. Fix RecipeCard to use getUseCount prop
old5 = "function RecipeCard({recipe,onOpen,onDelete,onAddMenu,onUpdate}){"
new5 = "function RecipeCard({recipe,onOpen,onDelete,onAddMenu,onUpdate,getUseCount}){"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("RecipeCard accepts getUseCount")

old6 = "{recipe.useCount>0&&<span style={{color:\"#F97316\",fontWeight:700}}>×{recipe.useCount}</span>}"
new6 = "{(getUseCount?getUseCount(recipe.id):recipe.useCount||0)>0&&<span style={{color:\"#F97316\",fontWeight:700}}>×{getUseCount?getUseCount(recipe.id):recipe.useCount||0}</span>}"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("RecipeCard uses getUseCount")

# 4. Pass getUseCount to RecipeCard in RecipesPage
old7 = "{filtered.map(r=><RecipeCard key={r.id} recipe={r} onOpen={r=>setDetailId(String(r.id))} onDelete={onDelete} onAddMenu={setAddMenuRecipe} onUpdate={onUpdate}/>"
new7 = "{filtered.map(r=><RecipeCard key={r.id} recipe={r} onOpen={r=>setDetailId(String(r.id))} onDelete={onDelete} onAddMenu={setAddMenuRecipe} onUpdate={onUpdate} getUseCount={getUseCount}/>"
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("RecipeCard gets getUseCount in RecipesPage")

# 5. RecipesPage accept getUseCount
old8 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile,onUseRecipe}){"
new8 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile,onUseRecipe,getUseCount}){"
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("RecipesPage accepts getUseCount")

# 6. AllRecipesPage accept getUseCount and use it
old9 = "function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe}){"
new9 = "function AllRecipesPage({recipes,onDelete,weekMenu,saveMenu,weekOffset,onUseRecipe,getUseCount}){"
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("AllRecipesPage accepts getUseCount")

old10 = "{r.useCount>0&&<div style={{fontSize:10,color:\"#F97316\",fontWeight:600}}>Añadida al menu {r.useCount} {r.useCount===1?\"vez\":\"veces\"}</div>}"
new10 = "{(getUseCount?getUseCount(r.id):0)>0&&<div style={{fontSize:10,color:\"#F97316\",fontWeight:600}}>Añadida al menu {getUseCount?getUseCount(r.id):0} {(getUseCount?getUseCount(r.id):0)===1?\"vez\":\"veces\"}</div>}"
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("AllRecipesPage uses getUseCount")

# 7. Fix deleted items - when recipe removed from menu, clear its deleted ingredients for that week
old11 = "  function removeFromMenu(day,slot,id){\n    const nm=JSON.parse(JSON.stringify(weekMenu));\n    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}\n    saveMenu(nm);\n    if(onUseRecipe)onUseRecipe(id,-1);\n  }"
new11 = """  function removeFromMenu(day,slot,id){
    const nm=JSON.parse(JSON.stringify(weekMenu));
    if(nm[key]&&nm[key][day]&&nm[key][day][slot]){nm[key][day][slot]=nm[key][day][slot].filter(r=>r.id!==id);}
    saveMenu(nm);
    // Check if recipe still exists in menu this week - if not, clear its deleted ingredients
    const stillInMenu=Object.values(nm[key]||{}).some(slots=>Object.values(slots).some(rs=>rs.some(r=>String(r.id)===String(id))));
    if(!stillInMenu&&setDeletedByWeek){
      // We need to recalculate - get ingredient keys for this recipe
      // For simplicity, clear ALL deleted for this week when recipe fully removed
      // Actually better: just leave deleted as is - user explicitly deleted them
    }
  }"""
if old11 in content:
    content = content.replace(old11, new11)
    fixes.append("removeFromMenu updated")

# 8. The real fix for deleted ingredients: when recipe added back to menu,
# clear the deleted keys for ingredients of THAT recipe for that week
# We need to pass clearRecipeDeletedItems to AddToMenuModal
old12 = "    saveMenu(newMenu);\n    // Increment use counter\n    if(onUseRecipe)onUseRecipe(recipe.id,1);\n    onClose();"
new12 = "    saveMenu(newMenu);\n    // Clear deleted ingredients for this recipe this week\n    if(onClearDeleted)onClearDeleted(recipe,key);\n    onClose();"
if old12 in content:
    content = content.replace(old12, new12)
    fixes.append("AddToMenuModal clears deleted on add")

# 9. AddToMenuModal accept onClearDeleted
old13 = "function AddToMenuModal({open,onClose,recipe,saveMenu,weekMenu,weekOffset,onUseRecipe}){"
new13 = "function AddToMenuModal({open,onClose,recipe,saveMenu,weekMenu,weekOffset,onUseRecipe,onClearDeleted}){"
if old13 in content:
    content = content.replace(old13, new13)
    fixes.append("AddToMenuModal accepts onClearDeleted")

# 10. Add clearRecipeDeletedItems function in App
old14 = "  // Counter is computed from weekMenu - always accurate"
new14 = """  function clearRecipeDeletedItems(recipe,weekKey){
    if(!recipe||!weekKey)return;
    // Get ingredient keys for this recipe
    const ingKeys=(recipe.ingredients||[]).map(ing=>normalizeIngKey((ing.name||'').trim()));
    if(ingKeys.length===0)return;
    setDeletedByWeek(p=>{
      const cur=p[weekKey]||[];
      const remaining=cur.filter(k=>!ingKeys.includes(k));
      if(remaining.length===cur.length)return p; // nothing changed
      const n={...p,[weekKey]:remaining};
      // Update Supabase - remove these keys
      supabase.from('shopping_deleted').delete().eq('week_key',weekKey).in('id',ingKeys).then(()=>{});
      return n;
    });
  }

  // Counter is computed from weekMenu - always accurate"""
if old14 in content:
    content = content.replace(old14, new14)
    fixes.append("clearRecipeDeletedItems function added")

# 11. Pass clearRecipeDeletedItems to AddToMenuModal calls
# In RecipesPage
old15 = "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>"
new15 = "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>"
if old15 in content:
    content = content.replace(old15, new15)
    fixes.append("RecipesPage AddToMenuModal gets onClearDeleted")

# In RecipeDetail
old16 = "<AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)} recipe={recipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>"
new16 = "<AddToMenuModal open={addMenuOpen} onClose={()=>setAddMenuOpen(false)} recipe={recipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>"
if old16 in content:
    content = content.replace(old16, new16)
    fixes.append("RecipeDetail AddToMenuModal gets onClearDeleted")

# RecipesPage accept onClearDeleted
old17 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile,onUseRecipe,getUseCount}){"
new17 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,apiKey,onNeedKey,detailId,setDetailId,isMobile,onUseRecipe,getUseCount,onClearDeleted}){"
if old17 in content:
    content = content.replace(old17, new17)
    fixes.append("RecipesPage accepts onClearDeleted")

# RecipeDetail accept onClearDeleted
old18 = "function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,onUseRecipe}){"
new18 = "function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,saveMenu,weekOffset,onUseRecipe,onClearDeleted}){"
if old18 in content:
    content = content.replace(old18, new18)
    fixes.append("RecipeDetail accepts onClearDeleted")

# Pass onClearDeleted from RecipesPage to RecipeDetail
old19 = "if(detail){return<RecipeDetail recipe={detail} onBack={()=>setDetailId(null)} onDelete={id=>{onDelete(id);setDetailId(null);}} onUpdate={onUpdate} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}/>;}"
new19 = "if(detail){return<RecipeDetail recipe={detail} onBack={()=>setDetailId(null)} onDelete={id=>{onDelete(id);setDetailId(null);}} onUpdate={onUpdate} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>;}"
if old19 in content:
    content = content.replace(old19, new19)
    fixes.append("RecipeDetail gets onClearDeleted")

# Pass onClearDeleted from App to RecipesPage
old20 = "{page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount}/>"
new20 = "{page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} saveMenu={saveMenu} weekOffset={weekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId} isMobile={isMobile} onUseRecipe={updateRecipeCount} getUseCount={getRecipeUseCount} onClearDeleted={clearRecipeDeletedItems}/>"
if old20 in content:
    content = content.replace(old20, new20)
    fixes.append("App passes onClearDeleted to RecipesPage")

# Also pass to AllRecipesPage and WeeklyMenuPage AddToMenuModal
old21 = "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>"
# In AllRecipesPage
content = content.replace(
    "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe}>}",
    "{addMenuRecipe&&<AddToMenuModal open={true} onClose={()=>setAddMenuRecipe(null)} recipe={addMenuRecipe} saveMenu={saveMenu} weekMenu={weekMenu} weekOffset={weekOffset} onUseRecipe={onUseRecipe} onClearDeleted={onClearDeleted}/>}"
)

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
