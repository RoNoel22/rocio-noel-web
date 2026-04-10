export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: contents,
          generationConfig: { maxOutputTokens: 300 }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiData.candidates || !geminiData.candidates[0]) {
      return res.status(500).json({ error: 'Sin respuesta de Gemini', detail: geminiData });
    }

    const text = geminiData.candidates[0].content.parts[0].text;

    return res.status(200).json({
      content: [{ type: 'text', text: text }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
