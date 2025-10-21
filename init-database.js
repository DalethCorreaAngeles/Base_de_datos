const { Pool } = require('pg');
require('dotenv').config();

// ===========================================
// SCRIPT DE INICIALIZACIÓN DE POSTGRESQL
// ===========================================

const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'chimbote_travel',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'admin123',
  ssl: false
};

async function initializeDatabase() {
  console.log('🚀 Inicializando base de datos PostgreSQL...');
  
  try {
    // 1. Conectar a PostgreSQL
    const pool = new Pool(config);
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL');
    
    // 2. Crear tablas
    console.log('📊 Creando tablas...');
    
    // Tabla de destinos
    await client.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_days INTEGER NOT NULL,
        includes TEXT[],
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla destinations creada');
    
    // Tabla de reservas
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        destination_id INTEGER REFERENCES destinations(id),
        travel_date DATE NOT NULL,
        number_of_people INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla reservations creada');
    
    // Tabla de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla users creada');
    
    // 3. Insertar datos de ejemplo
    console.log('📊 Insertando datos de ejemplo...');
    
    // Verificar si ya existen datos
    const checkQuery = 'SELECT COUNT(*) FROM destinations';
    const result = await client.query(checkQuery);
    
    if (result.rows[0].count > 0) {
      console.log('📊 Datos de ejemplo ya existen');
    } else {
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
        await client.query(query, [
          dest.name, dest.location, dest.description, dest.price, 
          dest.duration_days, dest.includes, dest.image_url
        ]);
      }
      
      console.log('✅ Datos de ejemplo insertados');
    }
    
    // 4. Mostrar estadísticas
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM destinations) as total_destinations,
        (SELECT COUNT(*) FROM reservations) as total_reservations,
        (SELECT COUNT(*) FROM users) as total_users
    `;
    const stats = await client.query(statsQuery);
    console.log('📊 Estadísticas de la base de datos:');
    console.log(`   🏖️  Destinos: ${stats.rows[0].total_destinations}`);
    console.log(`   📋 Reservas: ${stats.rows[0].total_reservations}`);
    console.log(`   👥 Usuarios: ${stats.rows[0].total_users}`);
    
    client.release();
    await pool.end();
    
    console.log('🎉 Base de datos inicializada exitosamente!');
    console.log('🚀 Ahora puedes ejecutar: npm start');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    console.error('🔧 Soluciones posibles:');
    console.error('   1. Verifica que PostgreSQL esté ejecutándose');
    console.error('   2. Crea la base de datos "chimbote_travel"');
    console.error('   3. Verifica las credenciales en .env');
    process.exit(1);
  }
}

// Ejecutar inicialización
initializeDatabase();
