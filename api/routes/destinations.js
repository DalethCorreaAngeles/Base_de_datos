const express = require('express');
const router = express.Router();
const { postgresPool } = require('../config/database');

// ===========================================
// RUTAS PARA DESTINOS TURÍSTICOS
// ===========================================
// Usa: PostgreSQL (datos principales)

// GET /api/destinations - Obtener todos los destinos
router.get('/', async (req, res) => {
  try {
    // Obtener datos desde PostgreSQL
    const query = 'SELECT * FROM destinations ORDER BY created_at DESC';
    const result = await postgresPool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      source: 'PostgreSQL'
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
    
    // Obtener destino desde PostgreSQL
    const query = 'SELECT * FROM destinations WHERE id = $1';
    const result = await postgresPool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Destino no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      source: 'PostgreSQL'
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
    
    // Validar datos requeridos
    if (!name || !location || !price || !duration_days) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes',
        message: 'name, location, price y duration_days son obligatorios'
      });
    }
    
    // Guardar en PostgreSQL
    const query = `
      INSERT INTO destinations (name, location, description, price, duration_days, includes, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [name, location, description, price, duration_days, includes, image_url];
    const result = await postgresPool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Destino creado exitosamente',
      source: 'PostgreSQL'
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
    // Obtener estadísticas desde PostgreSQL
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
        statistics: statsResult.rows[0],
        source: 'PostgreSQL'
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
