#!/usr/bin/env python3
# patch_v5.py

content = open('src/App.jsx').read()
fixes = []

# 1. Fix copyright - move it to sidebar (it's appearing top-right of main content)
# The issue is it's outside the sidebar div. Find and fix placement.
old1 = '''      <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}'''
new1 = '''      <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}'''
# Already correct structure, need to find where copyright ended up

# Find actual copyright location and fix
if '© Jesús Cortijo' in content:
    # Remove misplaced copyright from main content area
    content = content.replace(
        '''      <div style={{padding:"8px 12px 10px",borderTop:"1px solid #F3F4F6"}}>
        <p style={{margin:0,fontSize:10,color:"#C4C4C4",lineHeight:1.5,textAlign:"center"}}>© Jesús Cortijo<br/>Abril 2026</p>
      </div>
      <ApiKeyModal open={apiKeyOpen} onClose={()=>setApiKeyOpen(false)} apiKey={apiKey} setApiKey={setApiKey}/>''',
        '      <ApiKeyModal open={apiKeyOpen} onClose={()=>setApiKeyOpen(false)} apiKey={apiKey} setApiKey={setApiKey}/>'
    )
    fixes.append("removed misplaced copyright")

# Add copyright correctly inside sidebar, after API key button
old2 = '''        <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",background:apiKey?"#F0FDF4":"#FFF7ED",color:apiKey?"#16A34A":"#F97316",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            {apiKey?"✅ API Key OK":"⚙️ Configurar API Key"}
          </button>
        </div>'''
new2 = '''        <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",background:apiKey?"#F0FDF4":"#FFF7ED",color:apiKey?"#16A34A":"#F97316",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            {apiKey?"✅ API Key OK":"⚙️ Configurar API Key"}
          </button>
        </div>
        <div style={{padding:"6px 12px 10px"}}>
          <p style={{margin:0,fontSize:10,color:"#C4C4C4",lineHeight:1.6,textAlign:"center"}}>© Jesús Cortijo<br/>Abril 2026</p>
        </div>'''
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("copyright in sidebar")

# 2. Fix navigation - when clicking Recetas while in detail, go back to list
# The issue is setDetailId is defined in App but RecipesPage uses local state
# Fix: use setDetailId from props properly
old3 = "  const detail=detailId?recipes.find(r=>r.id===detailId)||null:null;\n  const setDetail=(r)=>setDetailId?setDetailId(r?r.id:null):null;"
new3 = "  const detail=detailId?recipes.find(r=>r.id===detailId)||null:null;\n  function setDetail(r){if(setDetailId)setDetailId(r?r.id:null);}"
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("setDetail fixed")

# 3. Fix nav button to also reset detail when clicking Recetas
old4 = '            <button key={item.id} onClick={()=>{setPage(item.id);if(item.id==="recetas")setDetailId(null);}}'
new4 = '            <button key={item.id} onClick={()=>{setPage(item.id);if(item.id==="recetas"){setDetailId(null);}}}'
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("nav resets detail")

# 4. Fix image loading - update TPL and prompt to request real image URL
old5 = '  const TPL=\'{"title":"TITULO","description":"DESCRIPCION breve","image":"URL imagen del plato si existe o vacio","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno","paso dos"],"sourceUrl":"","time":"30 min","servings":4}\';'
new5 = '  const TPL=\'{"title":"TITULO","description":"DESCRIPCION breve","image":"https://URL-imagen-real-del-plato.jpg","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno","paso dos"],"sourceUrl":"","time":"30 min","servings":4}\';'
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("TPL image url hint")

old6 = '  const PROMPT_SUFFIX="mealType debe ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros. recipeType debe ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos. Infiere el mealType y recipeType correctamente segun el plato. Si puedes encontrar la URL de una imagen real del plato ponla en image. Los pasos de preparacion deben ser COMPLETOS y DETALLADOS, sin resumir. Cada paso debe explicar exactamente que hacer, con tiempos, temperaturas y tecnicas. No omitas ningun detalle importante.";'
new6 = '  const PROMPT_SUFFIX="mealType debe ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros. recipeType debe ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos. Infiere el mealType y recipeType correctamente. IMPORTANTE: Para el campo image, busca y pon la URL directa de una imagen real del plato terminada en .jpg o .png, que sea una URL publica y accesible. Los pasos de preparacion deben ser COMPLETOS y DETALLADOS, sin resumir. Cada paso debe explicar exactamente que hacer, con tiempos, temperaturas y tecnicas.";'
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("image prompt improved")

# 5. Fix import by URL - extract image from response too
old7 = '      onAdd({id:Date.now(),title:data.title||"Receta",description:data.description||"",image:data.image||"",mealType:MEAL_TYPES.includes(data.mealType)?data.mealType:"Comida",recipeType:RECIPE_TYPES.includes(data.recipeType)?data.recipeType:"Otros platos",ingredients:(data.ingredients||[]).map((ing,i)=>({id:Date.now()+i,amount:String(ing.amount||""),unit:String(ing.unit||""),name:String(ing.name||"")})),steps:Array.isArray(data.steps)?data.steps:data.steps?data.steps.split("\\n").filter(s=>s.trim()):[],sourceUrl:data.sourceUrl||urlVal,time:data.time||"",servings:Number(data.servings)||4,rating:0});\n      onClose();\n    }catch(e){setError("Error: "+e.message);}\n    setLoading(false);\n  }'
new7 = '      onAdd({id:Date.now(),title:data.title||"Receta",description:data.description||"",image:data.image||"",mealType:MEAL_TYPES.includes(data.mealType)?data.mealType:"Comida",recipeType:RECIPE_TYPES.includes(data.recipeType)?data.recipeType:"Otros platos",ingredients:(data.ingredients||[]).map((ing,i)=>({id:Date.now()+i,amount:String(ing.amount||""),unit:String(ing.unit||""),name:String(ing.name||"")})),steps:Array.isArray(data.steps)?data.steps:data.steps?data.steps.split("\\n").filter(s=>s.trim()):[],sourceUrl:data.sourceUrl||urlVal,time:data.time||"",servings:Number(data.servings)||4,rating:0});\n      onClose();\n    }catch(e){setError("Error: "+e.message);}\n    setLoading(false);\n  }'
# Already same, skip

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
