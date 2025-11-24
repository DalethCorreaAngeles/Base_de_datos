const { getCassandraClient, cassandra } = require('../config/cassandra');

// ===========================================
// MODELOS PARA CASSANDRA (BASE DE DATOS NO RELACIONAL)
// ===========================================
// Cassandra se usa para: Sesiones de usuario, Cache, Datos de tiempo real, Métricas

class CassandraModels {

  static getClient() {
    return getCassandraClient();
  }

  // ===========================================
  // SESIONES DE USUARIO
  // ===========================================
  static async createUserSessionsTable() {
    const client = this.getClient();
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

    await client.execute(query);

    // Crear índice secundario para búsquedas por user_id
    try {
      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id)
      `);
    } catch (error) {
      // El índice puede ya existir, ignorar error
      if (!error.message.includes('already exists')) {
        console.warn('No se pudo crear índice para user_id:', error.message);
      }
    }
  }

  static async createSession(sessionData) {
    const client = this.getClient();
    const query = `
      INSERT INTO user_sessions (session_id, user_id, ip_address, user_agent, created_at, last_activity, is_active, session_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      sessionData.session_id,
      sessionData.user_id || null,
      sessionData.ip_address || null,
      sessionData.user_agent || null,
      sessionData.created_at || new Date(),
      sessionData.last_activity || new Date(),
      sessionData.is_active !== undefined ? sessionData.is_active : true,
      sessionData.session_data || {}
    ];
    return await client.execute(query, params, { prepare: true });
  }

  static async getSession(sessionId) {
    const client = this.getClient();
    const query = 'SELECT * FROM user_sessions WHERE session_id = ?';
    const result = await client.execute(query, [sessionId], { prepare: true });
    return result.rows[0];
  }

  // ===========================================
  // CACHE DE DESTINOS
  // ===========================================
  static async createDestinationsCacheTable() {
    const client = this.getClient();
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

    await client.execute(query);
  }

  static async cacheDestination(destinationData) {
    const client = this.getClient();
    const query = `
      INSERT INTO destinations_cache (destination_id, name, location, price, duration_days, image_url, cached_at, ttl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      destinationData.destination_id,
      destinationData.name,
      destinationData.location,
      destinationData.price,
      destinationData.duration_days || null,
      destinationData.image_url || null,
      new Date(),
      3600 // TTL de 1 hora
    ];
    return await client.execute(query, params, { prepare: true });
  }

  static async getCachedDestination(destinationId) {
    const client = this.getClient();
    const query = 'SELECT * FROM destinations_cache WHERE destination_id = ?';
    const result = await client.execute(query, [destinationId], { prepare: true });
    return result.rows[0];
  }

  // ===========================================
  // MÉTRICAS EN TIEMPO REAL
  // ===========================================
  static async createRealtimeMetricsTable() {
    const client = this.getClient();
    // Usar metric_type y timestamp como clave primaria compuesta para permitir ORDER BY
    const query = `
      CREATE TABLE IF NOT EXISTS realtime_metrics (
        metric_type TEXT,
        timestamp TIMESTAMP,
        metric_id UUID,
        metric_name TEXT,
        metric_value DOUBLE,
        tags MAP<TEXT, TEXT>,
        PRIMARY KEY (metric_type, timestamp, metric_id)
      )
    `;

    await client.execute(query);
  }

  static async recordMetric(metricData) {
    const client = this.getClient();
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
    return await client.execute(query, params, { prepare: true });
  }

  static async getMetricsByType(metricType, limit = 100) {
    const client = this.getClient();
    const query = `
      SELECT * FROM realtime_metrics 
      WHERE metric_type = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    const result = await client.execute(query, [metricType, limit], { prepare: true });
    return result.rows;
  }

  // ===========================================
  // NOTIFICACIONES
  // ===========================================
  static async createNotificationsTable() {
    const client = this.getClient();
    // Usar user_id y created_at como clave primaria compuesta para permitir ORDER BY
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        user_id TEXT,
        created_at TIMESTAMP,
        notification_id UUID,
        notification_type TEXT,
        title TEXT,
        message TEXT,
        is_read BOOLEAN,
        expires_at TIMESTAMP,
        PRIMARY KEY (user_id, created_at, notification_id)
      )
    `;

    await client.execute(query);
  }

  static async createNotification(notificationData) {
    const client = this.getClient();
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
      notificationData.expires_at || null
    ];
    return await client.execute(query, params, { prepare: true });
  }

  static async getUserNotifications(userId, limit = 50) {
    const client = this.getClient();
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await client.execute(query, [userId, limit], { prepare: true });
    return result.rows;
  }

  // ===========================================
  // INICIALIZAR TODAS LAS TABLAS
  // ===========================================
  static async initializeTables() {
    // Inicializando tablas

    try {
      await this.createUserSessionsTable();
      await this.createDestinationsCacheTable();
      await this.createRealtimeMetricsTable();
      await this.createNotificationsTable();

      // Tablas creadas
    } catch (error) {
      console.error('Error creando tablas de Cassandra:', error);
      throw error;
    }
  }

  // ===========================================
  // FUNCIONES DE UTILIDAD
  // ===========================================
  static async clearExpiredSessions() {
    const client = this.getClient();
    // Nota: En Cassandra, las eliminaciones masivas requieren un enfoque diferente
    // Por ahora, marcamos las sesiones como inactivas en lugar de eliminarlas
    const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
    try {
      // Primero obtenemos las sesiones activas (usando ALLOW FILTERING para desarrollo)
      const selectQuery = 'SELECT session_id, last_activity FROM user_sessions WHERE is_active = true ALLOW FILTERING';
      const sessions = await client.execute(selectQuery, [], { prepare: true });

      // Luego las actualizamos una por una (mejor práctica en Cassandra)
      let updatedCount = 0;
      for (const row of sessions.rows) {
        if (row.last_activity && new Date(row.last_activity) < expiredTime) {
          await client.execute(
            'UPDATE user_sessions SET is_active = false WHERE session_id = ?',
            [row.session_id],
            { prepare: true }
          );
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        // Sesiones limpiadas
      }
    } catch (error) {
      console.warn('Error limpiando sesiones expiradas:', error.message);
    }
  }

  static async getSystemHealth() {
    try {
      const client = this.getClient();
      const query = 'SELECT COUNT(*) FROM user_sessions WHERE is_active = true ALLOW FILTERING';
      const result = await client.execute(query, [], { prepare: true });
      // En Cassandra, COUNT(*) devuelve un objeto con una propiedad que contiene el número
      const count = result.rows.length > 0 ?
        (result.rows[0].count || Object.values(result.rows[0])[0] || 0) : 0;
      return {
        active_sessions: count,
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
