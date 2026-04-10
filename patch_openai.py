#!/usr/bin/env python3
content = open('src/App.jsx').read()

old = 'headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-6",max_tokens:2000,system:"Eres un asistente de cocina. Devuelve UNICAMENTE JSON valido sin backticks ni texto adicional.",messages:[{role:"user",content:msgContent}]})'

new = 'headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"gpt-4o-mini",max_tokens:2000,messages:[{role:"system",content:"Eres un asistente de cocina. Devuelve UNICAMENTE JSON valido sin backticks ni texto adicional."},{role:"user",content:msgContent}]})'

if old in content:
    content = content.replace(old, new)
    # Fix response parsing: d.content -> d.choices
    content = content.replace(
        'd.content?.map(c=>c.text||"").join("")||""',
        'd.choices?.[0]?.message?.content||""'
    )
    open('src/App.jsx','w').write(content)
    print('OK: API actualizada a OpenAI')
else:
    print('ERROR: texto no encontrado, buscando...')
    if 'anthropic' in content:
        print('Aun tiene codigo de Anthropic')
    if 'openai' in content:
        print('Ya tiene openai en la URL')
    # Mostrar linea 68 para diagnostico
    lines = content.split('\n')
    for i, line in enumerate(lines[65:72], 66):
        print(f'{i}: {line[:120]}')
