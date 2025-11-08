const express = require('express');
const router = express.Router();
const { Analytics } = require('../models/mongodb');

// ===========================================
// RUTAS PARA ANALYTICS (MONGODB)
// ===========================================

// GET /api/analytics - Obtener analytics
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    
    // Construir query
    let analyticsQuery = {};
    
    if (startDate && endDate) {
      analyticsQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      analyticsQuery.date = {
        $gte: new Date(startDate)
      };
    } else if (endDate) {
      analyticsQuery.date = {
        $lte: new Date(endDate)
      };
    }
    
    // Obtener analytics desde MongoDB
    const analytics = await Analytics.find(analyticsQuery)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Contar total
    const total = await Analytics.countDocuments(analyticsQuery);
    
    res.json({
      success: true,
      data: analytics || [],
      total: total || 0,
      source: 'MongoDB'
    });
    
  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      data: []
    });
  }
});

module.exports = router;

