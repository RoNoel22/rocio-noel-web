async function callGemini(body) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages = [], system = "" } = req.body || {};

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || "" }]
    }));

    const body = {
      system_instruction: {
        parts: [{ text: system }]
      },
      contents
    };

    let response = await callGemini(body);
    let data = await response.json();

    // 🔁 Reintento automático si Gemini está saturado
    if (!response.ok && response.status === 503) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      response = await callGemini(body);
      data = await response.json();
    }

    if (!response.ok) {
      const status = data?.error?.status;

      if (response.status === 503 || status === 'UNAVAILABLE') {
        return res.status(503).json({
          error: 'El asistente está con mucha demanda. Probá de nuevo en unos segundos.'
        });
      }

      return res.status(response.status).json({
        error: 'Error con Gemini: ' + JSON.stringify(data)
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: 'Gemini no devolvió texto',
        details: data
      });
    }

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error?.message || String(error)
    });
  }
}
