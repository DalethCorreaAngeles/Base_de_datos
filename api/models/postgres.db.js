const { postgresPool } = require('../config/postgres');

class PostgreSQLModels {
  // =============================
  // DESTINOS TURÍSTICOS
  // =============================
  static async createDestinationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS destinations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_days INTEGER NOT NULL,
        includes JSONB,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return await postgresPool.query(query);
  }

  static async getAllDestinations() {
    const query = `SELECT * FROM destinations ORDER BY created_at DESC`;
    const result = await postgresPool.query(query);
    return result.rows;
  }

  static async getDestinationById(id) {
    const query = `SELECT * FROM destinations WHERE id = $1`;
    const result = await postgresPool.query(query, [id]);
    return result.rows[0];
  }

  // =============================
  // RESERVAS
  // =============================
  static async createReservationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        destination_id INTEGER REFERENCES destinations(id) ON DELETE CASCADE,
        travel_date DATE NOT NULL,
        number_of_people INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return await postgresPool.query(query);
  }

  static async createReservation(reservationData) {
    const query = `
      INSERT INTO reservations (client_name, client_email, destination_id, travel_date, number_of_people, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      reservationData.client_name,
      reservationData.client_email,
      reservationData.destination_id,
      reservationData.travel_date,
      reservationData.number_of_people,
      reservationData.total_price,
    ];
    const result = await postgresPool.query(query, values);
    return result.rows[0];
  }

  static async getAllReservations() {
    const query = `
      SELECT r.*, d.name AS destination_name, d.location
      FROM reservations r
      JOIN destinations d ON r.destination_id = d.id
      ORDER BY r.created_at DESC
    `;
    const result = await postgresPool.query(query);
    return result.rows;
  }

  // =============================
  // USUARIOS
  // =============================
  static async createUsersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return await postgresPool.query(query);
  }

  static async createUser(userData) {
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, role, created_at
    `;
    const values = [userData.username, userData.email, userData.password_hash];
    const result = await postgresPool.query(query, values);
    return result.rows[0];
  }

  static async getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await postgresPool.query(query, [email]);
    return result.rows[0];
  }

  static async updateUserPhone(email, phone) {
    const query = `
      UPDATE users
      SET phone = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING id, username, email, phone, role, created_at, updated_at
    `;
    const result = await postgresPool.query(query, [phone, email]);
    return result.rows[0];
  }

  // Ensure phone column exists in users table
  static async ensurePhoneColumn() {
    const query = `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`;
    try {
      await postgresPool.query(query);
    } catch (err) {
      console.error('Error ensuring phone column:', err.message);
    }
  }

  // =============================
  // INICIALIZAR TODAS LAS TABLAS
  // =============================
  static async initializeTables() {
    try {
      await this.createDestinationsTable();
      await this.createReservationsTable();
      await this.createUsersTable();
      await this.ensurePhoneColumn();
    } catch (error) {
      console.error('Error creando tablas de PostgreSQL:', error.message);
      throw error;
    }
  }
}

module.exports = PostgreSQLModels;