const express = require('express');
const router = express.Router();
const { postgresPool } = require('../config/postgres');

// ===========================================
// RUTAS PARA RESERVAS
// ===========================================
// Usa: PostgreSQL (reservas)

// POST /api/reservations - Crear nueva reserva
router.post('/', async (req, res) => {
  try {
    let { client_name, client_email, destination_id, destination_name, travel_date, number_of_people } = req.body;

    // Validar datos requeridos básicos
    if (!client_name || !client_email || !travel_date || !number_of_people) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes',
        message: 'client_name, client_email, travel_date y number_of_people son obligatorios'
      });
    }

    // Manejar resolución de destino
    if (!destination_id) {
      if (!destination_name) {
        return res.status(400).json({
          success: false,
          error: 'Destino faltante',
          message: 'Debe proporcionar destination_id o destination_name'
        });
      }

      // Buscar destino por nombre (insensible a mayúsculas/minúsculas)
      const findDestQuery = 'SELECT * FROM destinations WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE LOWER($2)';
      // Intentar coincidencia exacta o parcial
      const findDestResult = await postgresPool.query(findDestQuery, [destination_name, `%${destination_name}%`]);

      if (findDestResult.rows.length > 0) {
        destination_id = findDestResult.rows[0].id;
      } else {
        // Destino no encontrado y no se permite crear automáticamente
        return res.status(404).json({
          success: false,
          error: 'Destino no encontrado',
          message: `El destino '${destination_name}' no existe en nuestra base de datos.`
        });
      }
    }

    // 1. Obtener información del destino final
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

    res.status(201).json({
      success: true,
      data: reservationResult.rows[0],
      message: 'Reserva creada exitosamente',
      source: 'PostgreSQL'
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
    // Obtener reservas desde PostgreSQL
    const query = `
      SELECT r.*, d.name as destination_name, d.location 
      FROM reservations r 
      JOIN destinations d ON r.destination_id = d.id 
      ORDER BY r.created_at DESC
    `;
    const result = await postgresPool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      source: 'PostgreSQL'
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

    // Obtener reserva desde PostgreSQL
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

    res.json({
      success: true,
      data: result.rows[0],
      source: 'PostgreSQL'
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

    // Validar estado
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
        message: 'Los estados válidos son: pending, confirmed, cancelled, completed'
      });
    }

    // Actualizar estado en PostgreSQL
    const query = 'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await postgresPool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Estado de reserva actualizado exitosamente',
      source: 'PostgreSQL'
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
    // Obtener estadísticas de reservas desde PostgreSQL
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

    res.json({
      success: true,
      data: {
        reservation_statistics: statsResult.rows[0],
        source: 'PostgreSQL'
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
