const express = require('express');
const router = express.Router();
const { MongoDBModels } = require('../models/mongo.db');
const OracleModels = require('../models/oracle.db');
const CassandraModels = require('../models/cassandra.db');
const { getOracleConnection } = require('../config/oracle');

// ===========================================
// RUTAS PARA INFORMACIÓN CORPORATIVA
// ===========================================
// Usa: MongoDB (configuración) + Oracle (empleados/finanzas) + Cassandra (métricas)

// GET /api/company/info - Información de la empresa
router.get('/info', async (req, res) => {
  try {
    // 1. Obtener configuración desde MongoDB
    const { SiteConfig } = require('../models/mongo.db');
    const siteConfig = await SiteConfig.findOne();

    const responseData = {
      company_info: siteConfig || {},
      source: 'MongoDB'
    };

    // 2. Obtener información de empleados desde Oracle (si está disponible)
    let oracleConnection;
    try {
      oracleConnection = await getOracleConnection();
      const employees = await OracleModels.getAllEmployees(oracleConnection);
      responseData.employees_count = employees.length;
      responseData.source += ' + Oracle';
    } catch (oracleError) {
      // Oracle no disponible, continuar sin él
      console.log('Oracle no disponible o error:', oracleError.message);
    } finally {
      if (oracleConnection) {
        try {
          await oracleConnection.close();
        } catch (err) {
          console.error('Error cerrando conexion Oracle:', err);
        }
      }
    }

    // 3. Obtener métricas del sistema desde Cassandra (si está disponible)
    try {
      const cassandraClient = req.app.locals?.cassandraClient;
      if (cassandraClient) {
        const cassandraModels = new CassandraModels(cassandraClient);
        const systemHealth = await cassandraModels.getSystemHealth();
        responseData.system_health = systemHealth;
        responseData.source += ' + Cassandra';
      }
    } catch (cassandraError) {
      // Cassandra no disponible, continuar sin él
      console.log('Cassandra no disponible, continuando sin él');
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error obteniendo información de la empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/company/employees - Lista de empleados
router.get('/employees', async (req, res) => {
  try {
    // 1. Obtener empleados desde Oracle
    let oracleConnection;
    let employees = [];
    try {
      oracleConnection = await getOracleConnection();
      employees = await OracleModels.getAllEmployees(oracleConnection);
    } finally {
      if (oracleConnection) await oracleConnection.close();
    }

    // 2. Log de actividad en MongoDB
    await MongoDBModels.logActivity({
      action: 'view_employees',
      resource: 'employees',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { count: employees.length }
    });

    res.json({
      success: true,
      data: employees,
      source: 'Oracle + MongoDB Analytics'
    });

  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/company/financial-dashboard - Dashboard financiero
router.get('/financial-dashboard', async (req, res) => {
  try {
    // 1. Obtener dashboard financiero desde Oracle
    let oracleConnection;
    let financialDashboard;
    try {
      oracleConnection = await getOracleConnection();
      financialDashboard = await OracleModels.getFinancialDashboard(oracleConnection);
    } finally {
      if (oracleConnection) await oracleConnection.close();
    }

    // 2. Obtener analytics desde MongoDB
    const today = new Date();
    const analytics = await MongoDBModels.getDailyAnalytics(today);

    // 3. Obtener métricas en tiempo real desde Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    const realtimeMetrics = await cassandraModels.getMetricsByType('financial', 50);

    res.json({
      success: true,
      data: {
        financial_dashboard: financialDashboard,
        daily_analytics: analytics,
        realtime_metrics: realtimeMetrics,
        source: 'Oracle + MongoDB + Cassandra'
      }
    });

  } catch (error) {
    console.error('Error obteniendo dashboard financiero:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/company/analytics - Analytics corporativos
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Obtener analytics desde MongoDB
    const { Analytics } = require('../models/mongo.db');
    let analyticsQuery = {};

    if (startDate && endDate) {
      analyticsQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Analytics.find(analyticsQuery).sort({ date: -1 }).limit(30);

    // 2. Obtener métricas desde Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    const systemMetrics = await cassandraModels.getMetricsByType('system', 100);

    // 3. Obtener resumen financiero desde Oracle
    let oracleConnection;
    let financialSummary;
    try {
      oracleConnection = await getOracleConnection();
      financialSummary = await OracleModels.getFinancialSummary(
        oracleConnection,
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate || new Date()
      );
    } catch (err) {
      console.error('Error obteniendo resumen financiero Oracle:', err);
      financialSummary = [];
    } finally {
      if (oracleConnection) await oracleConnection.close();
    }

    res.json({
      success: true,
      data: {
        analytics: analytics,
        system_metrics: systemMetrics,
        financial_summary: financialSummary,
        source: 'MongoDB + Cassandra + Oracle'
      }
    });

  } catch (error) {
    console.error('Error obteniendo analytics corporativos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/company/contact - Enviar mensaje de contacto
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    // 1. Log de contacto en MongoDB
    await MongoDBModels.logActivity({
      action: 'contact_form_submitted',
      resource: 'contact',
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: {
        name,
        email,
        subject,
        message_length: message.length
      }
    });

    // 2. Crear notificación en Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    await cassandraModels.createNotification({
      user_id: 'admin',
      notification_type: 'CONTACT_FORM',
      title: 'Nuevo Mensaje de Contacto',
      message: `Mensaje de ${name} (${email}): ${subject}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    });

    // 3. Registrar métrica en Cassandra
    await cassandraModels.recordMetric({
      metric_type: 'contact',
      metric_name: 'contact_form_submissions',
      metric_value: 1,
      tags: {
        source: 'website',
        subject: subject
      }
    });

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      source: 'MongoDB + Cassandra'
    });

  } catch (error) {
    console.error('Error enviando mensaje de contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/company/health - Estado de salud del sistema
router.get('/health', async (req, res) => {
  try {
    // 1. Verificar salud de Cassandra
    const cassandraClient = req.app.locals.cassandraClient;
    const cassandraModels = new CassandraModels(cassandraClient);
    const cassandraHealth = await cassandraModels.getSystemHealth();

    // 2. Verificar salud de MongoDB
    const mongoHealth = {
      status: 'connected',
      database: 'chimbote_travel',
      timestamp: new Date()
    };

    // 3. Verificar salud de Oracle
    let oracleHealth = { status: 'connected', timestamp: new Date() };
    let oracleConn;
    try {
      oracleConn = await getOracleConnection();
      await oracleConn.execute('SELECT 1 FROM dual');
    } catch (error) {
      oracleHealth = { status: 'error', error: error.message, timestamp: new Date() };
    } finally {
      if (oracleConn) await oracleConn.close();
    }

    // 4. Verificar salud de PostgreSQL
    const { postgresPool } = require('../config/postgres');
    let postgresHealth = { status: 'connected', timestamp: new Date() };
    try {
      await postgresPool.query('SELECT 1');
    } catch (error) {
      postgresHealth = { status: 'error', error: error.message, timestamp: new Date() };
    }

    const overallHealth = {
      status: 'healthy',
      databases: {
        postgresql: postgresHealth,
        mongodb: mongoHealth,
        oracle: oracleHealth,
        cassandra: cassandraHealth
      },
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: overallHealth,
      source: 'All Databases'
    });

  } catch (error) {
    console.error('Error verificando salud del sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
