// src/rutas/rutasBatallas.js
const express       = require("express");
const ctrl          = require("../controladores/controladorBatallas");
const { verificarToken }          = require("../middlewares/autenticacion");
const { validarCamposRequeridos } = require("../middlewares/validacion");

const router = express.Router();

router.use(verificarToken);

router.get("/",    ctrl.obtenerTodas);
router.get("/:id", ctrl.obtenerPorId);

router.post(
  "/",
  validarCamposRequeridos(["id_monstruo1", "id_monstruo2"]),
  ctrl.crear
);

router.delete("/:id", ctrl.eliminar);

module.exports = router;
