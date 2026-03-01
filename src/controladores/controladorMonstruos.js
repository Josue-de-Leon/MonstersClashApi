// src/controladores/controladorMonstruos.js
// Soft delete: "eliminar" hace UPDATE activo = 0, nunca DELETE físico.
// GET filtra WHERE activo = 1 → el monstruo desactivado no aparece
// en la colección, pero su registro existe para el historial de batallas.

const { pool } = require("../config/baseDeDatos");

const COLUMNAS_VALIDAS = ["ID", "Nombre", "Vida", "Ataque", "Defensa", "Velocidad", "Fecha_Creado"];

// GET /api/monstruos — solo los activos del usuario
async function obtenerTodos(req, res, next) {
  try {
    const ordenPor  = COLUMNAS_VALIDAS.includes(req.query.ordenPor) ? req.query.ordenPor : "ID";
    const direccion = req.query.direccion === "DESC" ? "DESC" : "ASC";

    const [monstruos] = await pool.query(
      `SELECT ID, Nombre, Vida, Ataque, Defensa, Velocidad, url_imagen, Fecha_Creado, Fecha_Actualizado
       FROM monstruos
       WHERE ID_Usuario = ? AND Activo = 1
       ORDER BY ${ordenPor} ${direccion}`,
      [req.usuario.id]
    );

    return res.json({ exito: true, datos: monstruos });
  } catch (error) {
    next(error);
  }
}

// GET /api/monstruos/:id — solo si es activo y pertenece al usuario
async function obtenerPorId(req, res, next) {
  try {
    const [filas] = await pool.query(
      `SELECT ID, Nombre, Vida, Ataque, Defensa, Velocidad, url_imagen, Fecha_Creado, Fecha_Actualizado
       FROM monstruos
       WHERE ID = ? AND ID_Usuario = ? AND Activo = 1`,
      [req.params.id, req.usuario.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "Monstruo no encontrado." });
    }
    return res.json({ exito: true, datos: filas[0] });
  } catch (error) {
    next(error);
  }
}

// POST /api/monstruos
async function crear(req, res, next) {
  try {
    const { nombre, vida, ataque, defensa, velocidad, url_imagen } = req.body;

    const [resultado] = await pool.query(
      `INSERT INTO monstruos (Nombre, Vida, Ataque, Defensa, Velocidad, url_imagen, ID_Usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), Number(vida), Number(ataque), Number(defensa), Number(velocidad),
       url_imagen?.trim() || null, req.usuario.id]
    );

    const [nuevo] = await pool.query(
      `SELECT ID, Nombre, Vida, Ataque, Defensa, Velocidad, url_imagen, Fecha_Creado, Fecha_Actualizado
       FROM monstruos WHERE ID = ?`,
      [resultado.insertId]
    );

    return res.status(201).json({
      exito: true,
      mensaje: `Monstruo "${nombre}" creado.`,
      datos: nuevo[0],
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/monstruos/:id — solo puede editar los suyos activos
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, vida, ataque, defensa, velocidad, url_imagen } = req.body;

    const [existe] = await pool.query(
      "SELECT ID FROM monstruos WHERE ID = ? AND ID_Usuario = ? AND Activo = 1",
      [id, req.usuario.id]
    );
    if (existe.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "Monstruo no encontrado." });
    }

    await pool.query(
      `UPDATE monstruos
       SET Nombre = ?, Vida = ?, Ataque = ?, Defensa = ?, Velocidad = ?, url_imagen = ?
       WHERE ID = ? AND ID_Usuario = ?`,
      [nombre.trim(), Number(vida), Number(ataque), Number(defensa), Number(velocidad),
       url_imagen?.trim() || null, id, req.usuario.id]
    );

    const [actualizado] = await pool.query(
      `SELECT ID, Nombre, Vida, Ataque, Defensa, Velocidad, url_imagen, Fecha_Creado, Fecha_Actualizado
       FROM monstruos WHERE ID = ?`,
      [id]
    );
    return res.json({ exito: true, mensaje: "Monstruo actualizado.", datos: actualizado[0] });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/monstruos/:id
// Soft delete: UPDATE activo = 0. El registro permanece en BD.
// Las FK en batallas/turnos siguen válidas → el historial no se rompe.
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;

    const [existe] = await pool.query(
      "SELECT Nombre FROM monstruos WHERE ID = ? AND ID_Usuario = ? AND Activo = 1",
      [id, req.usuario.id]
    );
    if (existe.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "Monstruo no encontrado." });
    }

    // Soft delete: marcar como inactivo, nunca DELETE físico
    await pool.query(
      "UPDATE monstruos SET Activo = 0 WHERE ID = ?",
      [id]
    );

    return res.json({
      exito: true,
      mensaje: `"${existe[0].Nombre}" desactivado. Su historial de batallas se conserva intacto.`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
