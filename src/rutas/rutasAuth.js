// src/rutas/rutasAuth.js
const express        = require("express");
const { registro, login, perfil } = require("../controladores/controladorAuth");
const { verificarToken }          = require("../middlewares/autenticacion");
const { validarCamposRequeridos } = require("../middlewares/validacion");

const router = express.Router();

// POST /api/auth/registro
router.post(
  "/registro",
  validarCamposRequeridos(["nombre", "email", "contrasena"]),
  registro
);

// POST /api/auth/login
router.post(
  "/login",
  validarCamposRequeridos(["email", "contrasena"]),
  login
);

// GET /api/auth/perfil  ← requiere token
router.get("/perfil", verificarToken, perfil);

module.exports = router;
