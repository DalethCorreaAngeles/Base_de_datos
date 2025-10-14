const { Pool } = require('pg');
const mongoose = require('mongoose');
const oracledb = require('oracledb');
const cassandra = require('cassandra-driver');

// ===========================================
// CONFIGURACIÓN DE CONEXIONES A BASES DE DATOS
// ===========================================

// 1. POSTGRESQL - Base de datos relacional para destinos y reservas
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'chimbote_travel',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const postgresPool = new Pool(postgresConfig);

// 2. MONGODB - Base de datos no relacional para logs y analytics
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chimbote_travel',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

// 3. ORACLE - Base de datos relacional para datos corporativos
const oracleConfig = {
  user: process.env.ORACLE_USER || 'chimbote_user',
  password: process.env.ORACLE_PASSWORD || 'password',
  connectString: `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || 1521}/${process.env.ORACLE_SERVICE_NAME || 'XE'}`,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  stmtCacheSize: 30
};

// 4. CASSANDRA - Base de datos no relacional para sesiones y cache
const cassandraConfig = {
  contactPoints: (process.env.CASSANDRA_HOSTS || 'localhost:9042').split(','),
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'chimbote_travel',
  credentials: {
    username: process.env.CASSANDRA_USER || 'cassandra',
    password: process.env.CASSANDRA_PASSWORD || 'password'
  },
  pooling: {
    coreConnectionsPerHost: {
      '0': 2,
      '1': 1,
      '2': 1
    }
  }
};

// ===========================================
// FUNCIONES DE CONEXIÓN
// ===========================================

// Conectar a PostgreSQL
async function connectPostgreSQL() {
  try {
    const client = await postgresPool.connect();
    console.log('✅ PostgreSQL conectado exitosamente');
    return client;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    throw error;
  }
}

// Conectar a MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log('✅ MongoDB conectado exitosamente');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    throw error;
  }
}

// Conectar a Oracle
async function connectOracle() {
  try {
    // Configurar Oracle
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    oracledb.autoCommit = true;
    
    const connection = await oracledb.getConnection(oracleConfig);
    console.log('✅ Oracle conectado exitosamente');
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a Oracle:', error.message);
    throw error;
  }
}

// Conectar a Cassandra
async function connectCassandra() {
  try {
    const client = new cassandra.Client(cassandraConfig);
    await client.connect();
    console.log('✅ Cassandra conectado exitosamente');
    return client;
  } catch (error) {
    console.error('❌ Error conectando a Cassandra:', error.message);
    throw error;
  }
}

// ===========================================
// INICIALIZAR TODAS LAS CONEXIONES
// ===========================================

async function initializeDatabases() {
  console.log('🚀 Iniciando conexiones a bases de datos...');
  
  try {
    // Conectar a todas las bases de datos
    await Promise.all([
      connectPostgreSQL(),
      connectMongoDB(),
      connectOracle(),
      connectCassandra()
    ]);
    
    console.log('🎉 Todas las bases de datos conectadas exitosamente');
  } catch (error) {
    console.error('💥 Error inicializando bases de datos:', error);
    process.exit(1);
  }
}

// ===========================================
// EXPORTAR CONEXIONES Y FUNCIONES
// ===========================================

module.exports = {
  // Conexiones
  postgresPool,
  mongoose,
  oracledb,
  cassandraConfig,
  
  // Funciones de conexión
  connectPostgreSQL,
  connectMongoDB,
  connectOracle,
  connectCassandra,
  initializeDatabases,
  
  // Configuraciones
  postgresConfig,
  mongoConfig,
  oracleConfig,
  cassandraConfig
};
