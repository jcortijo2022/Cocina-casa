#!/usr/bin/env python3
content = open('src/App.jsx').read()

# Añadir responseMimeType al body de Gemini para forzar JSON nativo
old = ',generationConfig:{maxOutputTokens:2000}}'
new = ',generationConfig:{maxOutputTokens:2000,responseMimeType:"application/json"}}'

if old in content:
    content = content.replace(old, new)
    open('src/App.jsx','w').write(content)
    print('OK: JSON mode activado')
else:
    print('ERROR: no encontrado')
    for i,line in enumerate(content.split('\n')):
        if 'generationConfig' in line:
            print(f'{i}: {repr(line[:200])}')
