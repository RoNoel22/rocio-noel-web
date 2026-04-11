const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { email, serviceType, objective } = body || {};

    if (!email || !serviceType) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rocio <info@cvprofesional.com.ar>',
        to:['noelasesora@hotmail.com'],
        reply_to: email,
        subject: `Nueva solicitud web - ${serviceType}`,
        html: `
          <h2>Nueva solicitud desde la web</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Servicio:</strong> ${serviceType}</p>
          <p><strong>Objetivo/Puesto:</strong> ${objective || 'No indicado'}</p>
        `,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      return res.status(500).json({ error: data.message || 'Error al enviar' });
    }

    return res.status(200).json({ ok: true, message: 'Formulario enviado correctamente' });

  } catch (error) {
    console.error('ERROR:', error);
    return res.status(500).json({ error: error.message || 'Error en el servidor' });
  }
};