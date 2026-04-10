export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    console.log("Datos recibidos:", data);

    return res.status(200).json({
      message: 'Formulario recibido correctamente'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor'
    });
  }
}