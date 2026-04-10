#!/usr/bin/env python3
content = open('src/App.jsx').read()
ok = []

# 1. Fix JSON parse - hacerlo mas robusto
old1 = '    const text=d.candidates?.[0]?.content?.parts?.[0]?.text||"";\n    if(!text)throw new Error("Respuesta vacia de Gemini");\n    return JSON.parse(text);'
new1 = '''    const text=d.candidates?.[0]?.content?.parts?.[0]?.text||"";
    if(!text)throw new Error("Respuesta vacia de Gemini");
    try{return JSON.parse(text);}catch(e){
      const m=text.match(/{[\\s\\S]*}/);
      if(!m)throw new Error("No JSON en respuesta");
      const clean=m[0].replace(/[\\u0000-\\u001F\\u007F]/g," ").replace(/\\\\/g,"\\\\\\\\").replace(/([^\\\\])"/g,(x,p)=>p+'"');
      try{return JSON.parse(m[0]);}catch(e2){throw new Error("JSON invalido: "+e2.message);}
    }'''

if old1 in content:
    content = content.replace(old1, new1)
    ok.append('JSON parsing mejorado')
else:
    print('WARN: patron JSON no encontrado, buscando...')
    for i,line in enumerate(content.split('\n')):
        if 'JSON.parse(text)' in line:
            print(f'  {i}: {repr(line[:150])}')

# 2. localStorage para recetas
old2 = "  const [recipes,setRecipes]=useState([]);"
new2 = "  const [recipes,setRecipes]=useState(()=>{try{return JSON.parse(localStorage.getItem('cocina_recipes')||'[]');}catch{return [];}});"
if old2 in content:
    content = content.replace(old2, new2)
    ok.append('recipes en localStorage')

# 3. localStorage para menu semanal
old3 = "  const [weekMenu,setWeekMenu]=useState({});"
new3 = "  const [weekMenu,setWeekMenu]=useState(()=>{try{return JSON.parse(localStorage.getItem('cocina_menu')||'{}');}catch{return {};}});"
if old3 in content:
    content = content.replace(old3, new3)
    ok.append('weekMenu en localStorage')

# 4. Guardar recetas al añadir
old4 = "onAdd={r=>{onAdd(r);setAddOpen(false)}}"
new4 = "onAdd={r=>{onAdd(r);setAddOpen(false)}}"
# Buscar patron real
for i,line in enumerate(content.split('\n')):
    if 'onAdd={r=>' in line and 'setAddOpen' in line:
        print(f'onAdd linea {i}: {repr(line[:200])}')
        break

# 5. Persistir recetas - wrapper en App
old5 = "onAdd={r=>setRecipes(p=>[r,...p])}"
new5 = "onAdd={r=>{const u=[r,...recipes];setRecipes(u);localStorage.setItem('cocina_recipes',JSON.stringify(u));}}"
if old5 in content:
    content = content.replace(old5, new5)
    ok.append('onAdd persiste')

old6 = "onDelete={id=>setRecipes(p=>p.filter(r=>r.id!==id))}"
new6 = "onDelete={id=>{const u=recipes.filter(r=>r.id!==id);setRecipes(u);localStorage.setItem('cocina_recipes',JSON.stringify(u));}}"
if old6 in content:
    content = content.replace(old6, new6)
    ok.append('onDelete persiste')

old7 = "onUpdate={r=>setRecipes(p=>p.map(x=>x.id===r.id?r:x))}"
new7 = "onUpdate={r=>{const u=recipes.map(x=>x.id===r.id?r:x);setRecipes(u);localStorage.setItem('cocina_recipes',JSON.stringify(u));}}"
if old7 in content:
    content = content.replace(old7, new7)
    ok.append('onUpdate persiste')

# 6. Persistir weekMenu - añadir useEffect
old8 = "  const currentWeekOffset=0;"
new8 = """  const currentWeekOffset=0;
  useEffect(()=>{localStorage.setItem('cocina_menu',JSON.stringify(weekMenu));},[weekMenu]);"""
if old8 in content:
    content = content.replace(old8, new8)
    ok.append('weekMenu useEffect persiste')

open('src/App.jsx','w').write(content)
print('OK:', ', '.join(ok) if ok else 'sin cambios')
