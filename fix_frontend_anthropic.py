#!/usr/bin/env python3
lines = open('src/App.jsx').readlines()

start = None
end = None
brace_count = 0

for i, line in enumerate(lines):
    if 'async function callGemini' in line:
        start = i
    if start is not None and i >= start:
        brace_count += line.count('{') - line.count('}')
        if i > start and brace_count <= 0:
            end = i
            break

if start is None or end is None:
    print(f'ERROR: funcion no encontrada (start={start}, end={end})')
    exit(1)

print(f'Funcion encontrada: lineas {start+1} a {end+1}')

new_func = '  async function callGemini(prompt,imgData=null){\n    if(!apiKey){onNeedKey();return null;}\n    const messages=[];\n    if(imgData){\n      messages.push({role:"user",content:[\n        {type:"image",source:{type:"base64",media_type:imgData.type,data:imgData.data}},\n        {type:"text",text:prompt}\n      ]});\n    }else{\n      messages.push({role:"user",content:prompt});\n    }\n    const res=await fetch("https://api.anthropic.com/v1/messages",{\n      method:"POST",\n      headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},\n      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2000,system:"Eres un asistente de cocina. Devuelve SOLO JSON valido sin texto adicional ni backticks.",messages})\n    });\n    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err?.error?.message||"HTTP "+res.status);}\n    const d=await res.json();\n    const text=d.content?.[0]?.text||"";\n    if(!text)throw new Error("Respuesta vacia");\n    const m=text.match(/{[\\s\\S]*}/);\n    if(!m)throw new Error("No JSON en respuesta");\n    return JSON.parse(m[0]);\n  }\n'

new_lines = lines[:start] + [new_func] + lines[end+1:]
open('src/App.jsx','w').writelines(new_lines)
print('OK: callGemini actualizado a Anthropic')
