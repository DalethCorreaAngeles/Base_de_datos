const { Pool } = require('pg');

// ===========================================
// CONFIGURACIÓN DE POSTGRESQL
// ===========================================

// Configuración de la conexión a PostgreSQL
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'chimbote_travel',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'admin123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
};

const postgresPool = new Pool(postgresConfig);

// Manejo de errores de conexión
postgresPool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

// ===========================================
// FUNCIONES DE CONEXIÓN POSTGRESQL
// ===========================================

// Conectar a PostgreSQL
async function connectPostgreSQL() {
  try {
    const client = await postgresPool.connect();
    console.log('✅ PostgreSQL conectado exitosamente');
    console.log(`   Base de datos: ${postgresConfig.database}`);
    console.log(`   Host: ${postgresConfig.host}:${postgresConfig.port}`);
    return client;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    console.error('   Verifica que PostgreSQL esté ejecutándose y las credenciales sean correctas');
    throw error;
  }
}

// Inicializar conexión a PostgreSQL
async function initializePostgreSQL() {
  console.log('📊 Iniciando conexión a PostgreSQL...');
  
  try {
    await connectPostgreSQL();
    console.log('✅ PostgreSQL conectado exitosamente');
  } catch (error) {
    console.error('❌ Error inicializando PostgreSQL:', error);
    console.error('   Soluciones posibles:');
    console.error('   1. Verifica que PostgreSQL esté ejecutándose');
    console.error('   2. Crea la base de datos "chimbote_travel"');
    console.error('   3. Verifica las credenciales en la configuración');
    throw error;
  }
}

// ===========================================
// EXPORTAR CONEXIONES Y FUNCIONES
// ===========================================

module.exports = {
  // Conexión a PostgreSQL
  postgresPool,
  
  // Funciones de conexión
  connectPostgreSQL,
  initializePostgreSQL,
  
  // Configuración
  postgresConfig
};
