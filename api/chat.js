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

    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: system }]
          },
          contents
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
  return res.status(response.status).json({
    error: 'Gemini request failed: ' + JSON.stringify(data)
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
