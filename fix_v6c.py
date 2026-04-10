#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# Fix 1: photoDataUrl not defined - find exact location in importRecipe onAdd call
# The issue is in the finalImage line inside importRecipe function
lines = content.split('\n')
new_lines = []
for i, line in enumerate(lines):
    # Find the finalImage line that references photoDataUrl
    if 'const finalImage=data.image===' in line and 'USAR_FOTO_SUBIDA' in line:
        new_lines.append(line)
        fixes.append('finalImage line kept')
    elif 'photoDataUrl' in line and 'is not defined' not in line:
        new_lines.append(line)
    else:
        new_lines.append(line)
content = '\n'.join(new_lines)

# Fix 2: The real issue - importByUrl calls onAdd with finalImage but photoDataUrl not in scope
# Find the onAdd inside importByUrl and fix it
old2 = "      const finalImage2 = data.image || photoDataUrl || \"\";\n      onAdd({id:Date.now(),title:data.title||\"Receta\",description:data.description||\"\",image:finalImage2,"
if old2 in content:
    fixes.append("finalImage2 already present")
else:
    # Find onAdd in importByUrl and add photoDataUrl=null
    content2 = ""
    in_importByUrl = False
    found_onAdd = False
    for line in content.split('\n'):
        if 'async function importByUrl' in line:
            in_importByUrl = True
        if in_importByUrl and 'onAdd({id:Date.now()' in line and not found_onAdd:
            content2 += "      const finalImage2 = data.image || \"\";\n"
            line = line.replace('image:data.image||"",', 'image:finalImage2,')
            found_onAdd = True
            in_importByUrl = False
            fixes.append("fixed importByUrl onAdd image")
        content2 += line + '\n'
    content = content2.rstrip('\n')

# Fix 3: Completely rewrite guessCategory with much better detection
old3_start = "function guessCategory(name){"
old3_end = "  return\"otros\";\n}"

start_idx = content.find(old3_start)
end_idx = content.find(old3_end, start_idx) + len(old3_end)

if start_idx >= 0 and end_idx > start_idx:
    new_category = '''function guessCategory(name){
  const n=name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  // Fiambres y embutidos - antes que carnes para no confundir
  if(/jamon (york|cocido|dulce|serrano|iberico|pata negra)|salchichon|fuet|mortadela|chopped|pavo (fiambre|cocido)|pechuga (pavo|pollo) (fiambre|cocida)|fiambre|embutido|sobrasada|lomo embuchado|cecina|bresaola|salami|pepperoni/.test(n))return"fiambres";
  // Carnes
  if(/pollo|carne (de |picada|molida)?|cerdo|ternera|jamon|chorizo|morcilla|panceta|costill|buey|cordero|pavo|pato|conejo|pechuga|salchicha|bacon|butifarra|longaniza|filete|magro|lomo|solomillo|codillo|carrillada|secreto|pluma iberic|cabrito|liebre|perdiz|codorniz|venado|res |chuleta|costillar|albondiga|hamburguesa/.test(n))return"carnes";
  // Pescados y mariscos
  if(/pescado|atun|salmon|merluza|mejillon|gamba|marisco|calamar|sepia|bacalao|sardina|boqueron|rape|lubina|dorada|langostino|chirla|almeja|berberecho|navaja|ostra|pulpo|jibia|choco|lenguado|rodaballo|trucha|anchoa|caballa|jurel|emperador|surimi|langosta|bogavante|centollo|nécora|vieira/.test(n))return"pescados";
  // Verduras y hortalizas - lista muy amplia
  if(/tomate|cebolla|ajo|pimiento|patata|papa|zanahoria|lechuga|espinaca|berenjena|calabacin|puerro|apio|pepino|brocoli|coliflor|alcachofa|judia verde|judias verdes|acelga|nabo|rabano|champin|champinon|seta|portobello|shiitake|calabaza|esparrago|guisante|haba|pak choi|boniato|batata|col |repollo|kale|canonigo|rucola|endivia|escarola|cebolleta|cebollino|perejil fresco|albahaca fresca|cilantro fresco|menta fresca|hierbabuena|romero fresco|tomillo fresco|verdura|hortaliza|berro|hinojo fresco|apio fresco|maiz dulce|elote|pimiento morrón/.test(n))return"verduras";
  // Frutas
  if(/manzana|naranja|limon|platano|fresa|uva|pera|melocoton|albaricoque|cereza|sandia|melon|kiwi|mango|pina|fruta|frutos rojos|frambuesa|mora|arandano|granada|higo|datil|ciruela|pomelo|mandarina|lima|coco|papaya|aguacate|fruto seco|almendra|nuez|pistacho|anacardo|avellana|cacahuete/.test(n))return"frutas";
  // Lacteos y huevos
  if(/leche|queso|yogur|nata|mantequilla|huevo|crema (de leche|agria)|requeson|mozzarella|parmesano|ricotta|mascarpone|burgos|manchego|brie|camembert|roquefort|gorgonzola|feta|lacteo|nata montada|creme fraiche/.test(n))return"lacteos";
  // Cereales y legumbres
  if(/arroz|pasta|fideo|espagueti|macarron|tallar|lasana|canelones|cuscus|bulgur|avena|trigo|centeno|cebada|mijo|amaranto|tapioca|polenta|semola|pan |harina|garbanzo|lenteja|alubia|judion|judia (seca|pinta|blanca)|maiz|cereal|quinoa/.test(n))return"cereales";
  // Conservas y salsas
  if(/caldo (de |vegetal|pollo|carne|pescado|marisco)|tomate frito|salsa (de tomate|bechamel|carbonara|boloñesa|pesto|soja|worcestershire|tabasco|barbacoa|agridulce)|conserva|lata de|bote de|aceitunas|alcaparra|pepinillo|atun (en lata|enlatado)|mejillones (en lata|escabeche)|concentrado|sofrito|pisto|caldo concentrado/.test(n))return"conservas";
  // Especias y condimentos
  if(/\bsal\b|pimienta|azafran|colorante|oregano|tomillo|romero|laurel|comino|pimenton|curry|aceite (de oliva|vegetal|girasol)?|vinagre|canela|nuez moscada|clavo|cardamomo|especias|condimento|mostaza|ketchup|mayonesa|soja|tabasco|worcestershire|ras el hanout|curcuma|jengibre|cilantro (molido|en polvo)|cayena|guindilla|paprika|anis|hinojo seco|eneldo|estragón|mejorana|hierbas|aliño/.test(n))return"especias";
  return"otros";
}'''
    content = content[:start_idx] + new_category + content[end_idx:]
    fixes.append("guessCategory completely rewritten")

open('src/App.jsx','w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
