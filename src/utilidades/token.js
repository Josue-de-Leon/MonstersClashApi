// src/utilidades/token.js
// Utilidades para crear y verificar tokens JWT.

const jwt = require("jsonwebtoken");

/**
 * Genera un token JWT con los datos del usuario.
 * @param {{ id, email, nombre }} usuario
 * @returns {string} token firmado
 */
function generarToken(usuario) {
  const carga = {
    id:     usuario.id,
    email:  usuario.email,
    nombre: usuario.nombre,
  };

  return jwt.sign(carga, process.env.JWT_SECRETO, {
    expiresIn: process.env.JWT_EXPIRA_EN || "24h",
  });
}

module.exports = { generarToken };
