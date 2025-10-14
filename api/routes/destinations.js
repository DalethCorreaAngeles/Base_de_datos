const express = require('express');
const router = express.Router();
const { postgresPool } = require('../config/database');
const { MongoDBModels } = require('../models/mongodb');
const CassandraModels = require('../models/cassandra');

// ===========================================
// RUTAS PARA DESTINOS TURÍSTICOS
// ===========================================
// Usa: PostgreSQL (datos principales) + MongoDB (analytics) + Cassandra (cache)

// GET /api/destinations - Obtener todos los destinos
router.get('/', async (req, res) => {
  try {
    // 1. Intentar obtener desde cache (Cassandra)
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    
    // 2. Obtener datos principales desde PostgreSQL
    const query = 'SELECT * FROM destinations ORDER BY created_at DESC';
    const result = await postgresPool.query(query);
    
    // 3. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'view_destinations',
      resource: 'destinations',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { count: result.rows.length }
    });
    
    // 4. Cachear en Cassandra para futuras consultas
    for (const destination of result.rows) {
      await cassandraModels.cacheDestination({
        destination_id: destination.id.toString(),
        name: destination.name,
        location: destination.location,
        price: destination.price,
        duration_days: destination.duration_days,
        image_url: destination.image_url
      });
    }
    
    res.json({
      success: true,
      data: result.rows,
      source: 'PostgreSQL + MongoDB Analytics + Cassandra Cache'
    });
    
  } catch (error) {
    console.error('Error obteniendo destinos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los destinos'
    });
  }
});

// GET /api/destinations/:id - Obtener destino específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Intentar obtener desde cache (Cassandra)
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    
    let destination = await cassandraModels.getCachedDestination(id);
    
    if (!destination) {
      // 2. Si no está en cache, obtener desde PostgreSQL
      const query = 'SELECT * FROM destinations WHERE id = $1';
      const result = await postgresPool.query(query, [id]);
      destination = result.rows[0];
      
      if (destination) {
        // 3. Cachear para futuras consultas
        await cassandraModels.cacheDestination({
          destination_id: destination.id.toString(),
          name: destination.name,
          location: destination.location,
          price: destination.price,
          duration_days: destination.duration_days,
          image_url: destination.image_url
        });
      }
    }
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        error: 'Destino no encontrado'
      });
    }
    
    // 4. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'view_destination',
      resource: 'destinations',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { destination_name: destination.name }
    });
    
    res.json({
      success: true,
      data: destination,
      source: 'PostgreSQL + MongoDB Analytics + Cassandra Cache'
    });
    
  } catch (error) {
    console.error('Error obteniendo destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/destinations - Crear nuevo destino
router.post('/', async (req, res) => {
  try {
    const { name, location, description, price, duration_days, includes, image_url } = req.body;
    
    // 1. Guardar en PostgreSQL
    const query = `
      INSERT INTO destinations (name, location, description, price, duration_days, includes, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, location, description, price, duration_days, includes, image_url];
    const result = await postgresPool.query(query, values);
    
    // 2. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'create_destination',
      resource: 'destinations',
      resource_id: result.rows[0].id.toString(),
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { destination_name: name }
    });
    
    // 3. Invalidar cache en Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    // Aquí se podría implementar invalidación de cache
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Destino creado exitosamente',
      source: 'PostgreSQL + MongoDB Analytics + Cassandra Cache'
    });
    
  } catch (error) {
    console.error('Error creando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/destinations/analytics/overview - Analytics de destinos
router.get('/analytics/overview', async (req, res) => {
  try {
    // 1. Obtener analytics desde MongoDB
    const today = new Date();
    const analytics = await MongoDBModels.getDailyAnalytics(today);
    
    // 2. Obtener métricas desde Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    const metrics = await cassandraModels.getMetricsByType('destination_views', 100);
    
    // 3. Obtener estadísticas desde PostgreSQL
    const statsQuery = `
      SELECT 
        COUNT(*) as total_destinations,
        AVG(price) as average_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM destinations
    `;
    const statsResult = await postgresPool.query(statsQuery);
    
    res.json({
      success: true,
      data: {
        analytics: analytics || {},
        metrics: metrics,
        statistics: statsResult.rows[0],
        source: 'PostgreSQL + MongoDB + Cassandra'
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
