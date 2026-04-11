const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';

    let email, serviceType, objective;
    const attachments = [];

    if (contentType.includes('multipart/form-data')) {
      const boundary = contentType.split('boundary=')[1];
      const parts = rawBody.toString('binary').split('--' + boundary);

      for (const part of parts) {
        if (!part.includes('Content-Disposition')) continue;
        const [headers, ...bodyParts] = part.split('\r\n\r\n');
        const body = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');
        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (!nameMatch) continue;
        const fieldName = nameMatch[1];
        if (filenameMatch) {
          attachments.push({
            filename: filenameMatch[1],
            content: Buffer.from(body, 'binary').toString('base64'),
          });
        } else {
          const value = body.trim();
          if (fieldName === 'email') email = value;
          if (fieldName === 'serviceType') serviceType = value;
          if (fieldName === 'objective') objective = value;
        }
      }
    } else {
      const parsed = JSON.parse(rawBody.toString());
      email = parsed.email;
      serviceType = parsed.serviceType;
      objective = parsed.objective;
    }

    if (!email || !serviceType) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const emailBody = {
      from: 'Rocio <info@cvprofesional.com.ar>',
      to: ['noelasesora@hotmail.com'],
      reply_to: email,
      subject: `Nueva solicitud web - ${serviceType}`,
      html: `
        <h2>Nueva solicitud desde la web</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Servicio:</strong> ${serviceType}</p>
        <p><strong>Objetivo/Puesto:</strong> ${objective || 'No indicado'}</p>
      `,
    };

    if (attachments.length > 0) emailBody.attachments = attachments;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
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