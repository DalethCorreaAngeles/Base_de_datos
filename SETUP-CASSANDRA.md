# Cassandra

## Requisitos Previos

1. **Apache Cassandra**
2. **Java 8 o 11**
3. **Node.js**
4. **Python 2.7** (opcional)

## Configuración Paso a Paso

### 1. Instalar Apache Cassandra

### 2. Verificar Instalación

```bash
# Verificar estado del nodo
nodetool status
```

### 3. Crear Keyspace (Base de Datos)

Conéctate a Cassandra usando `cqlsh`:

```bash
cqlsh
```

Ejecuta los siguientes comandos CQL:

```sql
-- Crear Keyspace
CREATE KEYSPACE IF NOT EXISTS chimbote_travel 
WITH REPLICATION = { 
  'class' : 'SimpleStrategy', 
  'replication_factor' : 1 
};

-- Usar Keyspace
USE chimbote_travel;
```

### 4. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# ===========================================
# CONFIGURACIÓN DE CASSANDRA
# ===========================================
CASSANDRA_HOST=localhost
CASSANDRA_PORT=9042
CASSANDRA_KEYSPACE=chimbote_travel
CASSANDRA_DATACENTER=datacenter1
```

### 5. Inicializar Tablas

El proyecto incluye un script automático para crear las tablas necesarias.

```bash
# Ejecutar inicialización
npm run init-cassandra
```

Luego iniciar el servidor:
```bash
npm start
```

## Estructura de Datos (Tablas)

### 1. user_sessions
Almacena sesiones de usuario activas.
- `session_id` (TEXT, PK)
- `user_id` (TEXT)
- `ip_address` (TEXT)
- `is_active` (BOOLEAN)
- `session_data` (MAP<TEXT, TEXT>)

### 2. destinations_cache
Cache de información de destinos para acceso rápido.
- `destination_id` (TEXT, PK)
- `name` (TEXT)
- `price` (DECIMAL)
- `ttl` (INT)

### 3. realtime_metrics
Métricas del sistema en tiempo real.
- `metric_type` (TEXT, PK)
- `timestamp` (TIMESTAMP, PK)
- `metric_value` (DOUBLE)

### 4. notifications
Notificaciones de usuario.
- `user_id` (TEXT, PK)
- `created_at` (TIMESTAMP, PK)
- `message` (TEXT)
- `is_read` (BOOLEAN)

## Endpoints Disponibles

Estos endpoints interactúan principalmente con Cassandra:

### Analytics y Métricas
```http
GET /api/analytics/realtime
```
- **Descripción**: Obtiene métricas en tiempo real del sistema.
- **Datos**: Métricas de visitas, sesiones activas, etc.

### Sesiones (Interno)
Cassandra maneja las sesiones automáticamente a través del middleware.
- **Gestión**: Creación automática al iniciar sesión.
- **Limpieza**: Expiración automática (TTL) o limpieza programada.

## Solución de Problemas

### Error: "No host available"
1. Verifica que Cassandra esté corriendo: `nodetool status`
2. Verifica el puerto 9042: `telnet localhost 9042`
3. Revisa `CASSANDRA_HOST` en `.env`

### Error: "Keyspace does not exist"
1. Ejecuta `npm run init-cassandra`
2. O crea el keyspace manualmente usando `cqlsh`
