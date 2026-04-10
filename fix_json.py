#!/usr/bin/env python3
content = open('src/App.jsx').read()

old = 'return JSON.parse(text.replace(/```json|```/g,"").trim());'
new = '''const clean=text.replace(/```json|```/g,"").trim();
    const match=clean.match(/{[\\s\\S]*}/);
    if(!match)throw new Error("No JSON en respuesta");
    return JSON.parse(match[0]);'''

if old in content:
    content = content.replace(old, new)
    open('src/App.jsx','w').write(content)
    print('OK: parsing mejorado')
else:
    print('ERROR: no encontrado')
    # Buscar variantes
    for line in content.split('\n'):
        if 'JSON.parse' in line:
            print(repr(line))
