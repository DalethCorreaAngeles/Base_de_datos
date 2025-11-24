require('dotenv').config();

const { initializeCassandra, getCassandraClient, disconnectCassandra } = require('./api/config/cassandra');
const CassandraModels = require('./api/models/cassandra.db');

// ===========================================
// SCRIPT DE INICIALIZACIÓN DE CASSANDRA
// ===========================================

async function initializeDatabase() {
  console.log('📊 Inicializando base de datos Cassandra...');

  // Validar que las variables necesarias estén configuradas
  if (!process.env.CASSANDRA_KEYSPACE) {
    console.error('❌ Error: CASSANDRA_KEYSPACE no está configurado en .env');
    console.error('💡 Agrega CASSANDRA_KEYSPACE a tu archivo .env');
    process.exit(1);
  }

  if (!process.env.CASSANDRA_HOST && !process.env.CASSANDRA_HOSTS) {
    console.warn('⚠️  Advertencia: CASSANDRA_HOST o CASSANDRA_HOSTS no configurado');
    console.warn('💡 Usando localhost:9042 por defecto');
  }

  console.log('📊 Usando configuración de tu .env:');
  console.log(`   Keyspace: ${process.env.CASSANDRA_KEYSPACE}`);
  if (process.env.CASSANDRA_HOSTS) {
    console.log(`   Hosts: ${process.env.CASSANDRA_HOSTS}`);
  } else if (process.env.CASSANDRA_HOST) {
    console.log(`   Host: ${process.env.CASSANDRA_HOST}:${process.env.CASSANDRA_PORT || '9042'}`);
  }
  if (process.env.CASSANDRA_DATACENTER) {
    console.log(`   Data Center: ${process.env.CASSANDRA_DATACENTER}`);
  }

  let client;

  try {
    // 1. Conectar a Cassandra
    console.log('\n📊 Conectando a Cassandra...');
    await initializeCassandra();
    client = getCassandraClient();
    console.log('✅ Conectado a Cassandra');

    // 2. Crear tablas
    console.log('\n📊 Creando tablas...');
    await CassandraModels.initializeTables();
    console.log('✅ Tablas creadas exitosamente');

    // 3. Insertar datos de ejemplo
    console.log('\n📊 Insertando datos de ejemplo...');

    // Verificar si ya existen datos
    try {
      const checkQuery = 'SELECT COUNT(*) FROM user_sessions';
      const result = await client.execute(checkQuery, [], { prepare: true });
      const sessionCount = result.rows.length > 0 ? result.rows[0]['count'] : 0;

      if (sessionCount > 0) {
        console.log('📊 Datos de ejemplo ya existen');
      } else {
        // Insertar sesión de ejemplo
        const sessionData = {
          session_id: 'example-session-123',
          user_id: 'user-001',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Example Browser)',
          created_at: new Date(),
          last_activity: new Date(),
          is_active: true,
          session_data: { theme: 'dark', language: 'es' }
        };
        await CassandraModels.createSession(sessionData);
        console.log('✅ Sesión de ejemplo insertada');

        // Insertar caché de destino de ejemplo
        const cacheData = {
          destination_id: 'dest-001',
          name: 'Playa Tortugas',
          location: 'Chimbote, Ancash',
          price: 150.00,
          duration_days: 1,
          image_url: '/assets/logo-chimbote.jpg'
        };
        await CassandraModels.cacheDestination(cacheData);
        console.log('✅ Caché de destino insertado');

        // Insertar métrica de ejemplo
        await CassandraModels.recordMetric({
          metric_type: 'page_view',
          metric_name: 'homepage_views',
          metric_value: 1,
          tags: { page: 'home', source: 'web' }
        });
        console.log('✅ Métrica de ejemplo insertada');

        // Insertar notificación de ejemplo
        await CassandraModels.createNotification({
          user_id: 'user-001',
          notification_type: 'info',
          title: 'Bienvenido a Chimbote Travel Tours',
          message: 'Gracias por registrarte. ¡Disfruta de nuestros servicios!',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
        });
        console.log('✅ Notificación de ejemplo insertada');
      }
    } catch (checkError) {
      console.warn('⚠️  No se pudieron verificar datos existentes:', checkError.message);
      // Continuar con la inserción de datos de ejemplo
      try {
        const sessionData = {
          session_id: 'example-session-123',
          user_id: 'user-001',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Example Browser)',
          created_at: new Date(),
          last_activity: new Date(),
          is_active: true,
          session_data: { theme: 'dark', language: 'es' }
        };
        await CassandraModels.createSession(sessionData);
        console.log('✅ Sesión de ejemplo insertada');
      } catch (insertError) {
        console.warn('⚠️  No se pudo insertar datos de ejemplo:', insertError.message);
      }
    }

    // 4. Mostrar estadísticas
    console.log('\n📊 Obteniendo estadísticas...');
    try {
      const health = await CassandraModels.getSystemHealth();
      console.log('📊 Estadísticas de la base de datos:');
      console.log(`   🔐 Sesiones activas: ${health.active_sessions}`);
      console.log(`   📊 Estado: ${health.status}`);

      // Contar notificaciones
      try {
        const notifications = await CassandraModels.getUserNotifications('user-001', 100);
        console.log(`   🔔 Notificaciones de ejemplo: ${notifications.length}`);
      } catch (notifError) {
        // Ignorar si no hay notificaciones
      }

      // Contar métricas
      try {
        const metrics = await CassandraModels.getMetricsByType('page_view', 100);
        console.log(`   📈 Métricas de ejemplo: ${metrics.length}`);
      } catch (metricError) {
        // Ignorar si no hay métricas
      }
    } catch (statsError) {
      console.warn('⚠️  No se pudieron obtener estadísticas:', statsError.message);
    }

    console.log('\n✅ Base de datos Cassandra inicializada exitosamente!');
    console.log('📝 Ahora puedes ejecutar: npm start');

  } catch (error) {
    console.error('\n❌ Error inicializando base de datos:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    console.error('\n💡 Soluciones posibles:');
    console.error('   1. Verifica que Cassandra esté ejecutándose');
    console.error('   2. Verifica la configuración en .env:');
    console.error('      - CASSANDRA_KEYSPACE (requerido - debe existir)');
    console.error('      - CASSANDRA_HOST o CASSANDRA_HOSTS');
    console.error('      - CASSANDRA_PORT (si no viene en HOSTS)');
    console.error('      - CASSANDRA_DATACENTER');
    console.error('   3. Si usas autenticación, verifica CASSANDRA_USER y CASSANDRA_PASSWORD');
    console.error('   4. Asegúrate de que el keyspace ya esté creado en Cassandra');
    console.error('   4. Verifica que el puerto 9042 esté abierto');

    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n   🔌 Error de conexión: Cassandra no está ejecutándose o no es accesible');
    } else if (error.message.includes('Authentication')) {
      console.error('\n   🔑 Error de autenticación: Verifica usuario y contraseña');
    } else if (error.message.includes('keyspace')) {
      console.error('\n   📁 Error de keyspace: Verifica que el keyspace exista o pueda crearse');
    }

    process.exit(1);
  } finally {
    // Desconectar al finalizar
    try {
      await disconnectCassandra();
    } catch (disconnectError) {
      console.warn('⚠️  Error al desconectar:', disconnectError.message);
    }
  }
}

// Ejecutar inicialización
initializeDatabase();

