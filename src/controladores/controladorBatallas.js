// src/controladores/controladorBatallas.js
// Con soft delete los monstruos nunca se borran físicamente.
// Las FK son RESTRICT normales → el JOIN siempre encuentra el monstruo.
// No se necesita tabla de snapshots ni participantes_batalla.

const { pool }           = require("../config/baseDeDatos");
const { simularBatalla } = require("../utilidades/simuladorBatalla");

// Query base reutilizable para el historial.
// JOIN directo — sin condición activo — el monstruo siempre existe.
// Se expone el campo "activo" de cada monstruo para que el frontend
// pueda mostrar una etiqueta "[desactivado]" si corresponde.
const SELECT_HISTORIAL = `
  SELECT
    b.ID,
    b.ID_Monstruo1, m1.Nombre AS nombre_monstruo1, m1.url_imagen AS imagen_monstruo1, m1.Activo AS activo_monstruo1,
    b.ID_Monstruo2, m2.Nombre AS nombre_monstruo2, m2.url_imagen AS imagen_monstruo2, m2.Activo AS activo_monstruo2,
    b.ID_Monstruo_Ganador,   mg.Nombre AS nombre_ganador,   mg.url_imagen AS imagen_ganador,
    b.ID_Monstruo_Perdedor,  mp.Nombre AS nombre_perdedor,
    b.Fecha_creado
  FROM batallas b
  JOIN monstruos m1 ON b.ID_Monstruo1 = m1.ID
  JOIN monstruos m2 ON b.ID_Monstruo2 = m2.ID
  JOIN monstruos mg ON b.ID_Monstruo_Ganador   = mg.ID
  JOIN monstruos mp ON b.ID_Monstruo_Perdedor  = mp.ID
`;

// GET /api/batallas — historial del usuario autenticado
async function obtenerTodas(req, res, next) {
  try {
    const [batallas] = await pool.query(
      `${SELECT_HISTORIAL}
       WHERE b.ID_Usuario = ? AND b.Activo = 1 
       ORDER BY b.Fecha_creado DESC`,
      [req.usuario.id]
    );

    return res.json({ exito: true, datos: batallas });
  } catch (error) {
    next(error);
  }
}

// GET /api/batallas/:id — detalle + turnos
async function obtenerPorId(req, res, next) {
  try {
    const { id }    = req.params;
    const idUsuario = req.usuario.id;

    const [filas] = await pool.query(
      `SELECT
         b.ID, b.Fecha_creado,
         b.ID_Monstruo1,
         m1.Nombre AS nombre_monstruo1, m1.url_imagen AS imagen_monstruo1,
         m1.Vida AS vida_monstruo1, m1.Ataque AS ataque_monstruo1,
         m1.Defensa AS defensa_monstruo1, m1.Velocidad AS velocidad_monstruo1,
         m1.Activo AS activo_monstruo1,
         b.ID_Monstruo2,
         m2.Nombre AS nombre_monstruo2, m2.url_imagen AS imagen_monstruo2,
         m2.Vida AS vida_monstruo2, m2.Ataque AS ataque_monstruo2,
         m2.Defensa AS defensa_monstruo2, m2.Velocidad AS velocidad_monstruo2,
         m2.Activo AS activo_monstruo2,
         b.ID_Monstruo_Ganador,  mg.Nombre AS nombre_ganador,  mg.url_imagen AS imagen_ganador,
         b.ID_Monstruo_Perdedor, mp.Nombre AS nombre_perdedor
       FROM batallas b
       JOIN monstruos m1 ON b.ID_Monstruo1 = m1.ID
       JOIN monstruos m2 ON b.ID_Monstruo2 = m2.ID
       JOIN monstruos mg ON b.ID_Monstruo_Ganador   = mg.ID
       JOIN monstruos mp ON b.ID_Monstruo_Perdedor  = mp.ID
       WHERE b.ID = ? AND b.ID_Usuario = ? AND b.Activo = 1`,
      [id, idUsuario]
    );

    if (filas.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "Batalla no encontrada." });
    }

    const [turnos] = await pool.query(
      `SELECT
         numero_turno           AS turno,
         orden_en_turno         AS orden,
         id_atacante,
         nombre_atacante        AS atacante,
         id_defensor,
         nombre_defensor        AS defensor,
         dano,
         vida_restante_defensor AS vidaRestante
       FROM turnos_batalla
       WHERE id_batalla = ?
       ORDER BY numero_turno, orden_en_turno`,
      [id]
    );

    return res.json({ exito: true, datos: { ...filas[0], turnos } });
  } catch (error) {
    next(error);
  }
}

// POST /api/batallas
// Solo puede usar monstruos activos (activo = 1).
// Transacción: batallas → turnos_batalla.
// Ya no hay tabla participantes_batalla — el historial lee directamente
// de monstruos via JOIN (el registro nunca se borra físicamente).
async function crear(req, res, next) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const { id_monstruo1, id_monstruo2 } = req.body;
    const idUsuario = req.usuario.id;

    if (Number(id_monstruo1) === Number(id_monstruo2)) {
      await conexion.rollback();
      conexion.release();
      return res.status(400).json({
        exito: false,
        mensaje: "Un monstruo no puede batallar contra sí mismo.",
      });
    }

    // Solo monstruos activos del usuario pueden batallar
    const [filas] = await conexion.query(
      `SELECT ID, Nombre, Vida, Ataque, Defensa, Velocidad, url_imagen
       FROM monstruos
       WHERE ID IN (?, ?) AND ID_Usuario = ? AND Activo = 1`,
      [id_monstruo1, id_monstruo2, idUsuario]
    );

    if (filas.length < 2) {
      await conexion.rollback();
      conexion.release();
      return res.status(404).json({
        exito: false,
        mensaje: "Uno o ambos monstruos no están disponibles en tu colección.",
      });
    }

    const m1 = filas.find((m) => m.ID === Number(id_monstruo1));
    const m2 = filas.find((m) => m.ID === Number(id_monstruo2));

    const { idGanador, idPerdedor, turnos } = simularBatalla(m1, m2);
    const ganador  = idGanador  === m1.ID ? m1 : m2;
    const perdedor = idPerdedor === m1.ID ? m1 : m2;

    // Insertar cabecera de la batalla
    const [resBatalla] = await conexion.query(
      `INSERT INTO batallas (ID_Monstruo1, ID_Monstruo2, ID_Monstruo_Ganador, ID_Monstruo_Perdedor, ID_Usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [m1.ID, m2.ID, idGanador, idPerdedor, idUsuario]
    );
    const idBatalla = resBatalla.insertId;

    // Insertar turnos (bulk insert)
    const valoresTurnos = turnos.map((t) => [
      idBatalla, t.numeroTurno, t.ordenEnTurno,
      t.idAtacante,  t.nombreAtacante,
      t.idDefensor,  t.nombreDefensor,
      t.dano, t.vidaRestanteDefensor,
    ]);

    await conexion.query(
      `INSERT INTO turnos_batalla
         (id_batalla, numero_turno, orden_en_turno,
          id_atacante, nombre_atacante,
          id_defensor, nombre_defensor,
          dano, vida_restante_defensor)
       VALUES ?`,
      [valoresTurnos]
    );

    await conexion.commit();
    conexion.release();

    const turnosFormateados = turnos.map((t) => ({
      turno:        t.numeroTurno,
      orden:        t.ordenEnTurno,
      idAtacante:   t.idAtacante,
      atacante:     t.nombreAtacante,
      idDefensor:   t.idDefensor,
      defensor:     t.nombreDefensor,
      dano:         t.dano,
      vidaRestante: t.vidaRestanteDefensor,
    }));

    return res.status(201).json({
      exito:   true,
      mensaje: `¡${ganador.nombre} ganó la batalla!`,
      datos: {
        id:               idBatalla,
        id_monstruo1:     m1.ID,
        id_monstruo2:     m2.ID,
        id_ganador:       idGanador,
        id_perdedor:      idPerdedor,
        nombre_monstruo1: m1.Nombre,
        imagen_monstruo1: m1.url_imagen || null,
        activo_monstruo1: 1,
        nombre_monstruo2: m2.Nombre,
        imagen_monstruo2: m2.url_imagen || null,
        activo_monstruo2: 1,
        nombre_ganador:   ganador.Nombre,
        imagen_ganador:   ganador.url_imagen || null,
        nombre_perdedor:  perdedor.Nombre,
        turnos:           turnosFormateados,
        creado_en:        new Date().toISOString(),
        monstruo1: { id: m1.ID, nombre: m1.Nombre, vida: m1.Vida, ataque: m1.Ataque, defensa: m1.Defensa, velocidad: m1.Velocidad, url_imagen: m1.url_imagen },
        monstruo2: { id: m2.ID, nombre: m2.Nombre, vida: m2.Vida, ataque: m2.Ataque, defensa: m2.Defensa, velocidad: m2.Velocidad, url_imagen: m2.url_imagen },
      },
    });
  } catch (error) {
    await conexion.rollback();
    conexion.release();
    next(error);
  }
}

// DELETE /api/batallas/:id
// Las batallas sí se borran físicamente (CASCADE elimina sus turnos).
// Esto es intencional: el usuario gestiona su historial.
// Los monstruos no se tocan.
async function eliminar(req, res, next) {
  try {
    const { id }    = req.params;
    const idUsuario = req.usuario.id;

    const [existe] = await pool.query(
      "SELECT ID FROM batallas WHERE ID = ? AND ID_Usuario = ?",
      [id, idUsuario]
    );
    if (existe.length === 0) {
      return res.status(404).json({ exito: false, mensaje: "Batalla no encontrada." });
    }

    // Soft delete: marcar como inactivo, nunca DELETE físico
    await pool.query(
      "UPDATE batallas SET Activo = 0 WHERE ID = ?",
      [id]
    );
    // CASCADE elimina automáticamente los turnos_batalla asociados
    //await pool.query("DELETE FROM batallas WHERE ID = ? AND ID_Usuario = ?", [id, idUsuario]);

    return res.json({ exito: true, mensaje: `Batalla #${id} eliminada.` });
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerTodas, obtenerPorId, crear, eliminar };
