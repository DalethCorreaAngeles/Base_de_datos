const express = require('express');
const router = express.Router();
const { postgresPool } = require('../config/database');
const { MongoDBModels } = require('../models/mongodb');
const OracleModels = require('../models/oracle');
const CassandraModels = require('../models/cassandra');

// ===========================================
// RUTAS PARA RESERVAS
// ===========================================
// Usa: PostgreSQL (reservas) + MongoDB (logs) + Oracle (finanzas) + Cassandra (notificaciones)

// POST /api/reservations - Crear nueva reserva
router.post('/', async (req, res) => {
  try {
    const { client_name, client_email, destination_id, travel_date, number_of_people } = req.body;
    
    // 1. Obtener información del destino desde PostgreSQL
    const destinationQuery = 'SELECT * FROM destinations WHERE id = $1';
    const destinationResult = await postgresPool.query(destinationQuery, [destination_id]);
    
    if (destinationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Destino no encontrado'
      });
    }
    
    const destination = destinationResult.rows[0];
    const total_price = destination.price * number_of_people;
    
    // 2. Crear reserva en PostgreSQL
    const reservationQuery = `
      INSERT INTO reservations (client_name, client_email, destination_id, travel_date, number_of_people, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const reservationValues = [client_name, client_email, destination_id, travel_date, number_of_people, total_price];
    const reservationResult = await postgresPool.query(reservationQuery, reservationValues);
    
    // 3. Registrar transacción financiera en Oracle
    const oracleConnection = req.app.locals.oracleConnection;
    const oracleQuery = `
      INSERT INTO financial_records (transaction_type, amount, description, category, reservation_id)
      VALUES ('INCOME', :amount, :description, 'RESERVATION', :reservation_id)
    `;
    await oracleConnection.execute(oracleQuery, {
      amount: total_price,
      description: `Reserva para ${destination.name} - ${client_name}`,
      reservation_id: reservationResult.rows[0].id
    });
    
    // 4. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'create_reservation',
      resource: 'reservations',
      resource_id: reservationResult.rows[0].id.toString(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: {
        client_name,
        destination_name: destination.name,
        total_price,
        number_of_people
      }
    });
    
    // 5. Crear notificación en Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    await cassandraModels.createNotification({
      user_id: client_email,
      notification_type: 'RESERVATION_CONFIRMED',
      title: 'Reserva Confirmada',
      message: `Su reserva para ${destination.name} ha sido confirmada. Total: S/${total_price}`,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    });
    
    res.status(201).json({
      success: true,
      data: reservationResult.rows[0],
      message: 'Reserva creada exitosamente',
      source: 'PostgreSQL + Oracle Finanzas + MongoDB Analytics + Cassandra Notificaciones'
    });
    
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reservations - Obtener todas las reservas
router.get('/', async (req, res) => {
  try {
    // 1. Obtener reservas desde PostgreSQL
    const query = `
      SELECT r.*, d.name as destination_name, d.location 
      FROM reservations r 
      JOIN destinations d ON r.destination_id = d.id 
      ORDER BY r.created_at DESC
    `;
    const result = await postgresPool.query(query);
    
    // 2. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'view_reservations',
      resource: 'reservations',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { count: result.rows.length }
    });
    
    res.json({
      success: true,
      data: result.rows,
      source: 'PostgreSQL + MongoDB Analytics'
    });
    
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reservations/:id - Obtener reserva específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Obtener reserva desde PostgreSQL
    const query = `
      SELECT r.*, d.name as destination_name, d.location, d.price as destination_price
      FROM reservations r 
      JOIN destinations d ON r.destination_id = d.id 
      WHERE r.id = $1
    `;
    const result = await postgresPool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }
    
    // 2. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'view_reservation',
      resource: 'reservations',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { client_name: result.rows[0].client_name }
    });
    
    res.json({
      success: true,
      data: result.rows[0],
      source: 'PostgreSQL + MongoDB Analytics'
    });
    
  } catch (error) {
    console.error('Error obteniendo reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/reservations/:id/status - Actualizar estado de reserva
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 1. Actualizar estado en PostgreSQL
    const query = 'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await postgresPool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }
    
    // 2. Registrar cambio en Oracle si es cancelación
    if (status === 'cancelled') {
      const oracleConnection = req.app.locals.oracleConnection;
      const oracleQuery = `
        INSERT INTO financial_records (transaction_type, amount, description, category, reservation_id)
        VALUES ('EXPENSE', :amount, :description, 'CANCELLATION', :reservation_id)
      `;
      await oracleConnection.execute(oracleQuery, {
        amount: result.rows[0].total_price,
        description: `Cancelación de reserva - ${result.rows[0].client_name}`,
        reservation_id: id
      });
    }
    
    // 3. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'update_reservation_status',
      resource: 'reservations',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { 
        old_status: result.rows[0].status,
        new_status: status,
        client_name: result.rows[0].client_name
      }
    });
    
    // 4. Crear notificación en Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    await cassandraModels.createNotification({
      user_id: result.rows[0].client_email,
      notification_type: 'RESERVATION_STATUS_CHANGED',
      title: 'Estado de Reserva Actualizado',
      message: `Su reserva ha sido ${status}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    });
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Estado de reserva actualizado exitosamente',
      source: 'PostgreSQL + Oracle Finanzas + MongoDB Analytics + Cassandra Notificaciones'
    });
    
  } catch (error) {
    console.error('Error actualizando estado de reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reservations/analytics/financial - Reporte financiero
router.get('/analytics/financial', async (req, res) => {
  try {
    // 1. Obtener resumen financiero desde Oracle
    const oracleConnection = req.app.locals.oracleConnection;
    const financialDashboard = await OracleModels.getFinancialDashboard(oracleConnection);
    
    // 2. Obtener estadísticas de reservas desde PostgreSQL
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reservations,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_reservation_value,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_reservations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_reservations
      FROM reservations
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const statsResult = await postgresPool.query(statsQuery);
    
    // 3. Obtener analytics desde MongoDB
    const today = new Date();
    const analytics = await MongoDBModels.getDailyAnalytics(today);
    
    res.json({
      success: true,
      data: {
        financial_dashboard: financialDashboard,
        reservation_statistics: statsResult.rows[0],
        daily_analytics: analytics,
        source: 'PostgreSQL + Oracle + MongoDB'
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo reporte financiero:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
