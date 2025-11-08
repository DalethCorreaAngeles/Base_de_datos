const express = require('express');
const router = express.Router();
const { ActivityLog } = require('../models/mongodb');

// ===========================================
// RUTAS PARA LOGS DE ACTIVIDAD (MONGODB)
// ===========================================

// GET /api/activity-logs - Obtener logs de actividad
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0, action, resource } = req.query;
    
    // Construir query
    const query = {};
    if (action) query.action = action;
    if (resource) query.resource = resource;
    
    // Obtener logs desde MongoDB
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    // Contar total
    const total = await ActivityLog.countDocuments(query);
    
    res.json({
      success: true,
      data: logs || [],
      total: total || 0,
      source: 'MongoDB'
    });
    
  } catch (error) {
    console.error('Error obteniendo logs de actividad:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      data: []
    });
  }
});

module.exports = router;

