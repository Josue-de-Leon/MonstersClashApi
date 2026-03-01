// src/config/cors.js
// Configuración de CORS para permitir peticiones desde el frontend Next.js.
// En producción, cambiar los orígenes permitidos por el dominio real.

const opcionesCors = {
  origin: (origin, callback) => {
    const origenesPermitidos = [
      "http://localhost:3000",  // Next.js en desarrollo
      "http://localhost:3001",  // por si se ejecuta en el mismo puerto
      process.env.URL_FRONTEND, // dominio de producción desde .env
    ].filter(Boolean);

    // Permitir también peticiones sin origen (Postman, curl, etc.)
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    }
  },
  methods:            ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders:     ["Content-Type", "Authorization"],
  credentials:        true,
  optionsSuccessStatus: 200,
};

module.exports = opcionesCors;
