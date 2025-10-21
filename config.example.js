// ===========================================
// CONFIGURACIÓN DE EJEMPLO PARA POSTGRESQL
// ===========================================

module.exports = {
  // Configuración de PostgreSQL
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'chimbote_travel',
    user: 'postgres',
    password: 'admin123',
    ssl: false
  },
  
  // Configuración del servidor
  server: {
    port: 3000,
    environment: 'development'
  }
};
