export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, apiKey } = req.body;
  if (!url || !apiKey) return res.status(400).json({ error: 'Faltan parametros' });

  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Accept-Language': 'es-ES' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await pageRes.ok ? await pageRes.text() : '';

    // Extract og:image or first large image from HTML
    let imageUrl = '';
    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImg) imageUrl = ogImg[1];
    if (!imageUrl) {
      const imgTag = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*>/i);
      if (imgTag) imageUrl = imgTag[1];
    }
    // Make absolute URL if relative
    if (imageUrl && imageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      imageUrl = urlObj.origin + imageUrl;
    }

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'Eres un extractor de recetas. Devuelve SOLO JSON valido sin texto adicional.',
        messages: [{ role: 'user', content: `Extrae la receta de este contenido web. Devuelve JSON con este esquema exacto:
{"title":"titulo","description":"descripcion breve","image":"${imageUrl}","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno completo y detallado","paso dos completo y detallado"],"sourceUrl":"${url}","time":"30 min","servings":4}
mealType: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros
recipeType: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos
Los pasos deben ser completos y detallados. CONTENIDO: ${text}` }]
      })
    });

    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || 'HTTP ' + r.status); }
    const d = await r.json();
    const t = d.content?.[0]?.text || '';
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON en respuesta');
    const recipe = JSON.parse(m[0]);
    if (typeof recipe.steps === 'string') recipe.steps = recipe.steps.split('\n').filter(s => s.trim());
    // Ensure image from og:image if not set
    if (!recipe.image && imageUrl) recipe.image = imageUrl;
    res.status(200).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
