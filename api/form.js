import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, serviceType, objective } = req.body || {};

    if (!email || !serviceType) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
      });
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Rocio <onboarding@resend.dev>',
      to: ['noelasesora@hotmail.com'],
      replyTo: email,
      subject: `Nueva solicitud web - ${serviceType}`,
      html: `
        <h2>Nueva solicitud desde la web</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Servicio:</strong> ${serviceType}</p>
        <p><strong>Objetivo:</strong> ${objective || 'No indicado'}</p>
      `,
    });

    console.log('RESEND RESULT:', result);

    if (result.error) {
      return res.status(500).json({
        error: result.error.message || 'No se pudo enviar el email',
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Formulario enviado correctamente',
      id: result.data?.id,
    });
  } catch (error) {
    console.error('ERROR EN /api/form:', error);
    return res.status(500).json({
      error: error.message || 'Error en el servidor',
    });
  }
}