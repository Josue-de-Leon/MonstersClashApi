// src/middlewares/validacion.js
// Funciones de validación reutilizables para los controladores.

function validarCamposRequeridos(campos) {
  return (req, res, next) => {
    const faltantes = campos.filter((campo) => {
      const valor = req.body[campo];
      return valor === undefined || valor === null || valor === "";
    });

    if (faltantes.length > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: `Campos requeridos faltantes: ${faltantes.join(", ")}`,
      });
    }
    next();
  };
}

function validarEstadisticasMonstruo(req, res, next) {
  const { vida, ataque, defensa, velocidad } = req.body;
  const estadisticas = { vida, ataque, defensa, velocidad };
  const errores = [];

  for (const [campo, valor] of Object.entries(estadisticas)) {
    const numero = Number(valor);
    if (isNaN(numero) || !Number.isInteger(numero) || numero < 1 || numero > 999) {
      errores.push(`${campo} debe ser un número entero entre 1 y 999`);
    }
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, mensaje: errores.join(". ") });
  }
  next();
}

module.exports = { validarCamposRequeridos, validarEstadisticasMonstruo };
