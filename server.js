require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializePostgreSQL } = require('./api/config/database');
const { initializeMongoDB } = require('./api/config/indexMongo');
const { initOracle } = require('./api/config/oracle');
const { initializeCassandra } = require('./api/config/cassandra');
const PostgreSQLModels = require('./api/models/postgresql');
const { MongoDBModels } = require('./api/models/mongodb');
const CassandraModels = require('./api/models/cassandra');

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

// Inicializar servidor y bases de datos
async function startServer() {
  const dbStatus = {
    postgresql: false,
    mongodb: false,
    oracle: false,
    cassandra: false
  };

  console.log('Iniciando conexion a base de datos ...');
  console.log('Iniciando conexión a MongoDB...');
  console.log('Iniciando conexión a PostgreSQL...');
  console.log('Iniciando conexión a Oracle...');
  console.log('Iniciando conexión a Cassandra...');
  console.log('conectando.....');

  // Iniciar servidor express inmediatamente
  const server = app.listen(PORT, () => {
    console.log('------------------------------------------');
    console.log('Servidor iniciado');
    console.log(`API corriendo en http://localhost:${PORT}`);
    console.log('------------------------------------------');
  });

  try {
    // Inicializar todas las bases de datos en paralelo
    const results = await Promise.allSettled([
      // MongoDB
      initializeMongoDB().then(async () => {
        await MongoDBModels.initializeSiteConfig();
        dbStatus.mongodb = true;
        return 'MongoDB conectado';
      }),

      // PostgreSQL
      initializePostgreSQL().then(async () => {
        await PostgreSQLModels.initializeTables();
        // Insertar datos en segundo plano
        insertSampleData().catch(err => console.error('Error insertando datos:', err.message));
        dbStatus.postgresql = true;
        return 'PostgreSQL conectado';
      }),

      // Oracle
      initOracle().then(() => {
        dbStatus.oracle = true;
        return 'Oracle conectado';
      }),

      // Cassandra
      initializeCassandra().then(async () => {
        await CassandraModels.initializeTables();
        dbStatus.cassandra = true;
        return 'Cassandra conectado';
      })
    ]);

    // Mostrar resultados
    console.log('Estado de bases de datos:');

    // MongoDB
    if (results[0].status === 'fulfilled') console.log('   MongoDB:    Conectado');
    else console.log(`   MongoDB:    No disponible (${results[0].reason.message})`);

    // PostgreSQL
    if (results[1].status === 'fulfilled') console.log('   PostgreSQL: Conectado');
    else console.log(`   PostgreSQL: No disponible (${results[1].reason.message})`);

    // Oracle
    if (results[2].status === 'fulfilled') console.log('   Oracle:     Conectado');
    else console.log(`   Oracle:     No disponible (${results[2].reason.message})`);

    // Cassandra
    if (results[3].status === 'fulfilled') console.log('   Cassandra:  Conectado');
    else console.log(`   Cassandra:  No disponible (${results[3].reason.message})`);

  } catch (error) {
    console.error('Error general iniciando servicios:', error);
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
      return;
    }

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

    // Datos insertados
  } catch (error) {
    console.error(' Error insertando datos de ejemplo:', error);
  }
}

// Iniciar servidor
startServer();

module.exports = app;
