export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, search, apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey requerido' });

  const SCHEMA = '{"title":"titulo","description":"descripcion breve","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno completo","paso dos completo"],"sourceUrl":"URL","time":"30 min","servings":4}';
  const TYPES = 'mealType: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros. recipeType: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos.';

  async function callAnthropic(prompt) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'Eres chef experto. Devuelve SOLO JSON valido sin texto adicional ni backticks.',
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || 'HTTP ' + r.status); }
    const d = await r.json();
    const t = d.content?.[0]?.text || '';
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Sin JSON en respuesta');
    const recipe = JSON.parse(m[0]);
    if (typeof recipe.steps === 'string') recipe.steps = recipe.steps.split('\n').filter(s => s.trim());
    return recipe;
  }

  try {
    // SEARCH mode
    if (search) {
      const recipe = await callAnthropic(
        `Crea una receta detallada y completa para: "${search}".
Ingredientes para 4 personas con cantidades exactas.
Pasos detallados y completos, sin resumir.
sourceUrl debe ser una URL real de una web de recetas donde se pueda encontrar este plato.
JSON: ${SCHEMA} ${TYPES}`
      );
      return res.status(200).json(recipe);
    }

    if (!url) return res.status(400).json({ error: 'url o search requerido' });

    // YOUTUBE / VIDEO mode - extract title from URL and create recipe
    const isYoutube = /youtube\.com|youtu\.be/.test(url);
    if (isYoutube) {
      // Try to get video title from oEmbed API
      let videoTitle = '';
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const or = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (or.ok) {
          const od = await or.json();
          videoTitle = od.title || '';
        }
      } catch(e) {}

      const searchTerm = videoTitle || url.split('/').pop().replace(/[?&].*/,'').replace(/[-_]/g,' ').trim() || 'receta de cocina';
      const recipe = await callAnthropic(
        `Crea una receta detallada para el plato: "${searchTerm}".
Este plato viene de un video de YouTube: ${url}
sourceUrl debe ser exactamente: ${url}
Ingredientes para 4 personas. Pasos detallados y completos.
JSON: ${SCHEMA} ${TYPES}`
      );
      recipe.sourceUrl = url;
      return res.status(200).json(recipe);
    }

    // URL mode - fetch page content
    let imageUrl = '';
    let pageText = '';

    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        // Extract og:image
        const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                   || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogImg) imageUrl = ogImg[1];
        if (imageUrl && imageUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imageUrl = urlObj.origin + imageUrl;
        }
        pageText = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000);
      }
    } catch(e) {
      // If fetch fails, use URL name
      const urlName = decodeURIComponent(url.split('/').filter(Boolean).pop() || '')
        .replace(/[?#].*/, '').replace(/\.html?$/, '').replace(/[-_]/g, ' ').trim();
      pageText = 'Receta: ' + urlName;
    }

    const schemaWithUrl = SCHEMA.replace('"URL"', '"' + url + '"');
    const recipe = await callAnthropic(
      `Extrae la receta completa de este contenido web.
Pasos detallados y completos, sin resumir.
image debe ser: "${imageUrl}"
JSON: ${schemaWithUrl} ${TYPES}
CONTENIDO: ${pageText}`
    );
    if (!recipe.image && imageUrl) recipe.image = imageUrl;
    recipe.sourceUrl = recipe.sourceUrl || url;
    return res.status(200).json(recipe);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
