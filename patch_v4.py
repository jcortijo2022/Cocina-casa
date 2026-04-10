#!/usr/bin/env python3
# patch_v4.py

content = open('src/App.jsx').read()
fixes = []

# 1. Full width app - remove any constraints
old1 = '    <div style={{display:"flex",height:"100vh",width:"100%",maxWidth:"100vw",fontFamily:"\'Segoe UI\',system-ui,sans-serif",background:"#F8F7F4",overflow:"hidden"}}>'
new1 = '    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"\'Segoe UI\',system-ui,sans-serif",background:"#F8F7F4",overflow:"hidden",position:"fixed",top:0,left:0}}>'
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("full width fixed")

# 2. Add copyright to sidebar
old2 = '        <div style={{padding:"10px",borderTop:"1px solid #F3F4F6"}}>\n          <button onClick={()=>setApiKeyOpen(true)}'
new2 = '        <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6"}}>\n          <button onClick={()=>setApiKeyOpen(true)}'
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("sidebar padding")

old3 = '      <ApiKeyModal open={apiKeyOpen} onClose={()=>setApiKeyOpen(false)} apiKey={apiKey} setApiKey={setApiKey}/>'
new3 = '''      <div style={{padding:"8px 12px 10px",borderTop:"1px solid #F3F4F6"}}>
        <p style={{margin:0,fontSize:10,color:"#C4C4C4",lineHeight:1.5,textAlign:"center"}}>© Jesús Cortijo<br/>Abril 2026</p>
      </div>
      <ApiKeyModal open={apiKeyOpen} onClose={()=>setApiKeyOpen(false)} apiKey={apiKey} setApiKey={setApiKey}/>'''
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("copyright added")

# 3. Scroll to top when opening recipe detail
old4 = "  if(detail){const live=recipes.find(r=>r.id===detail.id)||detail;return<RecipeDetail recipe={live} onBack={()=>setDetail(null)} onDelete={id=>{onDelete(id);setDetail(null)}} onUpdate={onUpdate} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset}/>;}"
new4 = "  if(detail){const live=recipes.find(r=>r.id===detail.id)||detail;return<RecipeDetail recipe={live} onBack={()=>setDetail(null)} onDelete={id=>{onDelete(id);setDetail(null)}} onUpdate={onUpdate} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset}/>;}"
# Already correct, skip

# 4. Navigation - when clicking Recetas menu item, clear detail
old5 = "  const navItems=[\n    {id:\"recetas\",label:\"Recetas\",icon:\"📖\"},\n    {id:\"menu\",label:\"Menú Semanal\",icon:\"📅\"},\n    {id:\"compra\",label:\"Lista de Compra\",icon:\"🛒\"},\n  ];"
new5 = "  const navItems=[\n    {id:\"recetas\",label:\"Recetas\",icon:\"📖\"},\n    {id:\"menu\",label:\"Menú Semanal\",icon:\"📅\"},\n    {id:\"compra\",label:\"Lista de Compra\",icon:\"🛒\"},\n  ];\n  const [detailId,setDetailId]=useState(null);"
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("detailId state")

# 5. Pass detailId and setDetailId to RecipesPage
old6 = "        {page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)}/>}"
new6 = "        {page===\"recetas\"&&<RecipesPage recipes={recipes} onAdd={addRecipe} onDelete={deleteRecipe} onUpdate={updateRecipe} weekMenu={weekMenu} setWeekMenu={setWeekMenu} currentWeekOffset={currentWeekOffset} apiKey={apiKey} onNeedKey={()=>setApiKeyOpen(true)} detailId={detailId} setDetailId={setDetailId}/>}"
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("pass detailId to RecipesPage")

# 6. Nav button clears detailId when clicking Recetas
old7 = "      {navItems.map(item=>(\n            <button key={item.id} onClick={()=>{setPage(item.id);}}"
new7 = "      {navItems.map(item=>(\n            <button key={item.id} onClick={()=>{setPage(item.id);if(item.id===\"recetas\")setDetailId(null);}}"
if old7 in content:
    content = content.replace(old7, new7)
    fixes.append("nav clears detail")

# 7. RecipesPage - use detailId prop
old8 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,setWeekMenu,currentWeekOffset,apiKey,onNeedKey}){"
new8 = "function RecipesPage({recipes,onAdd,onDelete,onUpdate,weekMenu,setWeekMenu,currentWeekOffset,apiKey,onNeedKey,detailId,setDetailId}){"
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("RecipesPage accepts detailId")

# 8. RecipesPage detail logic - use detailId
old9 = "  const [detail,setDetail]=useState(null);"
new9 = "  const detail=detailId?recipes.find(r=>r.id===detailId)||null:null;\n  const setDetail=(r)=>setDetailId?setDetailId(r?r.id:null):null;"
if old9 in content:
    content = content.replace(old9, new9)
    fixes.append("detail uses detailId")

# 9. Scroll to top in RecipeDetail using useEffect
old10 = "function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,setWeekMenu,currentWeekOffset}){\n  const [editIngOpen,setEditIngOpen]=useState(false);"
new10 = "function RecipeDetail({recipe,onBack,onDelete,onUpdate,weekMenu,setWeekMenu,currentWeekOffset}){\n  const detailRef=useRef(null);\n  useEffect(()=>{if(detailRef.current){detailRef.current.closest('[data-scroll]')?.scrollTo(0,0);window.scrollTo(0,0);}},[recipe?.id]);\n  const [editIngOpen,setEditIngOpen]=useState(false);"
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("scroll to top on detail")

# 10. Wrap detail content with ref
old11 = "    <div style={{maxWidth:720,margin:\"0 auto\",padding:\"20px 20px\"}}>"
new11 = "    <div ref={detailRef} style={{maxWidth:720,margin:\"0 auto\",padding:\"20px 20px\"}}>"
if old11 in content:
    content = content.replace(old11, new11)
    fixes.append("detail ref")

# 11. Add data-scroll to main content div
old12 = '      <div style={{flex:1,overflowY:"auto",minWidth:0}}>'
new12 = '      <div data-scroll="true" id="main-scroll" style={{flex:1,overflowY:"auto",minWidth:0}}>'
if old12 in content:
    content = content.replace(old12, new12)
    fixes.append("main scroll id")

# 12. Better scroll to top - scroll the main container
old13 = "  useEffect(()=>{if(detailRef.current){detailRef.current.closest('[data-scroll]')?.scrollTo(0,0);window.scrollTo(0,0);}},[recipe?.id]);"
new13 = "  useEffect(()=>{const el=document.getElementById('main-scroll');if(el)el.scrollTo({top:0,behavior:'instant'});window.scrollTo(0,0);},[recipe?.id]);"
if old13 in content:
    content = content.replace(old13, new13)
    fixes.append("scroll to top improved")

# 13. Image in recipe card - add click to upload
old14 = """        {recipe.image?<img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:"#9CA3AF"}}><span style={{fontSize:36}}>🍽️</span></div>}"""
new14 = """        {recipe.image?<img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<CardImageUpload recipe={recipe} onUpdate={onUpdate}/>}"""
if old14 in content:
    content = content.replace(old14, new14)
    fixes.append("card image upload")

# 14. Add CardImageUpload component before RecipeCard
card_img_component = """
function CardImageUpload({recipe,onUpdate}){
  const fileRef=useRef();
  function handleUpload(e){
    e.stopPropagation();
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>onUpdate({...recipe,image:reader.result});
    reader.readAsDataURL(file);
  }
  return(
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,color:"#C4C4C4",background:"#F9FAFB"}}
      onClick={e=>{e.stopPropagation();fileRef.current.click();}}>
      <span style={{fontSize:32}}>📷</span>
      <span style={{fontSize:11,fontWeight:500}}>Añadir foto</span>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/>
    </div>
  );
}

"""
if "function RecipeCard(" in content:
    content = content.replace("function RecipeCard(", card_img_component + "function RecipeCard(")
    fixes.append("CardImageUpload added")

# 15. Pass onUpdate to RecipeCard
old15 = "{filtered.map(r=><RecipeCard key={r.id} recipe={r} onOpen={setDetail} onDelete={onDelete} onAddMenu={setAddMenuRecipe}/>)}"
new15 = "{filtered.map(r=><RecipeCard key={r.id} recipe={r} onOpen={setDetail} onDelete={onDelete} onAddMenu={setAddMenuRecipe} onUpdate={onUpdate}/>)}"
if old15 in content:
    content = content.replace(old15, new15)
    fixes.append("onUpdate passed to RecipeCard")

# 16. RecipeCard accepts onUpdate
old16 = "function RecipeCard({recipe,onOpen,onDelete,onAddMenu}){"
new16 = "function RecipeCard({recipe,onOpen,onDelete,onAddMenu,onUpdate}){"
if old16 in content:
    content = content.replace(old16, new16)
    fixes.append("RecipeCard accepts onUpdate")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
