const cassandra = require('cassandra-driver');

// Configuracion de Cassandra

// Configuración de conexión a Cassandra
// Usa las variables de entorno que ya tienes configuradas en tu .env
const getContactPoints = () => {
  if (process.env.CASSANDRA_HOSTS) {
    // Si CASSANDRA_HOSTS está definido, puede venir en formato "host:port" o solo "host"
    return process.env.CASSANDRA_HOSTS.split(',').map(host => {
      const parts = host.trim().split(':');
      return parts[0]; // Solo el host, el puerto se maneja por separado
    });
  }
  if (process.env.CASSANDRA_HOST) {
    return [process.env.CASSANDRA_HOST];
  }
  return ['localhost'];
};

const getPort = () => {
  // Extraer puerto de CASSANDRA_HOSTS si viene en formato "host:port"
  if (process.env.CASSANDRA_HOSTS && process.env.CASSANDRA_HOSTS.includes(':')) {
    const parts = process.env.CASSANDRA_HOSTS.split(',')[0].split(':');
    if (parts[1]) return parseInt(parts[1]);
  }
  return parseInt(process.env.CASSANDRA_PORT || '9042');
};

const cassandraConfig = {
  contactPoints: getContactPoints(),
  port: getPort(),
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE,
  credentials: (process.env.CASSANDRA_USER && process.env.CASSANDRA_PASSWORD) ? {
    username: process.env.CASSANDRA_USER,
    password: process.env.CASSANDRA_PASSWORD
  } : undefined,
  queryOptions: {
    consistency: cassandra.types.consistencies.localQuorum,
    prepare: true
  },
  socketOptions: {
    connectTimeout: 10000,
    readTimeout: 60000
  }
};

let cassandraClient = null;

// Funciones de conexion

// Crear keyspace si no existe
async function createKeyspaceIfNotExists(client = null) {
  if (!cassandraConfig.keyspace) {
    throw new Error('CASSANDRA_KEYSPACE no está configurado en .env');
  }

  const usedClient = client || cassandraClient;
  if (!usedClient) {
    throw new Error('No hay cliente de Cassandra disponible');
  }

  try {
    // Verificando keyspace

    const createKeyspaceQuery = `
      CREATE KEYSPACE IF NOT EXISTS "${cassandraConfig.keyspace}"
      WITH REPLICATION = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `;

    await usedClient.execute(createKeyspaceQuery);
    await usedClient.execute(createKeyspaceQuery);
    // Keyspace verificado

    // Pequeña pausa para asegurar que el keyspace esté disponible
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    // Si el keyspace ya existe, no es un error crítico
    if (error.message.includes('already exists') || error.message.includes('Cannot add existing keyspace')) {
      // Keyspace ya existe
    } else {
      console.error('Error creando keyspace:', error.message);
      throw error;
    }
  }
}

// Conectar a Cassandra
async function connectCassandra() {
  try {
    // Si ya hay un cliente conectado, verificar que esté activo
    if (cassandraClient && cassandraClient.hosts.length > 0) {
      return cassandraClient;
    }

    // Conectando...

    // **PASO 1: Conectar SIN keyspace para poder crearlo**
    const tempConfig = {
      contactPoints: cassandraConfig.contactPoints,
      port: cassandraConfig.port,
      localDataCenter: cassandraConfig.localDataCenter,
      credentials: cassandraConfig.credentials,
      queryOptions: {
        consistency: cassandra.types.consistencies.one, // Usar consistencia más baja para creación
        prepare: false
      }
    };

    // Paso 1
    const tempClient = new cassandra.Client(tempConfig);
    await tempClient.connect();

    // **PASO 2: Crear el keyspace si no existe**
    // Paso 2
    await createKeyspaceIfNotExists(tempClient);

    // **PASO 3: Cerrar conexión temporal**
    await tempClient.shutdown();
    await tempClient.shutdown();

    // **PASO 4: Ahora conectar CON keyspace**
    // Paso 3
    cassandraClient = new cassandra.Client(cassandraConfig);
    await cassandraClient.connect();

    // **PASO 5: Forzar el uso del keyspace explícitamente**
    await cassandraClient.execute(`USE "${cassandraConfig.keyspace}"`);

    return cassandraClient;
  } catch (error) {
    console.error('Error conectando a Cassandra:', error.message);
    throw error;
  }
}

// Desconectar de Cassandra
async function disconnectCassandra() {
  try {
    if (cassandraClient) {
      await cassandraClient.shutdown();
      cassandraClient = null;
    }
  } catch (error) {
    console.error('Error desconectando de Cassandra:', error.message);
    throw error;
  }
}

// Verificar estado de la conexión
function getCassandraConnectionStatus() {
  if (!cassandraClient) {
    return {
      state: 'Desconectado',
      hosts: [],
      keyspace: cassandraConfig.keyspace
    };
  }

  return {
    state: cassandraClient.hosts.length > 0 ? 'Conectado' : 'Desconectado',
    hosts: cassandraClient.hosts.map(host => ({
      address: host.address,
      isUp: host.isUp
    })),
    keyspace: cassandraConfig.keyspace,
    dataCenter: cassandraConfig.localDataCenter
  };
}

// Obtener cliente de Cassandra
function getCassandraClient() {
  if (!cassandraClient) {
    throw new Error('Cassandra no está conectado. Llama a connectCassandra() primero.');
  }
  return cassandraClient;
}

// Inicializar conexión a Cassandra
async function initializeCassandra() {
  // Iniciando...

  // Validar que las variables necesarias estén configuradas
  if (!process.env.CASSANDRA_KEYSPACE) {
    throw new Error('CASSANDRA_KEYSPACE no está configurado en .env');
  }

  try {
    await connectCassandra();
  } catch (error) {
    console.error('Error inicializando Cassandra:', error.message);
    throw error;
  }
}

// ===========================================
// EVENTOS DE CONEXIÓN
// ===========================================

// Los eventos se manejan automáticamente por el driver

// Exportar

module.exports = {
  connectCassandra,
  disconnectCassandra,
  getCassandraConnectionStatus,
  initializeCassandra,
  getCassandraClient,
  cassandraConfig,
  cassandra
};