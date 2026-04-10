#!/usr/bin/env python3
# patch_v6.py

content = open('src/App.jsx').read()
fixes = []

# 1. Mobile responsive layout - hamburger menu
old1 = '''const LogoSVG = () => (
  <img src="data:image/jpeg;base64,'''
# Find and add mobile state to App
old_app_start = 'export default function App(){'
new_app_start = '''function useIsMobile(){
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener('resize',h);
    return()=>window.removeEventListener('resize',h);
  },[]);
  return isMobile;
}

export default function App(){'''
if old_app_start in content:
    content=content.replace(old_app_start,new_app_start)
    fixes.append('useIsMobile hook')

# 2. Add sidebarOpen state and mobile sidebar
old2 = '  const [detailId,setDetailId]=useState(null);\n\n  async function saveMenuToSupabase'
new2 = '  const [detailId,setDetailId]=useState(null);\n  const isMobile=useIsMobile();\n  const [sidebarOpen,setSidebarOpen]=useState(false);\n\n  async function saveMenuToSupabase'
if old2 in content:
    content=content.replace(old2,new2)
    fixes.append('sidebarOpen state')

# 3. Mobile layout wrapper
old3 = '    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"\'Segoe UI\',system-ui,sans-serif",background:"#F8F7F4",overflow:"hidden",position:"fixed",top:0,left:0}}>'
new3 = '    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"\'Segoe UI\',system-ui,sans-serif",background:"#F8F7F4",overflow:"hidden",position:"fixed",top:0,left:0}}>\n      {isMobile&&sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:99}}/>}'
if old3 in content:
    content=content.replace(old3,new3)
    fixes.append('mobile overlay')

# 4. Make sidebar conditional width for mobile
old4 = '      <div style={{width:210,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0}}>'
new4 = '      <div style={{width:210,background:"#fff",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",flexShrink:0,position:isMobile?"fixed":"relative",top:isMobile?0:"auto",left:isMobile?(sidebarOpen?0:-210):"auto",height:isMobile?"100vh":"auto",zIndex:isMobile?100:"auto",transition:"left .25s",boxShadow:isMobile&&sidebarOpen?"4px 0 20px rgba(0,0,0,.15)":"none"}}>'
if old4 in content:
    content=content.replace(old4,new4)
    fixes.append('sidebar mobile')

# 5. Add hamburger button to main content top
old5 = '      <div data-scroll="true" id="main-scroll" style={{flex:1,overflowY:"auto",minWidth:0}}>'
new5 = '      <div data-scroll="true" id="main-scroll" style={{flex:1,overflowY:"auto",minWidth:0}}>\n        {isMobile&&<button onClick={()=>setSidebarOpen(v=>!v)} style={{position:"fixed",top:12,right:12,zIndex:98,background:"#F97316",border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",color:"#fff",fontSize:20,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>☰</button>}'
if old5 in content:
    content=content.replace(old5,new5)
    fixes.append('hamburger button')

# 6. Close sidebar on nav click for mobile
old6 = '            <button key={item.id} onClick={()=>{setPage(item.id);if(item.id==="recetas"){setDetailId(null);}}}'
new6 = '            <button key={item.id} onClick={()=>{setPage(item.id);if(item.id==="recetas"){setDetailId(null);}setSidebarOpen(false);}}'
if old6 in content:
    content=content.replace(old6,new6)
    fixes.append('close sidebar on nav')

# 7. Copyright position - move above API key button
old7 = '''        <div style={{padding:"8px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",background:apiKey?"#F0FDF4":"#FFF7ED",color:apiKey?"#16A34A":"#F97316",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            {apiKey?"✅ API Key OK":"⚙️ Configurar API Key"}
          </button>
        </div>
        <div style={{padding:"6px 12px 10px"}}>
          <p style={{margin:0,fontSize:10,color:"#C4C4C4",lineHeight:1.6,textAlign:"center"}}>© Jesús Cortijo<br/>Abril 2026</p>
        </div>'''
new7 = '''        <div style={{padding:"6px 12px 4px"}}>
          <p style={{margin:0,fontSize:10,color:"#C4C4C4",lineHeight:1.6,textAlign:"center"}}>© Jesús Cortijo<br/>Abril 2026</p>
        </div>
        <div style={{padding:"4px 10px 10px",borderTop:"1px solid #F3F4F6"}}>
          <button onClick={()=>setApiKeyOpen(true)}
            style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E5E7EB",background:apiKey?"#F0FDF4":"#FFF7ED",color:apiKey?"#16A34A":"#F97316",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            {apiKey?"✅ API Key OK":"⚙️ Configurar API Key"}
          </button>
        </div>'''
if old7 in content:
    content=content.replace(old7,new7)
    fixes.append('copyright above api key')

# 8. Shopping list - capitalize first letter + group by product + sum quantities
old8 = '''  const ingredientMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const k=ing.name.toLowerCase().trim();if(!ingredientMap[k])ingredientMap[k]={...ing,id:k,category:guessCategory(ing.name)};});});});});'''
new8 = '''  const ingredientMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const k=ing.name.toLowerCase().trim();const capName=k.charAt(0).toUpperCase()+k.slice(1);if(!ingredientMap[k]){ingredientMap[k]={...ing,name:capName,id:k,category:guessCategory(ing.name),totalAmount:parseFloat(ing.amount)||0,unit:ing.unit};}else{const existing=ingredientMap[k];const newAmt=parseFloat(ing.amount)||0;if(existing.unit===ing.unit&&newAmt>0){existing.totalAmount=(existing.totalAmount||0)+newAmt;existing.amount=String(Math.round((existing.totalAmount)*10)/10);}}}); });});});
  Object.values(ingredientMap).forEach(i=>{if(i.totalAmount>0)i.amount=String(Math.round(i.totalAmount*10)/10);});'''
if old8 in content:
    content=content.replace(old8,new8)
    fixes.append('shopping list capitalize+group+sum')

# 9. Better category detection - more comprehensive
old9 = 'function guessCategory(name){\n  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");'
new9 = 'function guessCategory(name){\n  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim();'
if old9 in content:
    content=content.replace(old9,new9)
    fixes.append('guessCategory trim')

# 10. Improve image loading for search - add image search hint
old10 = '  const TPL=\'{"title":"TITULO","description":"DESCRIPCION breve","image":"https://URL-imagen-real-del-plato.jpg","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno","paso dos"],"sourceUrl":"","time":"30 min","servings":4}\';'
new10 = '  const TPL=\'{"title":"TITULO","description":"DESCRIPCION breve","image":"https://URL-imagen-real.jpg","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno completo","paso dos completo"],"sourceUrl":"","time":"30 min","servings":4}\';'
if old10 in content:
    content=content.replace(old10,new10)
    fixes.append('TPL updated')

# 11. For photo import - use the uploaded photo as recipe image
old11 = "  function handleImage(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const base64=reader.result.split(\",\")[1];importRecipe(\"Analiza esta imagen de receta. Extrae titulo, ingredientes y pasos. Devuelve JSON: \"+TPL+\" \"+PROMPT_SUFFIX,{type:file.type,data:base64});};reader.readAsDataURL(file);}"
new11 = "  function handleImage(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const base64=reader.result.split(\",\")[1];const dataUrl=reader.result;importRecipe(\"Analiza esta imagen de receta. Extrae titulo, ingredientes y pasos. Para el campo image pon exactamente este valor: USAR_FOTO_SUBIDA. Devuelve JSON: \"+TPL+\" \"+PROMPT_SUFFIX,{type:file.type,data:base64},dataUrl);};reader.readAsDataURL(file);}"
if old11 in content:
    content=content.replace(old11,new11)
    fixes.append('photo import uses uploaded image')

# 12. importRecipe accepts photoDataUrl parameter
old12 = "  async function importRecipe(prompt,imgData=null){"
new12 = "  async function importRecipe(prompt,imgData=null,photoDataUrl=null){"
if old12 in content:
    content=content.replace(old12,new12)
    fixes.append('importRecipe accepts photoDataUrl')

# 13. Use photoDataUrl when image is USAR_FOTO_SUBIDA
old13 = "      onAdd({id:Date.now(),title:data.title||\"Receta\",description:data.description||\"\"image:data.image||\"\","
# Find the onAdd call in importRecipe
old13 = "      onAdd({id:Date.now(),title:data.title||\"Receta\",description:data.description||\"\",image:data.image||\"\","
new13 = "      const finalImage=data.image===\"USAR_FOTO_SUBIDA\"?(photoDataUrl||\"\"): (data.image||photoDataUrl||\"\");\n      onAdd({id:Date.now(),title:data.title||\"Receta\",description:data.description||\"\",image:finalImage,"
if old13 in content:
    content=content.replace(old13,new13)
    fixes.append('use photo as image')

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
