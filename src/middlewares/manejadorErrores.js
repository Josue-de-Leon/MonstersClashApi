// src/middlewares/manejadorErrores.js
// Middleware de manejo centralizado de errores.
// Debe registrarse AL FINAL de todas las rutas en servidor.js

function manejadorErrores(error, req, res, next) {
  const codigo = error.status || error.statusCode || 500;
  const entorno = process.env.NODE_ENV || "development";

  console.error(`[ERROR ${codigo}] ${req.method} ${req.path} →`, error.message);

  res.status(codigo).json({
    exito: false,
    mensaje: error.message || "Error interno del servidor.",
    // Solo mostrar el stack trace en desarrollo
    ...(entorno === "development" && { detalle: error.stack }),
  });
}

module.exports = { manejadorErrores };
