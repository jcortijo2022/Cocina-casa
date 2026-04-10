#!/usr/bin/env python3
# patch_v3.py - Ejecuta desde la raiz del proyecto

content = open('src/App.jsx').read()
fixes = []

# 1. Fix grid layout - responsive, no overflow
old1 = "      <div style={{display:\"grid\",gridTemplateColumns:\"repeat(4,1fr)\",gap:14}}>"
new1 = "      <div style={{display:\"grid\",gridTemplateColumns:\"repeat(auto-fill,minmax(220px,1fr))\",gap:14}}>"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("grid responsive")

# 2. Fix sidebar width and main content
old2 = "    <div style={{display:\"flex\",height:\"100vh\",width:\"100vw\",fontFamily:\"'Segoe UI',system-ui,sans-serif\",background:\"#F8F7F4\",overflow:\"hidden\"}}>"
new2 = "    <div style={{display:\"flex\",height:\"100vh\",width:\"100%\",maxWidth:\"100vw\",fontFamily:\"'Segoe UI',system-ui,sans-serif\",background:\"#F8F7F4\",overflow:\"hidden\"}}>"
if old2 in content:
    content = content.replace(old2, new2)
    fixes.append("layout width")

# 3. Recipe card - add image upload button when no image
old3 = """        {recipe.image?<img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>🍽️</div>}"""
new3 = """        {recipe.image?<img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>:<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:"#9CA3AF"}}><span style={{fontSize:36}}>🍽️</span></div>}"""
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("card placeholder")

# 4. Recipe detail - star rating right aligned, source url left aligned
old4 = """      <div style={{display:"flex",alignItems:"center",gap:20,padding:"16px",background:"#FFF7ED",borderRadius:14,marginBottom:24}}>
        <button onClick={()=>setAddMenuOpen(true)}
          style={{padding:"10px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
          📅 Añadir al menú semanal
        </button>
        <div>
          <p style={{margin:"0 0 4px",fontSize:12,color:"#9CA3AF",fontWeight:600}}>Tu valoración</p>
          <StarRating value={recipe.rating} onChange={v=>updateField("rating",v)} size={22}/>
        </div>
      </div>"""
new4 = """      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px",background:"#FFF7ED",borderRadius:14,marginBottom:24}}>
        <button onClick={()=>setAddMenuOpen(true)}
          style={{padding:"10px 20px",background:"#F97316",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
          📅 Añadir al menú semanal
        </button>
        <div style={{textAlign:"right"}}>
          <p style={{margin:"0 0 4px",fontSize:12,color:"#9CA3AF",fontWeight:600}}>Tu valoración</p>
          <StarRating value={recipe.rating} onChange={v=>updateField("rating",v)} size={22}/>
        </div>
      </div>"""
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("stars right aligned")

# 5. Source url left aligned (already left but ensure)
old5 = """        <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{display:"inline-flex",alignItems:"center",gap:6,color:"#F97316",fontWeight:600,fontSize:14,marginBottom:16,textDecoration:"none"}}>
          🔗 Ver fuente original
        </a>"""
new5 = """        <div style={{textAlign:"left",marginBottom:16}}>
          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:6,color:"#F97316",fontWeight:600,fontSize:14,textDecoration:"none"}}>
            🔗 Ver fuente original
          </a>
        </div>"""
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("source url left")

# 6. Better category detection
old6 = """function guessCategory(name){
  const n=name.toLowerCase();
  if(/pollo|carne|cerdo|ternera|jamon|chorizo|morcilla|panceta|costill|buey|cordero|pavo|pato|conejo|pechuga|salchich|bacon|butifarra|longaniza|filete/.test(n))return"carnes";
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja/.test(n))return"pescados";
  if(/tomate|cebolla|ajo|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|apio|pepino|brocoli|coliflor|alcachofa|judia|judias|verde|acelga|nabo|rabano|apio|champin|seta|calabaza|esparrago/.test(n))return"verduras";
  if(/manzana|naranja|limon|platano|fresa|uva|pera|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|pina|fruta|frutos/.test(n))return"frutas";
  if(/leche|queso|yogur|nata|mantequilla|huevo|huevos|crema|requesón|mozzarella/.test(n))return"lacteos";
  if(/arroz|pasta|fideos|garbanz|lenteja|judia seca|alubia|harina|pan|maiz|cereal|quinoa|espagueti|macarron/.test(n))return"cereales";
  if(/tomate frito|salsa|conserva|lata|bote|aceitunas|alcaparra|pepinillo|atun en lata/.test(n))return"conservas";
  if(/sal|pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|aceite|vinagre|canela|nuez moscada|clavo|cardamomo|especias|condimento/.test(n))return"especias";
  return"otros";
}"""
new6 = """function guessCategory(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");
  // Carnes
  if(/pollo|carne|cerdo|ternera|jamon|chorizo|morcilla|panceta|costill|costilla|buey|cordero|pavo|pato|conejo|pechuga|salchich|bacon|butifarra|longaniza|filete|magro|lomo|solomillo|codillo|carrillada|secreto iberico|pluma|presa|cabrito|liebre|perdiz|codorniz|venado|res/.test(n))return"carnes";
  // Pescados
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja|berberecho|navaja|ostra|pulpo|jibia|choco|lenguado|rodaballo|trucha|boquerón|anchoa|caballa|jurel|emperador/.test(n))return"pescados";
  // Verduras - lista muy amplia
  if(/tomate|cebolla|ajo|pimiento|patata|papa|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|apio|pepino|brocoli|coliflor|alcachofa|judia verde|judias verdes|acelga|nabo|rabano|champin|champinon|seta|calabaza|esparrago|guisante|habas|pak choi|apio|boniato|batata|nabo|col|repollo|kale|canónigos|rucola|endivia|escarola|pimiento verde|pimiento rojo|pimiento amarillo|cebolleta|cebollino|perejil|albahaca|cilantro|menta|hierbabuena|romero|tomillo/.test(n))return"verduras";
  // Frutas
  if(/manzana|naranja|limon|platano|fresa|uva|pera|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|pina|fruta|frutos rojos|frambuesa|mora|arandano|granada|higo|datil|ciruela|pomelo|mandarina|lima|coco|papaya/.test(n))return"frutas";
  // Lacteos
  if(/leche|queso|yogur|nata|mantequilla|huevo|crema|requeson|mozzarella|parmesano|ricotta|mascarpone|burgos|manchego|brie|camembert|roquefort|gorgonzola|lacton|lacteo|feta/.test(n))return"lacteos";
  // Cereales y legumbres
  if(/arroz|pasta|fideo|garbanzo|lenteja|alubia|harina|pan|maiz|cereal|quinoa|espagueti|macarron|tallarín|lasana|cuscus|bulgur|avena|trigo|centeno|cebada|mijo|amaranto|tapioca|polenta|semola/.test(n))return"cereales";
  // Conservas
  if(/tomate frito|salsa|conserva|lata|bote|aceitunas|alcaparra|pepinillo|atun lata|mejillones lata|berberecho lata|anchoa lata|caldo|concentrado|sofrito|pisto/.test(n))return"conservas";
  // Especias y condimentos
  if(/sal |pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|aceite|vinagre|canela|nuez moscada|clavo|cardamomo|especias|condimento|mostaza|ketchup|mayonesa|soja|tabasco|worcestershire|ras el hanout|curcuma|jengibre|cilantro molido|cayena|guindilla|páprika|anis|hinojo/.test(n))return"especias";
  return"otros";
}"""
if old6 in content:
    content = content.replace(old6, new6)
    fixes.append("mejor categorizacion")

# 7. Navigation - clicking Recetas goes to recipe list
old7 = "      {navItems.map(item=>(\n            <button key={item.id} onClick={()=>setPage(item.id)}"
new7 = "      {navItems.map(item=>(\n            <button key={item.id} onClick={()=>{setPage(item.id);}}"
# This is already correct, skip

# 8. Add image upload to recipe detail when no image
old8 = """      {recipe.image&&(
        <div style={{borderRadius:16,overflow:"hidden",marginBottom:16,height:300}}>
          <img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentNode.style.display="none"}}/>
        </div>
      )}"""
new8 = """      <RecipeImageSection recipe={recipe} onUpdate={onUpdate}/>"""
if old8 in content:
    content = content.replace(old8, new8)
    fixes.append("image section component")

# 9. Add RecipeImageSection component before RecipeDetail
img_component = """
function RecipeImageSection({recipe,onUpdate}){
  const fileRef=useRef();
  function handleImageUpload(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>onUpdate({...recipe,image:reader.result});
    reader.readAsDataURL(file);
  }
  if(recipe.image){
    return(
      <div style={{borderRadius:16,overflow:"hidden",marginBottom:16,height:280,position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current.click()}>
        <img src={recipe.image} alt={recipe.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentNode.style.background="#F3F4F6";}}/>
        <div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.5)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:12,cursor:"pointer"}}>📷 Cambiar foto</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
      </div>
    );
  }
  return(
    <div style={{borderRadius:16,marginBottom:16,height:180,background:"#F9FAFB",border:"2px dashed #E5E7EB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:8}} onClick={()=>fileRef.current.click()}>
      <span style={{fontSize:40}}>📷</span>
      <span style={{color:"#9CA3AF",fontSize:14,fontWeight:500}}>Añadir foto de la receta</span>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
    </div>
  );
}

"""

if "function RecipeDetail(" in content:
    content = content.replace("function RecipeDetail(", img_component + "function RecipeDetail(")
    fixes.append("RecipeImageSection added")

# 10. Fix steps to not be summarized - improve prompt
old10 = 'const PROMPT_SUFFIX="mealType debe ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros. recipeType debe ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos. Infiere el mealType y recipeType correctamente segun el plato. Si puedes encontrar la URL de una imagen real del plato ponla en image.";'
new10 = 'const PROMPT_SUFFIX="mealType debe ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros. recipeType debe ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos. Infiere el mealType y recipeType correctamente segun el plato. Si puedes encontrar la URL de una imagen real del plato ponla en image. Los pasos de preparacion deben ser COMPLETOS y DETALLADOS, sin resumir. Cada paso debe explicar exactamente que hacer, con tiempos, temperaturas y tecnicas. No omitas ningun detalle importante.";'
if old10 in content:
    content = content.replace(old10, new10)
    fixes.append("steps detailed prompt")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
