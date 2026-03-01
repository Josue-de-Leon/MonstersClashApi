// src/utilidades/simuladorBatalla.js
// Lógica pura de combate. Devuelve "turnos" (array plano, un objeto
// por ataque) en lugar de "registro", listo para insertar en
// la tabla turnos_batalla fila a fila.
//
// REGLAS:
//   1. Mayor velocidad ataca primero. Empate → mayor ataque.
//   2. Daño = ataque_atacante − defensa_defensor  (mínimo 1)
//   3. La batalla termina cuando la vida de un monstruo llega a 0.

/**
 * @param {{ ID, Nombre, Vida, Ataque, Defensa, Velocidad }} m1
 * @param {{ ID, Nombre, Vida, Ataque, Defensa, Velocidad }} m2
 * @returns {{
 *   idGanador:  number,
 *   idPerdedor: number,
 *   turnos: Array<{
 *     numeroTurno: number,
 *     ordenEnTurno: number,
 *     idAtacante: number, nombreAtacante: string,
 *     idDefensor: number, nombreDefensor: string,
 *     dano: number, vidaRestanteDefensor: number
 *   }>
 * }}
 */
function simularBatalla(m1, m2) {
  // ── Determinar quién ataca primero ─────────────────────────
  let atacante, defensor;

  if (m1.Velocidad > m2.Velocidad) {
    atacante = { ...m1, vidaActual: m1.Vida };
    defensor = { ...m2, vidaActual: m2.Vida };
  } else if (m2.Velocidad > m1.Velocidad) {
    atacante = { ...m2, vidaActual: m2.Vida };
    defensor = { ...m1, vidaActual: m1.Vida };
  } else {
    // Empate de velocidad → mayor ataque primero
    if (m1.Ataque >= m2.Ataque) {
      atacante = { ...m1, vidaActual: m1.Vida };
      defensor = { ...m2, vidaActual: m2.Vida };
    } else {
      atacante = { ...m2, vidaActual: m2.Vida };
      defensor = { ...m1, vidaActual: m1.Vida };
    }
  }

  const turnos = [];
  let numeroTurno    = 1;
  let primerAtaque   = true;  // dentro del turno: 1er o 2do ataque

  // ── Simulación ──────────────────────────────────────────────
  while (atacante.vidaActual > 0 && defensor.vidaActual > 0) {
    const dano = Math.max(1, atacante.Ataque - defensor.Defensa);
    defensor.vidaActual = Math.max(0, defensor.vidaActual - dano);

    turnos.push({
      numeroTurno,
      ordenEnTurno:          primerAtaque ? 1 : 2,
      idAtacante:            atacante.ID,
      nombreAtacante:        atacante.Nombre,
      idDefensor:            defensor.ID,
      nombreDefensor:        defensor.Nombre,
      dano,
      vidaRestanteDefensor:  defensor.vidaActual,
    });

    if (defensor.vidaActual <= 0) break;

    // Intercambiar roles
    [atacante, defensor] = [defensor, atacante];

    if (!primerAtaque) {
      numeroTurno++;
      primerAtaque = true;
    } else {
      primerAtaque = false;
    }
  }

  // ── Resultado ───────────────────────────────────────────────
  const ganador  = defensor.vidaActual <= 0 ? atacante : defensor;
  const perdedor = ganador.ID === atacante.ID ? defensor : atacante;

  return { idGanador: ganador.ID, idPerdedor: perdedor.ID, turnos };
}

module.exports = { simularBatalla };
