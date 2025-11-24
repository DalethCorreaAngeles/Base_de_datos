require('dotenv').config();

const { connectPostgreSQL, postgresPool, postgresConfig } = require('./api/config/postgres');
const { connectMongoDB, disconnectMongoDB, getMongoConnectionStatus, mongoURI } = require('./api/config/mongo');

// ===========================================
// SCRIPT DE PRUEBA DE CONEXIONES
// ===========================================

async function testPostgreSQL() {
  console.log('\n📊 Probando conexión a PostgreSQL...');
  console.log('==========================================\n');

  // Mostrar información de conexión antes de conectar
  console.log('🔗 Información de conexión:');
  console.log(`   Host: ${postgresConfig.host}`);
  console.log(`   Puerto: ${postgresConfig.port}`);
  console.log(`   Base de datos: ${postgresConfig.database}`);
  console.log(`   Usuario: ${postgresConfig.user}`);
  console.log(`   Enlace: postgresql://${postgresConfig.user}@${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database}\n`);

  try {
    // Intentar conectar
    const client = await connectPostgreSQL();

    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ PostgreSQL conectado correctamente');
    console.log(`   🔗 Enlace de conexión: postgresql://${postgresConfig.user}@${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database}`);
    console.log(`   📅 Hora del servidor: ${result.rows[0].current_time}`);
    console.log(`   📦 Versión: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

    // Verificar si existe la base de datos
    const dbResult = await client.query('SELECT current_database() as db_name');
    console.log(`   💾 Base de datos: ${dbResult.rows[0].db_name}`);
    console.log(`   🖥️  Host:Puerto: ${postgresConfig.host}:${postgresConfig.port}`);

    // Verificar tablas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`   📋 Tablas existentes: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);
    } else {
      console.log('   ⚠️  No se encontraron tablas en la base de datos');
    }

    client.release();
    return { success: true, message: 'PostgreSQL conectado exitosamente' };

  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:');
    console.error(`   ${error.message}`);
    console.error(`   🔗 Enlace intentado: postgresql://${postgresConfig.user}@${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database}`);
    console.error('\n   Soluciones posibles:');
    console.error('   1. Verifica que PostgreSQL esté ejecutándose');
    console.error('   2. Verifica que la base de datos "chimbote_travel" exista');
    console.error('   3. Verifica las credenciales en .env o las variables de entorno');
    console.error(`   4. Verifica que el puerto ${postgresConfig.port} esté disponible`);
    return { success: false, message: error.message };
  }
}

async function testMongoDB() {
  console.log('\n📊 Probando conexión a MongoDB...');
  console.log('==========================================\n');

  // Detectar si es Atlas (mongodb+srv) o local
  const isAtlas = mongoURI.startsWith('mongodb+srv://');

  // Mostrar información de conexión antes de conectar
  console.log('🔗 Información de conexión:');
  // Extraer información de la URI sin mostrar la contraseña completa
  try {
    if (isAtlas) {
      const uriMatch = mongoURI.match(/mongodb\+srv:\/\/([^:]+):[^@]+@([^/]+)(?:\/([^?]+))?/);
      if (uriMatch) {
        const [, user, host, database] = uriMatch;
        console.log(`   Tipo: MongoDB Atlas (Cloud)`);
        console.log(`   Host: ${host}`);
        console.log(`   Usuario: ${user}`);
        console.log(`   Base de datos: ${database || 'por defecto'}`);
        console.log(`   Puerto: No especificado (automático vía SRV - normalmente 27017)`);
        console.log(`   🔗 Protocolo: mongodb+srv (SRV resuelve el puerto automáticamente)`);
      }
    } else {
      const localMatch = mongoURI.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)(?:\/([^?]+))?/);
      if (localMatch) {
        const [, user, , host, port, database] = localMatch;
        console.log(`   Tipo: MongoDB Local`);
        console.log(`   Host: ${host}`);
        console.log(`   Puerto: ${port}`);
        if (user) console.log(`   Usuario: ${user}`);
        if (database) console.log(`   Base de datos: ${database}`);
      }
    }
  } catch (e) {
    console.log(`   URI: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
  }
  console.log(`   🔗 Enlace: ${mongoURI.replace(/:[^:@]+@/, ':****@')}\n`);

  try {
    // Intentar conectar
    const connection = await connectMongoDB();

    // Obtener información de la conexión
    const status = getMongoConnectionStatus();
    const isAtlasConnection = mongoURI.startsWith('mongodb+srv://');

    console.log('✅ MongoDB conectado correctamente');
    console.log(`   🔗 Enlace de conexión: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`   📊 Estado: ${status.state}`);
    console.log(`   🖥️  Host: ${status.host}`);

    if (isAtlasConnection) {
      // Para Atlas, el puerto se resuelve automáticamente via SRV
      console.log(`   🔌 Puerto: ${status.port || 27017} (resuelto automáticamente por SRV)`);
      console.log(`   ℹ️  Nota: Con mongodb+srv:// no necesitas especificar el puerto en la URI`);
    } else {
      // Para conexiones locales, mostrar el puerto específico
      console.log(`   🔌 Puerto: ${status.port || 'N/A'}`);
    }
    console.log(`   💾 Base de datos: ${status.database}`);

    // Probar una operación simple
    const adminDb = connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    console.log(`   📦 Versión: ${serverStatus.version}`);
    console.log(`   ⏱️  Uptime: ${Math.floor(serverStatus.uptime / 60)} minutos`);

    // Listar colecciones existentes
    const collections = await connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log(`   📋 Colecciones existentes: ${collections.map(c => c.name).join(', ')}`);
    } else {
      console.log('   ⚠️  No se encontraron colecciones en la base de datos');
    }

    return { success: true, message: 'MongoDB conectado exitosamente' };

  } catch (error) {
    console.error('❌ Error conectando a MongoDB:');
    console.error(`   ${error.message}`);
    console.error(`   🔗 Enlace intentado: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
    console.error('\n   Soluciones posibles:');
    console.error('   1. Verifica que MongoDB esté ejecutándose');
    console.error('   2. Verifica la URI de conexión en .env (MONGODB_URI)');
    console.error('   3. Verifica que el puerto 27017 esté disponible (si es local)');
    console.error('   4. Si usas MongoDB Atlas, verifica la cadena de conexión y la IP permitida');
    return { success: false, message: error.message };
  }
}

async function testConnections() {
  console.log('🧪 PRUEBA DE CONEXIONES A BASES DE DATOS');
  console.log('==========================================');
  console.log('Probando PostgreSQL y MongoDB...\n');

  const results = {
    postgresql: null,
    mongodb: null
  };

  // Probar PostgreSQL
  results.postgresql = await testPostgreSQL();

  // Esperar un poco antes de probar MongoDB
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Probar MongoDB
  results.mongodb = await testMongoDB();

  // Cerrar conexiones
  console.log('\n📊 Cerrando conexiones...');
  try {
    if (results.mongodb?.success) {
      await disconnectMongoDB();
    }
    if (results.postgresql?.success) {
      await postgresPool.end();
      console.log('✅ PostgreSQL desconectado');
    }
  } catch (error) {
    console.error('⚠️  Error cerrando conexiones:', error.message);
  }

  // Resumen final con enlaces
  console.log('\n==========================================');
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('==========================================');

  if (results.postgresql.success) {
    console.log(`PostgreSQL: ✅ Conectado`);
    console.log(`   🔗 Enlace: postgresql://${postgresConfig.user}@${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database}`);
  } else {
    console.log(`PostgreSQL: ❌ Error`);
    console.log(`   🔗 Enlace intentado: postgresql://${postgresConfig.user}@${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database}`);
  }

  if (results.mongodb.success) {
    console.log(`MongoDB:    ✅ Conectado`);
    console.log(`   🔗 Enlace: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
  } else {
    console.log(`MongoDB:    ❌ Error`);
    console.log(`   🔗 Enlace intentado: ${mongoURI.replace(/:[^:@]+@/, ':****@')}`);
  }

  console.log('==========================================\n');

  // Salir con código de error si alguna falló
  if (!results.postgresql.success || !results.mongodb.success) {
    process.exit(1);
  } else {
    console.log('🎉 ¡Todas las conexiones fueron exitosas!');
    process.exit(0);
  }
}

// Ejecutar pruebas
testConnections().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error);
  process.exit(1);
});

// ====================================================
// 🔗 SCRIPT DE PRUEBA DE CONEXIÓN A ORACLE
// ====================================================
require("dotenv").config();
const { getOracleConnection } = require("./api/config/oracle");

async function testOracle() {
  console.log("\n=========================================");
  console.log("🔗 PRUEBA DE CONEXIÓN A ORACLE");
  console.log("=========================================\n");

  console.log("📡 Información de conexión:");
  console.log(`   Host: ${process.env.ORACLE_HOST}`);
  console.log(`   Puerto: ${process.env.ORACLE_PORT}`);
  console.log(`   Servicio: ${process.env.ORACLE_SERVICE_NAME}`);
  console.log(`   Usuario: ${process.env.ORACLE_USER}\n`);

  try {
    const conn = await getOracleConnection();
    console.log("✅ Conexión exitosa con Oracle\n");

    const result = await conn.execute(
      "SELECT 'Conectado a Oracle desde Node.js' AS MENSAJE FROM DUAL"
    );

    // Mostrar datos reales de la tabla EMPLEADOS
    const empleados = await conn.execute("SELECT * FROM EMPLEADOS");
    console.log("\n📋 Tabla EMPLEADOS:");
    console.table(empleados.rows);


    console.log("📢 Resultado de prueba:");
    console.log(result.rows[0].MENSAJE);
    await conn.close();

    console.log("\n🔒 Conexión cerrada correctamente.");
  } catch (err) {
    console.error("❌ Error al conectar a Oracle:");
    console.error(err);
  }
}

// Ejecutar solo la prueba de Oracle
testOracle();
