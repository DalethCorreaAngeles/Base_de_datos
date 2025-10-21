const cassandra = require('cassandra-driver');

// ===========================================
// MODELOS PARA CASSANDRA (BASE DE DATOS NO RELACIONAL)
// ===========================================
// Cassandra se usa para: Sesiones de usuario, Cache, Datos de tiempo real, Métricas

class CassandraModels {
  
  constructor(client) {
    this.client = client;
  }

  // ===========================================
  // SESIONES DE USUARIO
  // ===========================================
  async createUserSessionsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP,
        last_activity TIMESTAMP,
        is_active BOOLEAN,
        session_data MAP<TEXT, TEXT>
      )
    `;
    
    // AQUÍ SE LLENA: INSERT INTO user_sessions (session_id, user_id, ip_address, created_at, is_active) VALUES (...)
    return await this.client.execute(query);
  }

  async createSession(sessionData) {
    const query = `
      INSERT INTO user_sessions (session_id, user_id, ip_address, user_agent, created_at, last_activity, is_active, session_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      sessionData.session_id,
      sessionData.user_id,
      sessionData.ip_address,
      sessionData.user_agent,
      sessionData.created_at,
      sessionData.last_activity,
      sessionData.is_active,
      sessionData.session_data
    ];
    return await this.client.execute(query, params);
  }

  async getSession(sessionId) {
    const query = 'SELECT * FROM user_sessions WHERE session_id = ?';
    const result = await this.client.execute(query, [sessionId]);
    return result.rows[0];
  }

  // ===========================================
  // CACHE DE DESTINOS
  // ===========================================
  async createDestinationsCacheTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS destinations_cache (
        destination_id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        price DECIMAL,
        duration_days INT,
        image_url TEXT,
        cached_at TIMESTAMP,
        ttl INT
      )
    `;
    
    // AQUÍ SE LLENA: INSERT INTO destinations_cache (destination_id, name, location, price, cached_at, ttl) VALUES (...)
    return await this.client.execute(query);
  }

  async cacheDestination(destinationData) {
    const query = `
      INSERT INTO destinations_cache (destination_id, name, location, price, duration_days, image_url, cached_at, ttl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      destinationData.destination_id,
      destinationData.name,
      destinationData.location,
      destinationData.price,
      destinationData.duration_days,
      destinationData.image_url,
      new Date(),
      3600 // TTL de 1 hora
    ];
    return await this.client.execute(query, params);
  }

  async getCachedDestination(destinationId) {
    const query = 'SELECT * FROM destinations_cache WHERE destination_id = ?';
    const result = await this.client.execute(query, [destinationId]);
    return result.rows[0];
  }

  // ===========================================
  // MÉTRICAS EN TIEMPO REAL
  // ===========================================
  async createRealtimeMetricsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS realtime_metrics (
        metric_id UUID PRIMARY KEY,
        metric_type TEXT,
        metric_name TEXT,
        metric_value DOUBLE,
        timestamp TIMESTAMP,
        tags MAP<TEXT, TEXT>
      )
    `;
    
    // AQUÍ SE LLENA: INSERT INTO realtime_metrics (metric_id, metric_type, metric_name, metric_value, timestamp, tags) VALUES (...)
    return await this.client.execute(query);
  }

  async recordMetric(metricData) {
    const query = `
      INSERT INTO realtime_metrics (metric_id, metric_type, metric_name, metric_value, timestamp, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      cassandra.types.Uuid.random(),
      metricData.metric_type,
      metricData.metric_name,
      metricData.metric_value,
      new Date(),
      metricData.tags || {}
    ];
    return await this.client.execute(query, params);
  }

  async getMetricsByType(metricType, limit = 100) {
    const query = `
      SELECT * FROM realtime_metrics 
      WHERE metric_type = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    const result = await this.client.execute(query, [metricType, limit]);
    return result.rows;
  }

  // ===========================================
  // NOTIFICACIONES
  // ===========================================
  async createNotificationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id UUID PRIMARY KEY,
        user_id TEXT,
        notification_type TEXT,
        title TEXT,
        message TEXT,
        is_read BOOLEAN,
        created_at TIMESTAMP,
        expires_at TIMESTAMP
      )
    `;
    
    // AQUÍ SE LLENA: INSERT INTO notifications (notification_id, user_id, notification_type, title, message, is_read, created_at) VALUES (...)
    return await this.client.execute(query);
  }

  async createNotification(notificationData) {
    const query = `
      INSERT INTO notifications (notification_id, user_id, notification_type, title, message, is_read, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      cassandra.types.Uuid.random(),
      notificationData.user_id,
      notificationData.notification_type,
      notificationData.title,
      notificationData.message,
      false,
      new Date(),
      notificationData.expires_at
    ];
    return await this.client.execute(query, params);
  }

  async getUserNotifications(userId, limit = 50) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await this.client.execute(query, [userId, limit]);
    return result.rows;
  }

  // ===========================================
  // INICIALIZAR TODAS LAS TABLAS
  // ===========================================
  async initializeTables() {
    console.log('📊 Inicializando tablas de Cassandra...');
    
    try {
      await this.createUserSessionsTable();
      await this.createDestinationsCacheTable();
      await this.createRealtimeMetricsTable();
      await this.createNotificationsTable();
      
      console.log('✅ Tablas de Cassandra creadas exitosamente');
    } catch (error) {
      console.error('❌ Error creando tablas de Cassandra:', error);
      throw error;
    }
  }

  // ===========================================
  // FUNCIONES DE UTILIDAD
  // ===========================================
  async clearExpiredSessions() {
    const query = `
      DELETE FROM user_sessions 
      WHERE last_activity < ? AND is_active = false
    `;
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
    return await this.client.execute(query, [expiredTime]);
  }

  async getSystemHealth() {
    try {
      const query = 'SELECT COUNT(*) as session_count FROM user_sessions WHERE is_active = true';
      const result = await this.client.execute(query);
      return {
        active_sessions: result.rows[0].session_count,
        status: 'healthy',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        active_sessions: 0,
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = CassandraModels;
