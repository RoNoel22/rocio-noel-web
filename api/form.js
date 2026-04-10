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

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Rocio <onboarding@resend.dev>',
      to: ['noelasesora@hotmail.com'],
      reply_to: email,
      subject: `Nueva solicitud web - ${serviceType}`,
      html: `
        <h2>Nueva solicitud desde la web</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Servicio:</strong> ${serviceType}</p>
        <p><strong>Objetivo:</strong> ${objective || 'No indicado'}</p>
      `,
    });

    if (error) {
      console.error('Error Resend:', error);
      return res.status(500).json({
        error: 'No se pudo enviar el email',
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Formulario enviado correctamente',
      id: data?.id,
    });
  } catch (error) {
    console.error('Error en /api/form:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
    });
  }
}