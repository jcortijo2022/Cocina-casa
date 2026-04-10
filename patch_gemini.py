#!/usr/bin/env python3
content = open('src/App.jsx').read()

# Buscar y reemplazar la funcion callClaude entera
old = '''  async function callClaude(prompt,imgData=null){
    if(!apiKey){onNeedKey();return null;}
    const msgContent=imgData?[{type:"image",source:{type:"base64",media_type:imgData.type,data:imgData.data}},{type:"text",text:prompt}]:prompt;
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-6",max_tokens:2000,system:"Eres un asistente de cocina. Devuelve UNICAMENTE JSON valido sin backticks ni texto adicional.",messages:[{role:"user",content:msgContent}]})});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err?.error?.message||"HTTP "+res.status);}
    const d=await res.json();
    const text=d.content?.map(c=>c.text||"").join("")||"";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  }'''

new = '''  async function callClaude(prompt,imgData=null){
    if(!apiKey){onNeedKey();return null;}
    const parts=[];
    if(imgData)parts.push({inlineData:{mimeType:imgData.type,data:imgData.data}});
    parts.push({text:prompt});
    const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+apiKey,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts}],systemInstruction:{parts:[{text:"Eres un asistente de cocina. Devuelve UNICAMENTE JSON valido sin backticks ni texto adicional."}]},generationConfig:{maxOutputTokens:2000}})});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err?.error?.message||"HTTP "+res.status);}
    const d=await res.json();
    const text=d.candidates?.[0]?.content?.parts?.[0]?.text||"";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  }'''

if old in content:
    content = content.replace(old, new)
    # Actualizar texto del modal
    content = content.replace(
        'Para importar recetas con IA necesitas una API Key de Anthropic.',
        'Para importar recetas con IA necesitas una API Key de Google Gemini.'
    )
    content = content.replace(
        'Obtener API Key en console.anthropic.com',
        'Obtener API Key en aistudio.google.com'
    )
    content = content.replace(
        'href="https://console.anthropic.com/"',
        'href="https://aistudio.google.com/app/apikey"'
    )
    open('src/App.jsx','w').write(content)
    print('OK: API actualizada a Google Gemini')
else:
    # Intentar con version openai parchada
    old2 = '''  async function callClaude(prompt,imgData=null){
    if(!apiKey){onNeedKey();return null;}
    const msgContent=imgData?[{type:"image_url",image_url:{url:"data:"+imgData.type+";base64,"+imgData.data}},{type:"text",text:prompt}]:[{type:"text",text:prompt}];
    const res=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:"gpt-4o-mini",max_tokens:2000,messages:[{role:"system",content:"Eres un asistente de cocina. Devuelve UNICAMENTE JSON valido sin backticks ni texto adicional."},{role:"user",content:msgContent}]})});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err?.error?.message||"HTTP "+res.status);}
    const d=await res.json();
    const text=d.choices?.[0]?.message?.content||"";
    return JSON.parse(text.replace(/```json|```/g,"").trim());
  }'''
    if old2 in content:
        content = content.replace(old2, new)
        open('src/App.jsx','w').write(content)
        print('OK: API actualizada a Google Gemini (desde OpenAI)')
    else:
        # Mostrar linea actual para diagnostico
        print('ERROR: no se encontro el patron. Lineas 60-80:')
        lines = content.split('\n')
        for i, line in enumerate(lines[59:80], 60):
            print(f'{i}: {line[:150]}')
