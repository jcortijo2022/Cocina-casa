#!/usr/bin/env python3
content = open('src/App.jsx').read()
ok = []

# Cambiar el handler de enlace/video para usar la funcion serverless
old1 = """    if(tab==="enlace"||tab==="video"){
      if(!url.trim()){setError("Introduce una URL");return;}
      const urlName=decodeURIComponent(url.split("/").filter(Boolean).pop()||"").replace(/[?#].*/,"").replace(/\\.html?$/,"").replace(/[-_]/g," ").trim();
      importRecipe("Crea una receta detallada para el plato llamado: "+urlName+". El campo sourceUrl debe ser: "+url+". Ingredientes para 4 personas. Devuelve JSON con este esquema exacto: "+TPL);}"""

new1 = """    if(tab==="enlace"||tab==="video"){
      if(!url.trim()){setError("Introduce una URL");return;}
      if(!apiKey){onNeedKey();return;}
      setLoading(true);setError("");
      try{
        const r=await fetch("/api/import-recipe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url,apiKey})});
        const data=await r.json();
        if(!r.ok)throw new Error(data.error||"Error del servidor");
        onAdd({id:Date.now(),title:data.title||"Receta",description:data.description||"",image:data.image||"",mealType:MEAL_TYPES.includes(data.mealType)?data.mealType:"Comida",recipeType:RECIPE_TYPES.includes(data.recipeType)?data.recipeType:"Otros platos",ingredients:(data.ingredients||[]).map((ing,i)=>({id:Date.now()+i,amount:String(ing.amount||""),unit:String(ing.unit||""),name:String(ing.name||"")})),steps:Array.isArray(data.steps)?data.steps.join("\\n"):data.steps||"",sourceUrl:data.sourceUrl||url,time:data.time||"",servings:Number(data.servings)||4,rating:0});
        onClose();
      }catch(e){setError("Error: "+e.message);}
      setLoading(false);
      return;}"""

if old1 in content:
    content = content.replace(old1, new1)
    ok.append('enlace/video usa serverless')
else:
    print('WARN: patron enlace no encontrado, buscando...')
    for i,line in enumerate(content.split('\n')):
        if 'tab==="enlace"' in line:
            print(f'  {i}: {repr(line[:200])}')

open('src/App.jsx','w').write(content)
print('OK:', ', '.join(ok) if ok else 'sin cambios - revisa WARN arriba')
