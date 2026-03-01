// src/rutas/rutasMonstruos.js
const express       = require("express");
const ctrl          = require("../controladores/controladorMonstruos");
const { verificarToken }              = require("../middlewares/autenticacion");
const { validarCamposRequeridos, validarEstadisticasMonstruo } = require("../middlewares/validacion");

const router = express.Router();

const camposRequeridosMonstruo = ["nombre", "vida", "ataque", "defensa", "velocidad"];

// Todas las rutas de monstruos requieren autenticación
router.use(verificarToken);

router.get("/",    ctrl.obtenerTodos);
router.get("/:id", ctrl.obtenerPorId);

router.post(
  "/",
  validarCamposRequeridos(camposRequeridosMonstruo),
  validarEstadisticasMonstruo,
  ctrl.crear
);

router.put(
  "/:id",
  validarCamposRequeridos(camposRequeridosMonstruo),
  validarEstadisticasMonstruo,
  ctrl.actualizar
);

router.delete("/:id", ctrl.eliminar);

module.exports = router;
