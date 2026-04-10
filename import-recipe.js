export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, apiKey } = req.body;
  if (!url || !apiKey) return res.status(400).json({ error: 'url y apiKey requeridos' });

  try {
    // 1. Fetch the URL
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!pageRes.ok) throw new Error(`No se pudo acceder a la URL: ${pageRes.status}`);
    const html = await pageRes.text();

    // 2. Extract text content (remove scripts, styles, tags)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000);

    // 3. Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extrae la receta de este texto de pagina web y devuelve un JSON con este esquema exacto:
{"title":"TITULO","description":"DESCRIPCION breve","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"Ingrediente"}],"steps":["Paso 1","Paso 2"],"sourceUrl":"${url}","time":"30 min","servings":4}

Los valores de mealType deben ser uno de: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros
Los valores de recipeType deben ser uno de: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos

TEXTO DE LA PAGINA:
${text}`
            }]
          }],
          generationConfig: { maxOutputTokens: 2000, responseMimeType: 'application/json' }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini error ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const recipeText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!recipeText) throw new Error('Gemini no devolvio respuesta');

    const recipe = JSON.parse(recipeText);
    res.status(200).json(recipe);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
