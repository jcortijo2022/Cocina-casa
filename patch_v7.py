#!/usr/bin/env python3
# patch_v7.py - todos los cambios solicitados

content = open('src/App.jsx').read()
fixes = []

# 1. Fix menu semanal not saving - the setWeekMenu calls in WeeklyMenuPage need to use saveMenuToSupabase
# Check if WeeklyMenuPage is using saveMenuToSupabase
if 'saveMenuToSupabase' in content:
    fixes.append("saveMenuToSupabase already present")

# 2. Sort shopping list alphabetically within categories
old2 = "  const allItems=[...Object.values(ingredientMap),...extraItems];"
new2 = "  const allItems=[...Object.values(ingredientMap),...extraItems].sort((a,b)=>a.name.localeCompare(b.name,'es'));"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("sort shopping list alphabetically")

# 3. Capitalize first letter when adding manual item - already done, verify
if "capExtra" in content:
    fixes.append("capitalize extraItems already done")

# 4. Fix sal and azucar to especias
old4 = "  if(/\\bsal\\b|pimienta|azafran|"
new4 = "  if(/\\bsal\\b|\\bazucar\\b|\\bazucar\\b|azucar|pimienta|azafran|"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("sal azucar to especias")

# 5. Better ingredient grouping - normalize similar ingredients
# Add normalization function before guessCategory
old5 = "function guessCategory(name){"
new5 = """function normalizeIngredientKey(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim();
  // Normalize aceite variants
  if(/aceite/.test(n))return"aceite";
  // Normalize arroz variants
  if(/\\barroz\\b/.test(n))return"arroz";
  // Normalize caldo variants
  if(/\\bcaldo\\b/.test(n))return"caldo";
  // Normalize tomate variants (not tomate frito)
  if(/\\btomate\\b/.test(n)&&!/frito|triturado|concentrado|conserva/.test(n))return"tomate";
  // Normalize ajo variants
  if(/\\baj[oa]s?\\b/.test(n))return"ajo";
  // Normalize cebolla variants
  if(/\\bceboll/.test(n))return"cebolla";
  // Normalize sal variants
  if(/^sal(\\s|$)/.test(n))return"sal";
  return n;
}

function guessCategory(name){"""
if "function guessCategory(name){" in content and "normalizeIngredientKey" not in content:
    content = content.replace("function guessCategory(name){", new5)
    fixes.append("normalizeIngredientKey added")

# 6. Use normalizeIngredientKey in shopping list
old6 = "const k=rawName.toLowerCase().normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g,\"\").replace(/\\s+/g,\" \").trim();"
new6 = "const k=normalizeIngredientKey(rawName);"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("use normalizeIngredientKey in shopping list")

# 7. Mobile layout improvements - add button above search, full width
# Find RecipesPage mobile layout
old7 = """      <div style={{display:"flex",gap:10,margin:"16px 0",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:160}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar recetas..." style={{...inputStyle,padding:"10px 14px"}}/></div>
        <select value={filterMeal} onChange={e=>setFilterMeal(e.target.value)} style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todas">Todas</option>{MEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todos los tipos">Todos los tipos</option>{RECIPE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
      </div>"""
new7 = """      <div style={{margin:"12px 0"}}>
        <div style={{marginBottom:8}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar recetas..." style={{...inputStyle,padding:"10px 14px"}}/></div>
        <div style={{display:"flex",gap:8}}>
          <select value={filterMeal} onChange={e=>setFilterMeal(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todas">Todas</option>{MEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",color:"#111",cursor:"pointer"}}><option value="Todos los tipos">Todos los tipos</option>{RECIPE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
        </div>
      </div>"""
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("mobile search layout improved")

# 8. Mobile header - logo + hamburger at top, add recipe button full width
old8 = """      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:"#111"}}>Nuestras Recetas</h1>
          <p style={{margin:"4px 0 0",color:"#9CA3AF",fontSize:13}}>{recipes.length} recetas guardadas</p>
        </div>
        <button onClick={()=>setAddOpen(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 18px",background:"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>+ Añadir Receta</button>
      </div>"""
new8 = """      <div style={{marginBottom:6}}>
        <h1 style={{margin:"0 0 4px",fontSize:26,fontWeight:800,color:"#111"}}>Nuestras Recetas</h1>
        <p style={{margin:"0 0 10px",color:"#9CA3AF",fontSize:13}}>{recipes.length} recetas guardadas</p>
        <button onClick={()=>setAddOpen(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",background:"#F97316",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"}}>+ Añadir Receta</button>
      </div>"""
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("mobile add button full width")

# 9. Drag and drop in weekly menu - add draggable items
old9 = """                {items.map(r=>(<div key={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#F3F4F6",borderRadius:8,marginBottom:6,fontSize:12}}>
                  <span style={{flex:1,fontWeight:500,color:"#111"}}>{r.title}</span>
                  <button onClick={()=>removeFromMenu(day,slot,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14,padding:2}}>×</button>
                </div>))}"""
new9 = """                {items.map(r=>(<div key={r.id} draggable onDragStart={e=>{e.dataTransfer.setData("recipe",JSON.stringify({recipe:r,fromDay:day,fromSlot:slot}));}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#F3F4F6",borderRadius:8,marginBottom:6,fontSize:12,cursor:"grab"}}>
                  <span style={{color:"#C4C4C4",fontSize:10,marginRight:2}}>⠿</span>
                  <span style={{flex:1,fontWeight:500,color:"#111"}}>{r.title}</span>
                  <button onClick={()=>removeFromMenu(day,slot,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:14,padding:2}}>×</button>
                </div>))}"""
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("draggable menu items")

# 10. Add drop zones to menu cells
old10 = """              <div key={slot} style={{padding:"10px",borderLeft:"1px solid #E5E7EB",minHeight:60}}>"""
new10 = """              <div key={slot} style={{padding:"10px",borderLeft:"1px solid #E5E7EB",minHeight:60}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{
                  e.preventDefault();
                  try{
                    const {recipe:r,fromDay,fromSlot}=JSON.parse(e.dataTransfer.getData("recipe"));
                    if(fromDay===day&&fromSlot===slot)return;
                    saveMenuToSupabase(prev=>{
                      const w=JSON.parse(JSON.stringify(prev[key]||{}));
                      w[fromDay]=w[fromDay]||{};w[fromDay][fromSlot]=(w[fromDay][fromSlot]||[]).filter(x=>x.id!==r.id);
                      w[day]=w[day]||{};w[day][slot]=w[day][slot]||[];
                      if(!w[day][slot].find(x=>x.id===r.id))w[day][slot]=[...w[day][slot],r];
                      return{...prev,[key]:w};
                    });
                  }catch(e){}
                }}>"""
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("drop zones added")

# 11. Fix saveMenuToSupabase to accept function updater
old11 = "  async function saveMenuToSupabase(newMenu){\n    setWeekMenu(newMenu);"
new11 = "  async function saveMenuToSupabase(newMenuOrFn){\n    const newMenu=typeof newMenuOrFn===\"function\"?newMenuOrFn(weekMenu):newMenuOrFn;\n    setWeekMenu(newMenu);"
if old11 in content:
    content = content.replace(old11, new11)
    fixes.append("saveMenuToSupabase accepts updater function")

# 12. Add search serverless function support - update importRecipe for buscar to use serverless
old12 = """    else if(tab===\"buscar\"){if(!searchQuery.trim()){setError(\"Escribe el nombre de un plato\");return;}importRecipe(\"Crea una receta detallada para: \"+searchQuery+\". Ingredientes para 4 personas. Devuelve JSON: \"+TPL+\" \"+PROMPT_SUFFIX);}"""
new12 = """    else if(tab===\"buscar\"){if(!searchQuery.trim()){setError(\"Escribe el nombre de un plato\");return;}importByUrl(\"buscar:\"+searchQuery,null,true);}"""
if old12 in content:
    content = content.replace(old12, new12)
    fixes.append("buscar uses serverless")

# 13. Update importByUrl to handle buscar: prefix
old13 = "  async function importByUrl(urlVal,photoDataUrl=null){\n    if(!apiKey){onNeedKey();return;}\n    setLoading(true);setError(\"\");\n    try{\n      const r=await fetch(\"/api/import-recipe\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify({url:urlVal,apiKey})});"
new13 = "  async function importByUrl(urlVal,photoDataUrl=null,isSearch=false){\n    if(!apiKey){onNeedKey();return;}\n    setLoading(true);setError(\"\");\n    try{\n      const payload=isSearch?{search:urlVal.replace(\"buscar:\",\"\"),apiKey}:{url:urlVal,apiKey};\n      const r=await fetch(\"/api/import-recipe\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify(payload)});"
if old13 in content:
    content = content.replace(old13, new13)
    fixes.append("importByUrl handles search")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ahora actualiza api/import-recipe.js y ejecuta: npm run build && vercel --prod")
