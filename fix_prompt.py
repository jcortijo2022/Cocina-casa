#!/usr/bin/env python3
content = open('src/App.jsx').read()

# Mejorar el prompt del sistema para forzar JSON
old = '"Eres un asistente de cocina. Devuelve UNICAMENTE JSON valido sin backticks ni texto adicional."'
new = '"Eres un asistente de cocina. IMPORTANTE: Debes responder UNICAMENTE con un objeto JSON valido. No escribas nada antes ni despues del JSON. No uses backticks. No uses bloques de codigo. Solo el JSON puro empezando por { y terminando por }."'

if old in content:
    content = content.replace(old, new)
    open('src/App.jsx','w').write(content)
    print('OK: prompt mejorado')
else:
    print('ERROR: no encontrado')
    for i, line in enumerate(content.split('\n')):
        if 'asistente de cocina' in line:
            print(f'{i}: {repr(line[:200])}')
