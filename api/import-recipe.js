export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, search, apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey requerido' });

  try {
    let pageText = '';
    let imageUrl = '';
    let sourceUrl = url || '';

    if (search) {
      // Search mode - use Anthropic directly with search query
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: 'Eres un chef experto. Devuelve SOLO JSON valido sin texto adicional.',
          messages: [{ role: 'user', content: `Crea una receta detallada y completa para: "${search}". 
Ingredientes para 4 personas con cantidades exactas.
Los pasos deben ser detallados y completos.
Para sourceUrl pon la URL de una pagina web real donde se pueda encontrar esta receta.
Devuelve JSON con este esquema exacto:
{"title":"titulo","description":"descripcion breve","image":"","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno completo","paso dos completo"],"sourceUrl":"https://url-fuente-real.com","time":"30 min","servings":4}
mealType: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros
recipeType: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos` }]
        })
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || 'HTTP ' + r.status); }
      const d = await r.json();
      const t = d.content?.[0]?.text || '';
      const m = t.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON en respuesta');
      const recipe = JSON.parse(m[0]);
      if (typeof recipe.steps === 'string') recipe.steps = recipe.steps.split('\n').filter(s => s.trim());
      return res.status(200).json(recipe);
    }

    if (!url) return res.status(400).json({ error: 'url o search requerido' });

    // URL mode - fetch page
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Accept-Language': 'es-ES' },
      signal: AbortSignal.timeout(10000),
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      // Extract og:image
      const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogImg) imageUrl = ogImg[1];
      if (!imageUrl) {
        const imgTag = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*class=["'][^"']*recipe[^"']*["']/i)
                    || html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i);
        if (imgTag) imageUrl = imgTag[1];
      }
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

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'Eres un extractor de recetas. Devuelve SOLO JSON valido sin texto adicional.',
        messages: [{ role: 'user', content: `Extrae la receta de este contenido web. Devuelve JSON:
{"title":"titulo","description":"descripcion","image":"${imageUrl}","mealType":"Comida","recipeType":"Otros platos","ingredients":[{"amount":"200","unit":"gramos","name":"ingrediente"}],"steps":["paso uno completo y detallado","paso dos completo"],"sourceUrl":"${url}","time":"30 min","servings":4}
mealType: Comida, Cena, Fin de Semana, Postre, Entrante, Verano, Salsas, Otros
recipeType: Carne, Guisos, Pescados, Arroz y Pasta, Verdura, Otros platos
Los pasos deben ser completos y detallados.
CONTENIDO: ${pageText}` }]
      })
    });

    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error?.message || 'HTTP ' + r.status); }
    const d = await r.json();
    const t = d.content?.[0]?.text || '';
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON en respuesta');
    const recipe = JSON.parse(m[0]);
    if (typeof recipe.steps === 'string') recipe.steps = recipe.steps.split('\n').filter(s => s.trim());
    if (!recipe.image && imageUrl) recipe.image = imageUrl;
    res.status(200).json(recipe);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
