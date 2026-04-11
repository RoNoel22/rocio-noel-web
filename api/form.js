import formidable from 'formidable';
import fs from 'fs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 });
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const serviceType = Array.isArray(fields.serviceType) ? fields.serviceType[0] : fields.serviceType;
    const objective = Array.isArray(fields.objective) ? fields.objective[0] : fields.objective;

    if (!email || !serviceType) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const attachments = [];

    if (files.cv) {
      const cvFile = Array.isArray(files.cv) ? files.cv[0] : files.cv;
      const cvData = fs.readFileSync(cvFile.filepath);
      attachments.push({
        filename: cvFile.originalFilename || 'CV.pdf',
        content: cvData.toString('base64'),
      });
    }

    if (files.comprobante) {
      const compFile = Array.isArray(files.comprobante) ? files.comprobante[0] : files.comprobante;
      const compData = fs.readFileSync(compFile.filepath);
      attachments.push({
        filename: compFile.originalFilename || 'comprobante.pdf',
        content: compData.toString('base64'),
      });
    }

    const body = {
      from: 'Rocio <onboarding@resend.dev>',
      to: ['noelasesora@hotmail.com'],
      reply_to: email,
      subject: `Nueva solicitud web - ${serviceType}`,
      html: `
        <h2>Nueva solicitud desde la web</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Servicio:</strong> ${serviceType}</p>
        <p><strong>Objetivo/Puesto:</strong> ${objective || 'No indic