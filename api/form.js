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
      const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
      if (!boundaryMatch) throw new Error('No boundary found');
      const boundary = boundaryMatch[1].trim();

      const delimiter = Buffer.from('\r\n--' + boundary);
      const rawStr = rawBody.toString('latin1');
      const parts = rawStr.split('--' + boundary);

      for (const part of parts) {
        if (!part.includes('Content-Disposition') || part.trim() === '--') continue;

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = part.substring(0, headerEnd);
        const content = part.substring(headerEnd + 4).replace(/\r\n$/, '');

        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];

        if (filenameMatch && filenameMatch[1]) {
          const filename = filenameMatch[1];
          const fileContent = Buffer.from(content, 'latin1').toString('base64');
          attachments.push({ filename, content: fileContent });
        } else {
          const value = content.trim();
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

    console.log('email:', email, '| serviceType:', serviceType, '| attachments:', attachments.length);

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
