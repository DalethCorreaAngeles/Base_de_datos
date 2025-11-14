const oracledb = require("oracledb");
require("dotenv").config();

(async () => {
  try {
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`
    });

    console.log("✅ Conectado correctamente a Oracle\n");

    // Consultar los empleados
    const empleados = await connection.execute("SELECT * FROM EMPLEADOS");
    console.log("📋 Tabla EMPLEADOS:");
    console.table(empleados.rows);

    // Consultar las finanzas
    const finanzas = await connection.execute("SELECT * FROM FINANZAS");
    console.log("\n📊 Tabla FINANZAS:");
    console.table(finanzas.rows);

    await connection.close();
    console.log("\n🔒 Conexión cerrada correctamente.");
  } catch (err) {
    console.error("❌ Error al conectar o consultar:", err);
  }
})();
