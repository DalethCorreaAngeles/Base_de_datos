require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializePostgreSQL } = require('./api/config/database');
const { initializeMongoDB } = require('./api/config/indexMongo');
const PostgreSQLModels = require('./api/models/postgresql');
const { MongoDBModels } = require('./api/models/mongodb');

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
app.use('/api/activity-logs', require('./api/routes/activity-logs'));
app.use('/api/analytics', require('./api/routes/analytics'));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'Chimbote Travel Tours API',
    version: '1.0.0',
    endpoints: {
      destinations: '/api/destinations',
      reservations: '/api/reservations',
      company: '/api/company',
      activityLogs: '/api/activity-logs',
      analytics: '/api/analytics'
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
// INICIALIZAR SERVIDOR CON BASES DE DATOS
// ===========================================
async function startServer() {
  const dbStatus = {
    postgresql: false,
    mongodb: false
  };

  try {
    // 1. Inicializar MongoDB (no crítico - el servidor puede iniciar sin él)
    try {
      console.log('📊 Inicializando MongoDB...');
      await initializeMongoDB();
      await MongoDBModels.initializeSiteConfig();
      dbStatus.mongodb = true;
      console.log('✅ MongoDB inicializado correctamente');
    } catch (mongoError) {
      console.warn('⚠️  MongoDB no disponible:', mongoError.message);
      console.warn('   El servidor continuará sin MongoDB');
    }

    // 2. Inicializar PostgreSQL (crítico para algunas funcionalidades)
    try {
      console.log('📊 Inicializando PostgreSQL...');
      await initializePostgreSQL();
      console.log('📊 Inicializando tablas de PostgreSQL...');
      await PostgreSQLModels.initializeTables();
      await insertSampleData();
      dbStatus.postgresql = true;
      console.log('✅ PostgreSQL inicializado correctamente');
    } catch (postgresError) {
      console.warn('⚠️  PostgreSQL no disponible:', postgresError.message);
      console.warn('   El servidor continuará, pero algunas funcionalidades no estarán disponibles');
    }

    // 3. Iniciar servidor (siempre inicia, incluso si las DBs fallan)
    app.listen(PORT, () => {
      console.log('\n==========================================');
      console.log('🚀 Servidor iniciado exitosamente!');
      console.log('==========================================');
      console.log(`✅ API corriendo en http://localhost:${PORT}`);
      console.log('\n📊 Estado de bases de datos:');
      console.log(`   PostgreSQL: ${dbStatus.postgresql ? '✅ Conectado' : '❌ No disponible'}`);
      console.log(`   MongoDB:    ${dbStatus.mongodb ? '✅ Conectado' : '❌ No disponible'}`);
      console.log('\n🔗 Endpoints disponibles:');
      console.log('    GET  /api/destinations');
      console.log('    POST /api/reservations');
      console.log('    GET  /api/company/info');
      console.log('    GET  /api/activity-logs');
      console.log('    GET  /api/analytics');
      console.log('==========================================\n');
    });
  } catch (error) {
    console.error('❌ Error crítico iniciando servidor:', error);
    process.exit(1);
  }
}

// Función para insertar datos de ejemplo
async function insertSampleData() {
  try {
    const { postgresPool } = require('./api/config/database');
    
    // Verificar si ya existen datos
    const checkQuery = 'SELECT COUNT(*) FROM destinations';
    const result = await postgresPool.query(checkQuery);
    
    if (result.rows[0].count > 0) {
      console.log('📊 Datos de ejemplo ya existen');
      return;
    }
    
    console.log('📊 Insertando datos de ejemplo...');
    
    // Insertar destinos de ejemplo
    const destinations = [
      {
        name: 'Playa Tortugas',
        location: 'Chimbote, Ancash',
        description: 'Hermosa playa con aguas cristalinas perfecta para relajarse',
        price: 150.00,
        duration_days: 1,
        includes: ['Transporte', 'Almuerzo', 'Guía turístico'],
        image_url: '/assets/logo-chimbote.jpg'
      },
      {
        name: 'Isla Blanca',
        location: 'Chimbote, Ancash',
        description: 'Isla paradisíaca con playas de arena blanca y aguas turquesas',
        price: 200.00,
        duration_days: 1,
        includes: ['Transporte en lancha', 'Almuerzo', 'Snorkeling', 'Guía'],
        image_url: '/assets/logo-chimbote.jpg'
      },
      {
        name: 'Tour Gastronómico',
        location: 'Chimbote, Ancash',
        description: 'Recorrido por los mejores restaurantes de mariscos de Chimbote',
        price: 80.00,
        duration_days: 1,
        includes: ['Degustación', 'Guía gastronómico', 'Transporte'],
        image_url: '/assets/logo-chimbote.jpg'
      }
    ];
    
    for (const dest of destinations) {
      const query = `
        INSERT INTO destinations (name, location, description, price, duration_days, includes, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await postgresPool.query(query, [
        dest.name, dest.location, dest.description, dest.price, 
        dest.duration_days, dest.includes, dest.image_url
      ]);
    }
    
    console.log(' Datos de ejemplo insertados exitosamente');
  } catch (error) {
    console.error(' Error insertando datos de ejemplo:', error);
  }
}

// Iniciar servidor
startServer();

module.exports = app;
