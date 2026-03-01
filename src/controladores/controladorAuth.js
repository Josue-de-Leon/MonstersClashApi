// src/controladores/controladorAuth.js
// Soft delete en usuarios: login verifica activo = 1.
// Registro no permite email duplicado incluso si la cuenta está desactivada.

const bcrypt           = require("bcryptjs");
const { pool }         = require("../config/baseDeDatos");
const { generarToken } = require("../utilidades/token");

const SALT_ROUNDS = 10;

// POST /api/auth/registro
async function registro(req, res, next) {
  try {
    const { nombre, email, contrasena } = req.body;

    // Verificar email duplicado (activo o no)
    const [filas] = await pool.query(
      "SELECT ID, Activo FROM usuarios WHERE Email = ?",
      [email.toLowerCase().trim()]
    );

    if (filas.length > 0) {
      const mensaje = filas[0].Activo
        ? "Ya existe una cuenta activa con ese correo electrónico."
        : "Ese correo pertenece a una cuenta desactivada. Contacta al soporte para reactivarla.";
      return res.status(409).json({ exito: false, mensaje });
    }

    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    const [resultado] = await pool.query(
      "INSERT INTO usuarios (Nombre, Email, Contrasena) VALUES (?, ?, ?)",
      [nombre.trim(), email.toLowerCase().trim(), hash]
    );

    const nuevoUsuario = {
      id:     resultado.insertId,
      nombre: nombre.trim(),
      email:  email.toLowerCase().trim(),
    };

    return res.status(201).json({
      exito:   true,
      mensaje: "Cuenta creada exitosamente.",
      datos:   { usuario: nuevoUsuario, token: generarToken(nuevoUsuario) },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
// Verifica activo = 1. Si la cuenta está desactivada, mensaje específico.
async function login(req, res, next) {
  try {
    const { email, contrasena } = req.body;

    const [filas] = await pool.query(
      "SELECT ID, Nombre, Email, Contrasena, Activo FROM usuarios WHERE Email = ?",
      [email.toLowerCase().trim()]
    );

    // No revelar si el email existe o no (seguridad)
    if (filas.length === 0) {
      return res.status(401).json({ exito: false, mensaje: "Credenciales incorrectas." });
    }

    const usuario = filas[0];
    const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.Contrasena);

    if (!contrasenaCorrecta) {
      return res.status(401).json({ exito: false, mensaje: "Credenciales incorrectas." });
    }

    // Contraseña correcta pero cuenta desactivada
    if (!usuario.Activo) {
      return res.status(403).json({
        exito:   false,
        mensaje: "Tu cuenta está desactivada. Contacta al soporte.",
      });
    }

    const datosPublicos = { id: usuario.ID, nombre: usuario.Nombre, email: usuario.Email };

    return res.json({
      exito:   true,
      mensaje: "Sesión iniciada correctamente.",
      datos:   { usuario: datosPublicos, token: generarToken(datosPublicos) },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/perfil
async function perfil(req, res, next) {
  try {
    const [filas] = await pool.query(
      "SELECT ID, Nombre, Email, Fecha_Creado FROM usuarios WHERE ID = ? AND Activo = 1",
      [req.usuario.id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "Usuario no encontrado." });
    }
    return res.json({ exito: true, datos: filas[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = { registro, login, perfil };
