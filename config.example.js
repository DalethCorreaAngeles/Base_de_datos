// ===========================================
// CONFIGURACIÓN PARA POSTGRESQL
// ===========================================

module.exports = {
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
