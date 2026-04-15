#!/usr/bin/env python3
# fix_v10.py

content = open('src/App.jsx').read()
fixes = []

# 1. Add new categories to SHOPPING_CATS
old1 = """const SHOPPING_CATS = [
  {id:"carnes",label:"Carnes",emoji:"🥩"},
  {id:"fiambres",label:"Fiambres y Embutidos",emoji:"🥓"},
  {id:"pescados",label:"Pescados y Mariscos",emoji:"🐟"},
  {id:"verduras",label:"Verduras y Hortalizas",emoji:"🥦"},
  {id:"frutas",label:"Frutas",emoji:"🍎"},
  {id:"lacteos",label:"Lacteos y Huevos",emoji:"🥚"},
  {id:"cereales",label:"Cereales y Legumbres",emoji:"🌾"},
  {id:"conservas",label:"Conservas y Salsas",emoji:"🥫"},
  {id:"especias",label:"Especias y Condimentos",emoji:"🧂"},
  {id:"otros",label:"Otros",emoji:"🛒"},
];"""
new1 = """const SHOPPING_CATS = [
  {id:"carnes",label:"Carnes",emoji:"🥩"},
  {id:"fiambres",label:"Fiambres y Embutidos",emoji:"🥓"},
  {id:"pescados",label:"Pescados y Mariscos",emoji:"🐟"},
  {id:"congelados",label:"Congelados",emoji:"🧊"},
  {id:"verduras",label:"Verduras y Hortalizas",emoji:"🥦"},
  {id:"frutas",label:"Frutas",emoji:"🍎"},
  {id:"lacteos",label:"Lacteos y Huevos",emoji:"🥚"},
  {id:"cereales",label:"Cereales y Legumbres",emoji:"🌾"},
  {id:"conservas",label:"Conservas y Salsas",emoji:"🥫"},
  {id:"especias",label:"Especias y Condimentos",emoji:"🧂"},
  {id:"limpieza",label:"Limpieza y Bano",emoji:"🧹"},
  {id:"otros",label:"Otros",emoji:"🛒"},
];"""
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("new categories added")

# 2. Update guessCategory with new categories
old2 = "function guessCategory(name){"
end_marker = "\n  return\"otros\";\n}"
start_idx = content.find(old2)
end_idx = content.find(end_marker, start_idx) + len(end_marker)

new_guesscat = """function guessCategory(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim();
  // Sal y azucar -> especias
  if(n==="sal"||/^sal\\s/.test(n)||n==="azucar"||/^azucar\\b/.test(n))return"especias";
  // Caldo -> conservas
  if(/\\bcaldo\\b/.test(n))return"conservas";
  // Limpieza y bano
  if(/jabon|champu|gel de ducha|pasta de dientes|cepillo de dientes|cepillo oidos|compresas|salvaslip|desodorante|papel (del )?water|papel higienico|lejia|suavizante|lavaplatos|lavavajillas|limpiacristales|detergente|estropajo|\\bmopa\\b|fregona|\\bcubo\\b|escoba|recogedor|limpiamopas|limpiamuebles|bayeta|papel cocina|bolsas basura/.test(n))return"limpieza";
  // Congelados
  if(/croqueta|empanadilla|gyoza|tortilla de camaron|\\bpizza\\b|helado|tempura|nuggets|bastones de pescado|guisantes congelados|espinacas congeladas|verduras congeladas|patatas fritas congeladas|precocinado/.test(n))return"congelados";
  // Fiambres
  if(/jamon (york|cocido|dulce|serrano|iberico)|salchichon|fuet|mortadela|chopped|pavo fiambre|pechuga (pavo|pollo) (fiambre|cocida)|fiambre|embutido|sobrasada|lomo embuchado|cecina|salami|pepperoni/.test(n))return"fiambres";
  // Carnes
  if(/\\bpollo\\b|\\bcarne\\b|\\bcerdo\\b|ternera|\\bjamon\\b|chorizo|morcilla|panceta|costill|buey|cordero|\\bpavo\\b|\\bpato\\b|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|\\blomo\\b|solomillo|codillo|carrillada|chuleta|albondiga|hamburguesa|tocino|papada|lacon/.test(n))return"carnes";
  // Pescados
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja|pulpo|lenguado|trucha|anchoa|caballa/.test(n))return"pescados";
  // Verduras
  if(/tomate|cebolla|\\baj[oa]|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|\\bapio\\b|pepino|brocoli|coliflor|alcachofa|judia verde|judias verdes|acelga|champin|champinon|seta|portobello|calabaza|esparrago|guisante|haba|boniato|batata|\\bcol\\b|repollo|kale|canonigo|rucola|endivia|cebolleta|cebollino|maiz dulce|verdura|hortaliza|nabo|chiriva/.test(n))return"verduras";
  // Frutas
  if(/manzana|naranja|limon|platano|fresa|\\buva\\b|\\bpera\\b|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|\\bpina\\b|fruta|frambuesa|mora|arandano|granada|higo|ciruela|pomelo|mandarina|lima|coco|aguacate|fruto seco|almendra|nuez|pistacho|anacardo|avellana|cacahuete/.test(n))return"frutas";
  // Lacteos
  if(/\\bleche\\b|queso|yogur|\\bnata\\b|mantequilla|huevo|crema (de leche|agria)|requeson|mozzarella|parmesano|ricotta|mascarpone|manchego|brie|feta/.test(n))return"lacteos";
  // Cereales y legumbres
  if(/\\barroz\\b|espagueti|macarron|tallar|lasana|tortellini|ravioli|canelone|\\bfideo|\\bpasta\\b|cuscus|bulgur|avena|\\btrigo\\b|quinoa|garbanzo|lenteja|alubia|judia blanca|judia pinta|\\bharina\\b|\\bpan\\b/.test(n))return"cereales";
  // Conservas y salsas
  if(/tomate frito|salsa (de tomate|bechamel|carbonara|bolonesa|pesto)|conserva|lata de|bote de|aceitunas|alcaparra|pepinillo|concentrado|sofrito|pisto/.test(n))return"conservas";
  // Especias y condimentos
  if(/pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|\\baceite\\b|vinagre|canela|nuez moscada|clavo|especias|condimento|mostaza|ketchup|mayonesa|\\bsoja\\b|tabasco|curcuma|jengibre|cayena|guindilla|paprika|anis|hierbas|aliño|perejil|albahaca|cilantro|eneldo|estragón|mejorana|menta|hierbabuena/.test(n))return"especias";
  return"otros";
}"""

if start_idx >= 0:
    content = content[:start_idx] + new_guesscat + content[end_idx:]
    fixes.append("guessCategory updated with new categories")

# 3. Fix three dots button - make them black/visible
old3 = 'style={{width:28,height:28,borderRadius:50,background:"rgba(255,255,255,.92)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,.12)"}}>⋮</button>'
new3 = 'style={{width:28,height:28,borderRadius:50,background:"rgba(255,255,255,.95)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 6px rgba(0,0,0,.25)",color:"#111",fontWeight:900,fontSize:18}}>⋮</button>'
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("three dots black")

# 4. Fix title "Anadir Receta" -> "Añadir Receta"
old4 = 'title="Anadir Receta"'
new4 = 'title="Añadir Receta"'
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("title fixed")

# 5. Clear URL input after import
old5 = """      const TABS=[{id:"buscar",label:"🔍 Buscar"},{id:"enlace",label:"🔗 Enlace"},{id:"video",label:"🎥 Video"},{id:"foto",label:"📷 Foto"},{id:"texto",label:"📝 Texto"}];"""
new5 = """      const TABS=[{id:"buscar",label:"🔍 Buscar"},{id:"enlace",label:"🔗 Enlace"},{id:"video",label:"🎥 Video"},{id:"foto",label:"📷 Foto"},{id:"texto",label:"📝 Texto"}];
      useEffect(()=>{setUrl("");setQuery("");setText("");setError("");},[tab]);"""
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("clear inputs on tab change")

# 6. Fix RecipeImageSection - always show when no image (including for search/video results)
# The issue is that when image="" the section shows upload but after saving to supabase
# the image field might be undefined. Make sure we always show the upload option
old6 = """function RecipeImageSection({recipe,onUpdate}){
  const fileRef=useRef();
  function handleUpload(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>onUpdate({...recipe,image:r.result});r.readAsDataURL(file);}
  if(recipe.image){return(<div style={{borderRadius:14,overflow:"hidden",marginBottom:14,height:260,position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current.click()}><img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentNode.style.display="none"}}/><div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.5)",borderRadius:7,padding:"5px 9px",color:"#fff",fontSize:11}}>📷 Cambiar</div><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);}
  return(<div style={{borderRadius:14,marginBottom:14,height:140,background:"#F9FAFB",border:"2px dashed #E5E7EB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:6}} onClick={()=>fileRef.current.click()}><span style={{fontSize:36}}>📷</span><span style={{color:"#9CA3AF",fontSize:13}}>Añadir foto</span><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);
}"""
new6 = """function RecipeImageSection({recipe,onUpdate}){
  const fileRef=useRef();
  const [imgError,setImgError]=useState(false);
  function handleUpload(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{onUpdate({...recipe,image:r.result});setImgError(false);};r.readAsDataURL(file);}
  const hasValidImg=recipe.image&&!imgError;
  if(hasValidImg){return(<div style={{borderRadius:14,overflow:"hidden",marginBottom:14,height:260,position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current.click()}><img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgError(true)}/><div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.5)",borderRadius:7,padding:"5px 9px",color:"#fff",fontSize:11}}>📷 Cambiar</div><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);}
  return(<div style={{borderRadius:14,marginBottom:14,height:140,background:"#F9FAFB",border:"2px dashed #E5E7EB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:6}} onClick={()=>fileRef.current.click()}><span style={{fontSize:36}}>📷</span><span style={{color:"#9CA3AF",fontSize:13}}>Añadir foto</span><input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}}/></div>);
}"""
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("RecipeImageSection fixed with error state")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
