const mongoose = require('mongoose');

// Configuracion de MongoDB

// URI de conexión a MongoDB (usa la URI de MongoDB Atlas o local)
const mongoURI = process.env.MONGODB_URI ||
  'mongodb+srv://daliaph3929q_db_user:AkfuLFnVeVsjuFG8@cluster0.bhxsztz.mongodb.net/chimbote_travel?retryWrites=true&w=majority&appName=Cluster0';

// Opciones de conexión (sin opciones deprecadas)
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000, // Timeout después de 5s si no puede conectarse
  socketTimeoutMS: 45000, // Cierra sockets después de 45s de inactividad
};

// Funciones de conexion

// Conectar a MongoDB
async function connectMongoDB() {
  try {
    // Verificar si ya está conectado
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(mongoURI, mongoOptions);
    // Conectado
    return mongoose.connection;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    throw error;
  }
}

// Desconectar de MongoDB
async function disconnectMongoDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error desconectando de MongoDB:', error.message);
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
  // Iniciando...

  try {
    await connectMongoDB();
  } catch (error) {
    console.error('Error inicializando MongoDB:', error.message);
    throw error;
  }
}

// ===========================================
// EVENTOS DE CONEXIÓN
// ===========================================

mongoose.connection.on('connected', () => {
  // Conectado
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  // Desconectado
});

// Exportar

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  getMongoConnectionStatus,
  initializeMongoDB,
  mongoURI,
  mongoOptions,
  mongoose
};
