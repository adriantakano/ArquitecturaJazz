const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const { nombre, correo, descripcion } = await request.json();

    if (!nombre?.trim() || !correo?.trim() || !descripcion?.trim()) {
      return Response.json(
        { error: 'Todos los campos son obligatorios.' },
        { status: 400, headers: CORS }
      );
    }

    await env.DB.prepare(
      'INSERT INTO contactos (nombre, correo, descripcion) VALUES (?, ?, ?)'
    )
      .bind(nombre.trim(), correo.trim(), descripcion.trim())
      .run();

    // Fire-and-forget: notificación por correo vía Resend
    if (env.RESEND_API_KEY_jazz) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY_jazz}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '',  // Configura: ej. "Jazz Arquitectura <hola@tudominio.com>"
          to:   '',  // Configura: correo de destino
          subject: `Nuevo contacto: ${nombre.trim()}`,
          html: `
            <h2 style="font-family:sans-serif">Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${nombre.trim()}</p>
            <p><strong>Correo:</strong> ${correo.trim()}</p>
            <p><strong>Descripción:</strong></p>
            <p style="white-space:pre-wrap">${descripcion.trim()}</p>
          `,
        }),
      }).catch(() => {}); // Si Resend falla, el INSERT ya fue exitoso — no bloquear
    }

    return Response.json({ ok: true }, { status: 200, headers: CORS });
  } catch {
    return Response.json(
      { error: 'Error del servidor. Intenta de nuevo.' },
      { status: 500, headers: CORS }
    );
  }
}
