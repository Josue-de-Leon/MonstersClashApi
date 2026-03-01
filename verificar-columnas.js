// Script temporal para verificar las columnas de la tabla monstruos
require("dotenv").config();
const mysql = require("mysql2/promise");

async function verificar() {
  try {
    const conexion = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PUERTO,
      user: process.env.DB_USUARIO,
      password: process.env.DB_CONTRASENA,
      database: process.env.DB_NOMBRE,
    });

    console.log("Conectado a la base de datos\n");
    
    // Ver columnas de la tabla monstruos
    const [columnas] = await conexion.query("DESCRIBE monstruos");
    console.log(" Columnas de la tabla 'monstruos':");
    console.table(columnas.map(c => ({ Columna: c.Field, Tipo: c.Type })));

    await conexion.end();
  } catch (error) {
    console.error(" Error:", error.message);
  }
}

verificar();
