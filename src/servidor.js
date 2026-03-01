// src/servidor.js
// Punto de entrada del servidor Express.
// Configura middlewares globales, rutas y manejo de errores.

require("dotenv").config();
const express              = require("express");
const cors                 = require("cors");
const opcionesCors         = require("./config/cors");
const { verificarConexion } = require("./config/baseDeDatos");
const { manejadorErrores } = require("./middlewares/manejadorErrores");

// Rutas
const rutasAuth       = require("./rutas/rutasAuth");
const rutasMonstruos  = require("./rutas/rutasMonstruos");
const rutasBatallas   = require("./rutas/rutasBatallas");

const app    = express();
const PUERTO = process.env.PUERTO || 3001;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors(opcionesCors));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Log de peticiones en desarrollo
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Rutas ─────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    exito:   true,
    mensaje: "API Batalla de Monstruos funcionando correctamente",
    version: "1.0.0",
    rutas: {
      auth:       "/api/auth",
      monstruos:  "/api/monstruos",
      batallas:   "/api/batallas",
    },
  });
});

app.use("/api/auth",      rutasAuth);
app.use("/api/monstruos", rutasMonstruos);
app.use("/api/batallas",  rutasBatallas);

// Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({ exito: false, mensaje: "Ruta no encontrada." });
});

// ── Manejo centralizado de errores ────────────────────────────
app.use(manejadorErrores);

// ── Arrancar servidor ─────────────────────────────────────────
async function arrancar() {
  await verificarConexion();
  app.listen(PUERTO, () => {
    console.log(` Servidor corriendo en http://localhost:${PUERTO}`);
  });
}

arrancar();
