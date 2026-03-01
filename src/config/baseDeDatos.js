// src/config/baseDeDatos.js
// Conexión a MySQL usando pool de conexiones (mysql2/promise)
// El pool reutiliza conexiones y las gestiona automáticamente.

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PUERTO   || 3306,
  user:               process.env.DB_USUARIO  || "root",
  password:           process.env.DB_CONTRASENA,
  database:           process.env.DB_NOMBRE   || "batalla_monstruos",
  waitForConnections: true,
  connectionLimit:    10,   // máximo de conexiones simultáneas
  queueLimit:         0,
  timezone:           "+00:00",
  charset:            "utf8mb4",
});

// Verificar la conexión al arrancar
async function verificarConexion() {
  try {
    const conexion = await pool.getConnection();
    console.log("Conexión a la base de datos establecida correctamente");
    conexion.release();
  } catch (error) {
    console.error("Error al conectar con MySQL:", error.message);
    process.exit(1); // detener el servidor si no hay BD
  }
}

module.exports = { pool, verificarConexion };
