#!/usr/bin/env python3
content = open('src/App.jsx').read()
fixes = []

# Fix 1: photoDataUrl not defined in importByUrl - find and fix
# The issue is importByUrl calls onAdd without photoDataUrl defined
old1 = "  async function importByUrl(urlVal){"
new1 = "  async function importByUrl(urlVal,photoDataUrl=null){"
if old1 in content:
    content = content.replace(old1, new1)
    fixes.append("importByUrl accepts photoDataUrl")

# Fix 2: finalImage in importByUrl too
# Find the onAdd inside importByUrl and add finalImage
lines = content.split('\n')
new_lines = []
in_importByUrl = False
fixed_finalImage = False
for i, line in enumerate(lines):
    if 'async function importByUrl' in line:
        in_importByUrl = True
    if in_importByUrl and 'onAdd({id:Date.now()' in line and not fixed_finalImage:
        # Add finalImage before this line
        indent = '      '
        new_lines.append(indent + 'const finalImage2 = data.image || photoDataUrl || "";')
        # Replace image in onAdd
        line = line.replace('image:data.image||"",', 'image:finalImage2,')
        line = line.replace('image:data.image||\'\'', 'image:finalImage2')
        fixed_finalImage = True
        in_importByUrl = False
    new_lines.append(line)
content = '\n'.join(new_lines)
if fixed_finalImage:
    fixes.append("importByUrl uses finalImage2")

# Fix 3: Better shopping list grouping and summing
# Find and replace the ingredientMap building logic
old3 = '''  const ingredientMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const k=ing.name.toLowerCase().trim();const capName=k.charAt(0).toUpperCase()+k.slice(1);if(!ingredientMap[k]){ingredientMap[k]={...ing,name:capName,id:k,category:guessCategory(ing.name),totalAmount:parseFloat(ing.amount)||0,unit:ing.unit};}else{const existing=ingredientMap[k];const newAmt=parseFloat(ing.amount)||0;if(existing.unit===ing.unit&&newAmt>0){existing.totalAmount=(existing.totalAmount||0)+newAmt;existing.amount=String(Math.round((existing.totalAmount)*10)/10);}}}); });});});
  Object.values(ingredientMap).forEach(i=>{if(i.totalAmount>0)i.amount=String(Math.round(i.totalAmount*10)/10);});'''
new3 = '''  const ingredientMap={};
  Object.values(menu).forEach(slots=>{Object.values(slots).forEach(rs=>{rs.forEach(r=>{const full=recipes.find(rec=>rec.id===r.id);(full?.ingredients||r.ingredients||[]).forEach(ing=>{const rawName=ing.name.trim();const k=rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();const capName=rawName.charAt(0).toUpperCase()+rawName.slice(1);const amt=parseFloat(String(ing.amount).replace(",",".").replace(/[^\d.]/g,""))||0;const unit=(ing.unit||"").toLowerCase().trim();if(!ingredientMap[k]){ingredientMap[k]={id:k,name:capName,amount:amt>0?String(amt):(ing.amount||""),unit:ing.unit||"",category:guessCategory(rawName),totalAmount:amt,unitKey:unit};}else{const ex=ingredientMap[k];if(ex.unitKey===unit&&amt>0){ex.totalAmount=(ex.totalAmount||0)+amt;ex.amount=String(Math.round(ex.totalAmount*10)/10);}}});});});});'''
if old3 in content:
    content = content.replace(old3, new3)
    fixes.append("shopping list grouping fixed")
else:
    # Try simpler replacement - just fix the ingredientMap logic
    print("WARN: shopping list pattern not found, trying alternative")
    for i, line in enumerate(content.split('\n')):
        if 'ingredientMap' in line and 'forEach' in line:
            print(f"  {i}: {line[:100]}")

# Fix 4: Also fix extraItems to capitalize
old4 = "    setExtraItems(p=>[...p,{id:\"extra-\"+Date.now(),amount:\"\",unit:\"\",name:newItem.trim(),category:guessCategory(newItem)}]);"
new4 = "    const trimmed=newItem.trim();const capExtra=trimmed.charAt(0).toUpperCase()+trimmed.slice(1);\n    setExtraItems(p=>[...p,{id:\"extra-\"+Date.now(),amount:\"\",unit:\"\",name:capExtra,category:guessCategory(trimmed)}]);"
if old4 in content:
    content = content.replace(old4, new4)
    fixes.append("extraItems capitalize")

open('src/App.jsx', 'w').write(content)
print("OK fixes:", ", ".join(fixes))
print("Ejecuta: npm run build && vercel --prod")
