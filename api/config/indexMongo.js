const mongoose = require('mongoose');

// ===========================================
// CONFIGURACIÓN DE MONGODB
// ===========================================

// URI de conexión a MongoDB (usa la URI de MongoDB Atlas o local)
const mongoURI = process.env.MONGODB_URI || 
  'mongodb+srv://daliaph3929q_db_user:AkfuLFnVeVsjuFG8@cluster0.bhxsztz.mongodb.net/chimbote_travel?retryWrites=true&w=majority&appName=Cluster0';

// Opciones de conexión (sin opciones deprecadas)
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000, // Timeout después de 5s si no puede conectarse
  socketTimeoutMS: 45000, // Cierra sockets después de 45s de inactividad
};

// ===========================================
// FUNCIONES DE CONEXIÓN
// ===========================================

// Conectar a MongoDB
async function connectMongoDB() {
  try {
    // Verificar si ya está conectado
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB ya está conectado');
      return mongoose.connection;
    }

    await mongoose.connect(mongoURI, mongoOptions);
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`   Base de datos: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host || 'Atlas Cluster'}`);
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.error('   Verifica que MongoDB esté ejecutándose y las credenciales sean correctas');
    throw error;
  }
}

// Desconectar de MongoDB
async function disconnectMongoDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ MongoDB desconectado exitosamente');
    }
  } catch (error) {
    console.error('❌ Error desconectando de MongoDB:', error.message);
    throw error;
  }
}

// Verificar estado de la conexión
function getMongoConnectionStatus() {
  const states = {
    0: 'Desconectado',
    1: 'Conectado',
    2: 'Conectando',
    3: 'Desconectando'
  };
  return {
    state: states[mongoose.connection.readyState] || 'Desconocido',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'Atlas Cluster',
    port: mongoose.connection.port || 'N/A',
    database: mongoose.connection.db?.databaseName || 'N/A'
  };
}

// Inicializar conexión a MongoDB
async function initializeMongoDB() {
  console.log('📊 Iniciando conexión a MongoDB...');
  
  try {
    await connectMongoDB();
    console.log('✅ MongoDB conectado exitosamente');
  } catch (error) {
    console.error('❌ Error inicializando MongoDB:', error);
    console.error('   Soluciones posibles:');
    console.error('   1. Verifica que MongoDB esté ejecutándose');
    console.error('   2. Verifica la URI de conexión (MONGODB_URI)');
    console.error('   3. Si usas MongoDB Atlas, verifica la cadena de conexión y la IP permitida');
    throw error;
  }
}

// ===========================================
// EVENTOS DE CONEXIÓN
// ===========================================

mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB: Conexión establecida');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB: Error de conexión:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 MongoDB: Desconectado');
});

// ===========================================
// EXPORTAR FUNCIONES Y CONFIGURACIÓN
// ===========================================

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  getMongoConnectionStatus,
  initializeMongoDB,
  mongoURI,
  mongoOptions,
  mongoose
};
