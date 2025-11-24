const { Pool } = require('pg');

// Configuracion de PostgreSQL

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

// Funciones de conexion

// Conectar a PostgreSQL
async function connectPostgreSQL() {
  try {
    const client = await postgresPool.connect();
    // Conectado
    return client;
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error.message);
    throw error;
  }
}

// Inicializar conexión a PostgreSQL
async function initializePostgreSQL() {
  // Iniciando...

  try {
    await connectPostgreSQL();
  } catch (error) {
    console.error('Error inicializando PostgreSQL:', error.message);
    throw error;
  }
}

// Exportar

module.exports = {
  // Conexión a PostgreSQL
  postgresPool,

  // Funciones de conexión
  connectPostgreSQL,
  initializePostgreSQL,

  // Configuración
  postgresConfig
};
