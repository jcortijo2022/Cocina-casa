#!/usr/bin/env python3
content = open('src/App.jsx').read()

# Fix enlace/video: extraer nombre de la URL y buscar por nombre
old = 'if(tab==="enlace"||tab==="video"){if(!url.trim()){setError("Introduce una URL");return;}importRecipe("Extrae la receta de esta URL. Si no puedes acceder crea una receta tipica basada en el nombre. sourceUrl="+url+". Devuelve JSON: "+TPL);}'

new = '''if(tab==="enlace"||tab==="video"){if(!url.trim()){setError("Introduce una URL");return;}
      const urlName=url.split("/").filter(Boolean).pop()||"";
      const dishName=urlName.replace(/[-_]/g," ").replace(/\?.*$/,"").replace(/\.html?$/,"").trim();
      importRecipe("Crea una receta detallada para el plato: "+dishName+". El campo sourceUrl debe ser: "+url+". Ingredientes para 4 personas. image vacio. Devuelve JSON: "+TPL);}'''

if old in content:
    content = content.replace(old, new)
    # Fix texto: asegurarse que el prompt es claro
    old2 = 'else if(tab==="texto"){if(!textInput.trim()){setError("Pega el texto de la receta");return;}importRecipe("Analiza este texto y extrae la receta. Devuelve JSON: "+TPL+" Texto: "+textInput);}'
    new2 = 'else if(tab==="texto"){if(!textInput.trim()){setError("Pega el texto de la receta");return;}importRecipe("Analiza este texto de receta y extrae titulo, ingredientes y pasos. Devuelve JSON: "+TPL+" ### TEXTO DE LA RECETA: "+textInput);}'
    content = content.replace(old2, new2)
    open('src/App.jsx','w').write(content)
    print('OK: enlace, video y texto corregidos')
else:
    print('ERROR: no encontrado')
    for i,line in enumerate(content.split('\n')):
        if 'enlace' in line and 'tab' in line:
            print(f'{i}: {repr(line[:200])}')
