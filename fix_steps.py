#!/usr/bin/env python3
content = open('src/App.jsx').read()
ok = []

# Cambiar TPL para que steps sea array en lugar de string
old1 = 'const TPL=\'{"title":"TITULO","description":"DESCRIPCION","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"Ingrediente"}],"steps":"Paso 1\\nPaso 2","sourceUrl":"","time":"30 min","servings":4}\';'
new1 = 'const TPL=\'{"title":"TITULO","description":"DESCRIPCION","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"Ingrediente"}],"steps":["Paso 1","Paso 2","Paso 3"],"sourceUrl":"","time":"30 min","servings":4}\';'

if old1 in content:
    content = content.replace(old1, new1)
    ok.append('TPL steps como array')
else:
    print('WARN: TPL no encontrado')
    for i,line in enumerate(content.split('\n')):
        if 'const TPL' in line:
            print(f'  {i}: {repr(line[:200])}')

# Convertir steps array a string al guardar la receta
old2 = 'steps:data.steps||"",'
new2 = 'steps:Array.isArray(data.steps)?data.steps.join("\\n"):data.steps||"",'

if old2 in content:
    content = content.replace(old2, new2)
    ok.append('steps array->string')
else:
    print('WARN: steps conversion no encontrada')
    for i,line in enumerate(content.split('\n')):
        if 'data.steps' in line:
            print(f'  {i}: {repr(line[:200])}')

open('src/App.jsx','w').write(content)
print('OK:', ', '.join(ok) if ok else 'sin cambios')
