#!/usr/bin/env python3
# fix_issues.py
content = open('src/App.jsx').read()
fixes = []

# 1. Fix normalizeIngKey - more aggressive grouping
old1 = "function normalizeIngKey(name){"
end1 = "\n}"
start_idx = content.find(old1)
end_idx = content.find(end1, start_idx) + len(end1)

new_func1 = """function normalizeIngKey(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim();
  if(/aceite/.test(n))return"aceite";
  if(/\\barroz\\b/.test(n))return"arroz";
  if(/\\bcaldo\\b/.test(n))return"caldo";
  if(/\\bceboll/.test(n))return"cebolla";
  if(/\\btomate\\b/.test(n)&&!/frito|triturado|concentrado|salsa/.test(n))return"tomate";
  if(/\\baj[oa]s?\\b/.test(n))return"ajo";
  if(n==="sal"||/^sal\\s/.test(n)||/\\bsal\\s*(gorda|fina|marina|comun)?$/.test(n))return"sal";
  if(/\\bazucar\\b/.test(n))return"azucar";
  if(/\\bhuevo/.test(n))return"huevo";
  if(/\\bleche\\b/.test(n))return"leche";
  if(/\\bharina\\b/.test(n))return"harina";
  if(/\\bpimiento\\b/.test(n))return"pimiento";
  if(/\\bpatata/.test(n))return"patata";
  if(/\\bzanahoria/.test(n))return"zanahoria";
  if(/\\bqueso\\b/.test(n))return"queso";
  if(/\\bmantequilla\\b/.test(n))return"mantequilla";
  if(/espagueti|macarron|tallar|lasana|\\bfideo/.test(n))return"pasta";
  if(/\\bpan\\b/.test(n)&&!/pan(ceta|ado)/.test(n))return"pan";
  if(/\\bchocolate\\b/.test(n))return"chocolate";
  if(/\\bvinagre\\b/.test(n))return"vinagre";
  if(/\\bpimienta\\b/.test(n))return"pimienta";
  return n;
}"""

if start_idx >= 0:
    content = content[:start_idx] + new_func1 + content[end_idx:]
    fixes.append("normalizeIngKey rewritten")

# 2. Fix guessCategory - caldo to conservas, sal/azucar to especias
old2 = "function guessCategory(name){"
end2_marker = "\n  return\"otros\";\n}"
start_idx2 = content.find(old2)
end_idx2 = content.find(end2_marker, start_idx2) + len(end2_marker)

new_guesscat = """function guessCategory(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").trim();
  // Sal y azucar -> especias (antes que cualquier otro)
  if(n==="sal"||/^sal\\s/.test(n)||/^sal$/.test(n))return"especias";
  if(/\\bazucar\\b/.test(n))return"especias";
  // Caldo -> conservas (IMPORTANTE: antes que carnes)
  if(/\\bcaldo\\b/.test(n))return"conservas";
  // Fiambres
  if(/jamon (york|cocido|dulce|serrano|iberico)|salchichon|fuet|mortadela|chopped|pavo fiambre|pechuga (pavo|pollo) (fiambre|cocida)|fiambre|embutido|sobrasada|lomo embuchado|cecina|salami|pepperoni/.test(n))return"fiambres";
  // Carnes
  if(/\\bpollo\\b|\\bcarne\\b|\\bcerdo\\b|ternera|\\bjamon\\b|chorizo|morcilla|panceta|costill|buey|cordero|\\bpavo\\b|\\bpato\\b|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|\\blomo\\b|solomillo|codillo|carrillada|chuleta|albondiga|hamburguesa/.test(n))return"carnes";
  // Pescados
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja|pulpo|lenguado|trucha|anchoa|caballa/.test(n))return"pescados";
  // Verduras
  if(/tomate|cebolla|\\baj[oa]|pimiento|patata|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|\\bapio\\b|pepino|brocoli|coliflor|alcachofa|judia verde|acelga|champin|champinon|seta|portobello|calabaza|esparrago|guisante|haba|boniato|batata|\\bcol\\b|repollo|kale|canonigo|rucola|endivia|cebolleta|cebollino|maiz dulce|verdura|hortaliza/.test(n))return"verduras";
  // Frutas
  if(/manzana|naranja|limon|platano|fresa|\\buva\\b|\\bpera\\b|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|\\bpina\\b|fruta|frambuesa|mora|arandano|granada|higo|ciruela|pomelo|mandarina|lima|coco|aguacate|fruto seco|almendra|nuez|pistacho|anacardo|avellana|cacahuete/.test(n))return"frutas";
  // Lacteos
  if(/\\bleche\\b|queso|yogur|\\bnata\\b|mantequilla|huevo|crema (de leche|agria)|requeson|mozzarella|parmesano|ricotta|mascarpone|manchego|brie|feta/.test(n))return"lacteos";
  // Cereales y legumbres
  if(/\\barroz\\b|espagueti|macarron|tallar|lasana|\\bfideo|\\bpasta\\b|cuscus|bulgur|avena|\\btrigo\\b|quinoa|garbanzo|lenteja|alubia|\\bharina\\b|\\bpan\\b/.test(n))return"cereales";
  // Conservas y salsas
  if(/tomate frito|salsa (de tomate|bechamel|carbonara|boloñesa|pesto)|conserva|lata de|bote de|aceitunas|alcaparra|pepinillo|concentrado|sofrito|pisto/.test(n))return"conservas";
  // Especias y condimentos
  if(/pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|\\baceite\\b|vinagre|canela|nuez moscada|clavo|especias|condimento|mostaza|ketchup|mayonesa|\\bsoja\\b|tabasco|curcuma|jengibre|cayena|guindilla|paprika|anis|hierbas|aliño/.test(n))return"especias";
  return"otros";
}"""

if start_idx2 >= 0:
    content = content[:start_idx2] + new_guesscat + content[end_idx2:]
    fixes.append("guessCategory rewritten")

# 3. Mobile drag & drop - replace drag events with touch events in recipe items
old3 = """{items.map(r=>(<div key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("recipe",JSON.stringify({recipe:r,fromDay:day,fromSlot:slot}))} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",background:"#F3F4F6",borderRadius:7,marginBottom:5,fontSize:11,cursor:"grab"}}>
                  <span style={{color:"#C4C4C4",fontSize:9}}>⠿</span>
                  <span style={{flex:1,fontWeight:500,color:"#111"}}>{r.title}</span>
                  <button onClick={()=>removeFromMenu(day,slot,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:12,padding:1}}>×</button>
                </div>))}"""

new3 = """{items.map(r=>(<div key={r.id}
                  draggable
                  onDragStart={e=>e.dataTransfer.setData("recipe",JSON.stringify({recipe:r,fromDay:day,fromSlot:slot}))}
                  onTouchStart={e=>{window._dragData={recipe:r,fromDay:day,fromSlot:slot};e.currentTarget.style.opacity="0.5";}}
                  onTouchEnd={e=>{e.currentTarget.style.opacity="1";if(window._dropTarget){const{toDay,toSlot}=window._dropTarget;if(!(toDay===day&&toSlot===slot)){handleDrop(null,toDay,toSlot,window._dragData);}window._dropTarget=null;}window._dragData=null;}}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",background:"#F3F4F6",borderRadius:7,marginBottom:5,fontSize:11,cursor:"grab"}}>
                  <span style={{color:"#C4C4C4",fontSize:9}}>⠿</span>
                  <span style={{flex:1,fontWeight:500,color:"#111"}}>{r.title}</span>
                  <button onClick={()=>removeFromMenu(day,slot,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:12,padding:1}}>×</button>
                </div>))}"""

if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("touch drag start/end added")

# 4. Fix drop zones for touch
old4 = """                onDragOver={e=>e.preventDefault()}
                onDrop={e=>handleDrop(e,day,slot)}>"""
new4 = """                onDragOver={e=>e.preventDefault()}
                onDrop={e=>handleDrop(e,day,slot)}
                onTouchMove={e=>{
                  const t=e.touches[0];
                  const el=document.elementFromPoint(t.clientX,t.clientY);
                  const cell=el?.closest("[data-day][data-slot]");
                  if(cell)window._dropTarget={toDay:cell.dataset.day,toSlot:cell.dataset.slot};
                }}
                data-day={day} data-slot={slot}>"""
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("touch drop zones added")

# 5. Fix handleDrop to also accept touch data
old5 = """  function handleDrop(e,toDay,toSlot){
    e.preventDefault();
    try{
      const{recipe:r,fromDay,fromSlot}=JSON.parse(e.dataTransfer.getData("recipe"));"""
new5 = """  function handleDrop(e,toDay,toSlot,touchData=null){
    if(e)e.preventDefault();
    try{
      const{recipe:r,fromDay,fromSlot}=touchData||JSON.parse(e.dataTransfer.getData("recipe"));"""
if old5 in content:
    content = content.replace(old5, new5)
    fixes.append("handleDrop accepts touch data")

# 6. Capitalize first letter when adding to shopping list extra
old6 = "  function addExtra(){if(!newItem.trim())return;const n=cap(newItem.trim());setExtras(p=>[...p,{id:\"ex-\"+Date.now(),name:n,amount:\"\",unit:\"\",category:guessCategory(n)}]);setNewItem(\"\");}"
if old6 in content:
    fixes.append("addExtra already capitalizes")
else:
    # Find and fix addExtra
    old6b = "function addExtra(){"
    idx = content.find(old6b)
    if idx >= 0:
        end = content.find("}", idx) + 1
        new6b = "function addExtra(){if(!newItem.trim())return;const n=cap(newItem.trim());setExtras(p=>[...p,{id:\"ex-\"+Date.now(),name:n,amount:\"\",unit:\"\",category:guessCategory(n)}]);setNewItem(\"\");}"
        content = content[:idx] + new6b + content[end:]
        fixes.append("addExtra capitalize fixed")

open('src/App.jsx', 'w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
