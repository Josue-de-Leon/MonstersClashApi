// src/middlewares/autenticacion.js
// Middleware que verifica el token JWT en el header Authorization.
// Uso: router.get("/ruta-protegida", verificarToken, controlador)

const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  // El header debe venir como: Authorization: Bearer <token>
  const encabezado = req.headers["authorization"];

  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    return res.status(401).json({
      exito: false,
      mensaje: "Acceso denegado. Token no proporcionado.",
    });
  }

  const token = encabezado.split(" ")[1];

  try {
    const datosDecodificados = jwt.verify(token, process.env.JWT_SECRETO);
    req.usuario = datosDecodificados; // { id, email, nombre }
    next();
  } catch (error) {
    const esExpirado = error.name === "TokenExpiredError";
    return res.status(401).json({
      exito: false,
      mensaje: esExpirado
        ? "Token expirado. Inicia sesión nuevamente."
        : "Token inválido.",
    });
  }
}

module.exports = { verificarToken };
