const mongoose = require('mongoose');

// ===========================================
// MODELOS PARA MONGODB (BASE DE DATOS NO RELACIONAL)
// ===========================================
// MongoDB se usa para: Logs, Analytics, Comentarios, Galería de imágenes

// ===========================================
// ESQUEMA DE LOGS DE ACTIVIDAD
// ===========================================
const activityLogSchema = new mongoose.Schema({
  user_id: { type: String, required: false },
  action: { type: String, required: true }, // 'view_destination', 'create_reservation', etc.
  resource: { type: String, required: true }, // 'destinations', 'reservations', etc.
  resource_id: { type: String, required: false },
  ip_address: { type: String, required: true },
  user_agent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

// AQUÍ SE LLENA: new ActivityLog({ user_id: '123', action: 'view_destination', resource: 'destinations', ... })

// ===========================================
// ESQUEMA DE ANALYTICS
// ===========================================
const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  page_views: { type: Number, default: 0 },
  unique_visitors: { type: Number, default: 0 },
  destination_views: { type: Map, of: Number, default: {} },
  reservation_attempts: { type: Number, default: 0 },
  successful_reservations: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 }
});

// AQUÍ SE LLENA: new Analytics({ date: new Date(), page_views: 150, unique_visitors: 45, ... })

// ===========================================
// ESQUEMA DE COMENTARIOS Y RESEÑAS
// ===========================================
const reviewSchema = new mongoose.Schema({
  destination_id: { type: String, required: true },
  client_name: { type: String, required: true },
  client_email: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  helpful_votes: { type: Number, default: 0 }
});

// AQUÍ SE LLENA: new Review({ destination_id: '1', client_name: 'Juan Pérez', rating: 5, comment: 'Excelente experiencia!', ... })

// ===========================================
// ESQUEMA DE GALERÍA DE IMÁGENES
// ===========================================
const gallerySchema = new mongoose.Schema({
  destination_id: { type: String, required: true },
  image_url: { type: String, required: true },
  image_title: { type: String, required: true },
  image_description: { type: String },
  is_featured: { type: Boolean, default: false },
  upload_date: { type: Date, default: Date.now },
  tags: { type: [String], default: [] }
});

// AQUÍ SE LLENA: new Gallery({ destination_id: '1', image_url: 'https://...', image_title: 'Machu Picchu Vista', ... })

// ===========================================
// ESQUEMA DE CONFIGURACIÓN DEL SITIO
// ===========================================
const siteConfigSchema = new mongoose.Schema({
  site_name: { type: String, default: 'Chimbote Travel Tours' },
  contact_email: { type: String, default: 'chimbotetraveltours16@hotmail.es' },
  contact_phone: { type: String, default: '+51 942 620 099' },
  social_media: {
    facebook: { type: String },
    instagram: { type: String },
    tiktok: { type: String },
    whatsapp: { type: String }
  },
  business_hours: {
    weekdays: { type: String, default: '9:00 am - 6:00 pm' },
    saturday: { type: String, default: '9:00 am - 1:00 pm' },
    sunday: { type: String, default: 'Cerrado' }
  },
  payment_methods: { type: [String], default: ['Visa', 'Mastercard', 'Yape', 'Plin'] }
});

// AQUÍ SE LLENA: new SiteConfig({ site_name: 'Chimbote Travel Tours', contact_email: '...', ... })

// ===========================================
// CREAR MODELOS
// ===========================================
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);
const Review = mongoose.model('Review', reviewSchema);
const Gallery = mongoose.model('Gallery', gallerySchema);
const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

// ===========================================
// FUNCIONES DE UTILIDAD
// ===========================================
class MongoDBModels {
  
  // Crear configuración inicial del sitio
  static async initializeSiteConfig() {
    try {
      const existingConfig = await SiteConfig.findOne();
      if (!existingConfig) {
        const defaultConfig = new SiteConfig({
          site_name: 'Chimbote Travel Tours',
          contact_email: 'chimbotetraveltours16@hotmail.es',
          contact_phone: '+51 942 620 099',
          social_media: {
            facebook: 'https://www.facebook.com/ChimboteTravelToursEirl',
            instagram: 'https://www.instagram.com',
            tiktok: 'https://www.tiktok.com',
            whatsapp: 'https://wa.me/51942620099'
          }
        });
        await defaultConfig.save();
        console.log('✅ Configuración inicial del sitio creada');
      }
    } catch (error) {
      console.error('❌ Error inicializando configuración del sitio:', error);
    }
  }

  // Log de actividad
  static async logActivity(activityData) {
    try {
      const log = new ActivityLog(activityData);
      await log.save();
    } catch (error) {
      console.error('❌ Error guardando log de actividad:', error);
    }
  }

  // Obtener analytics del día
  static async getDailyAnalytics(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await Analytics.findOne({
        date: { $gte: startOfDay, $lte: endOfDay }
      });
    } catch (error) {
      console.error('❌ Error obteniendo analytics:', error);
      return null;
    }
  }
}

module.exports = {
  ActivityLog,
  Analytics,
  Review,
  Gallery,
  SiteConfig,
  MongoDBModels
};
