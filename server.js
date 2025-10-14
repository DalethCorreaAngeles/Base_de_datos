const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializeDatabases } = require('./api/config/database');
const PostgreSQLModels = require('./api/models/postgresql');
const { MongoDBModels } = require('./api/models/mongodb');
const OracleModels = require('./api/models/oracle');
const CassandraModels = require('./api/models/cassandra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
app.use(limiter);

// Rutas
app.use('/api/destinations', require('./api/routes/destinations'));
app.use('/api/reservations', require('./api/routes/reservations'));
app.use('/api/company', require('./api/routes/company'));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Chimbote Travel Tours API',
    version: '1.0.0',
    endpoints: {
      destinations: '/api/destinations',
      reservations: '/api/reservations',
      company: '/api/company'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo salió mal!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: 'La ruta solicitada no existe'
  });
});

// ===========================================
// INICIALIZAR SERVIDOR CON TODAS LAS BASES DE DATOS
// ===========================================
async function startServer() {
  try {
    // 1. Inicializar todas las conexiones a bases de datos
    await initializeDatabases();
    
    // 2. Inicializar tablas y modelos
    console.log('📊 Inicializando modelos de bases de datos...');
    
    // PostgreSQL
    await PostgreSQLModels.initializeTables();
    
    // MongoDB
    await MongoDBModels.initializeSiteConfig();
    
    // Oracle
    const oracleConnection = await require('./api/config/database').connectOracle();
    await OracleModels.initializeTables(oracleConnection);
    app.locals.oracleConnection = oracleConnection;
    
    // Cassandra
    const cassandraClient = await require('./api/config/database').connectCassandra();
    const cassandraModels = new CassandraModels(cassandraClient);
    await cassandraModels.initializeTables();
    app.locals.cassandraClient = cassandraClient;
    
    // 3. Iniciar servidor
    app.listen(PORT, () => {
      console.log('🎉 Servidor iniciado exitosamente!');
      console.log(`🚀 API corriendo en http://localhost:${PORT}`);
      console.log(`📚 Documentación disponible en http://localhost:${PORT}/api`);
      console.log('\n📊 Bases de datos conectadas:');
      console.log('   ✅ PostgreSQL - Destinos y Reservas');
      console.log('   ✅ MongoDB - Analytics y Logs');
      console.log('   ✅ Oracle - Empleados y Finanzas');
      console.log('   ✅ Cassandra - Cache y Notificaciones');
      console.log('\n🔗 Endpoints disponibles:');
      console.log('   📍 GET  /api/destinations');
      console.log('   📍 POST /api/reservations');
      console.log('   📍 GET  /api/company/info');
      console.log('   📍 GET  /api/company/health');
    });
    
  } catch (error) {
    console.error('💥 Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app;
