# 🚀 Chimbote Travel Tours API

API REST moderna para el sistema de turismo de Chimbote Travel Tours, utilizando **4 bases de datos** especializadas.

## 📊 Arquitectura de Bases de Datos

### 🔗 **Bases de Datos Relacionales**
- **PostgreSQL** - Destinos turísticos, reservas, usuarios
- **Oracle** - Empleados, finanzas corporativas, contabilidad

### 🔗 **Bases de Datos No Relacionales**
- **MongoDB** - Analytics, logs, comentarios, configuración
- **Cassandra** - Cache, sesiones, notificaciones, métricas en tiempo real

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
Copy-Item config.env.example .env

# Para probar si funciona 
 npm run dev
# Editar configuración de bases de datos en .env
# AQUÍ SE LLENA: Configurar las 4 bases de datos según tu entorno
```

## ⚙️ Configuración de Bases de Datos

### 1. **PostgreSQL** (Destinos y Reservas)
```sql
-- AQUÍ SE LLENA: Crear base de datos y tablas
CREATE DATABASE chimbote_travel;
-- Las tablas se crean automáticamente al iniciar la API
```

### 2. **MongoDB** (Analytics y Logs)
```javascript
// AQUÍ SE LLENA: Configurar MongoDB
// Las colecciones se crean automáticamente
```

### 3. **Oracle** (Empleados y Finanzas)
```sql
-- AQUÍ SE LLENA: Crear usuario y permisos en Oracle
CREATE USER chimbote_user IDENTIFIED BY password;
GRANT CONNECT, RESOURCE TO chimbote_user;
-- Las tablas se crean automáticamente
```

### 4. **Cassandra** (Cache y Notificaciones)
```cql
-- AQUÍ SE LLENA: Crear keyspace en Cassandra
CREATE KEYSPACE chimbote_travel WITH REPLICATION = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};
-- Las tablas se crean automáticamente
```

## 🚀 Iniciar Servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## 📚 Endpoints de la API

### 🏖️ **Destinos Turísticos**
```
GET    /api/destinations              # Listar todos los destinos
GET    /api/destinations/:id         # Obtener destino específico
POST   /api/destinations             # Crear nuevo destino
GET    /api/destinations/analytics/overview  # Analytics de destinos
```

### 📋 **Reservas**
```
POST   /api/reservations             # Crear nueva reserva
GET    /api/reservations             # Listar todas las reservas
GET    /api/reservations/:id         # Obtener reserva específica
PUT    /api/reservations/:id/status  # Actualizar estado de reserva
GET    /api/reservations/analytics/financial  # Reporte financiero
```

### 🏢 **Información Corporativa**
```
GET    /api/company/info             # Información de la empresa
GET    /api/company/employees        # Lista de empleados
GET    /api/company/financial-dashboard  # Dashboard financiero
GET    /api/company/analytics        # Analytics corporativos
POST   /api/company/contact          # Enviar mensaje de contacto
GET    /api/company/health           # Estado de salud del sistema
```

## 🗄️ Distribución de Datos por Base de Datos

### **PostgreSQL** (Base de Datos Relacional)
- ✅ Destinos turísticos
- ✅ Reservas de clientes
- ✅ Usuarios del sistema
- ✅ Relaciones entre entidades

### **MongoDB** (Base de Datos No Relacional)
- ✅ Logs de actividad
- ✅ Analytics y métricas
- ✅ Comentarios y reseñas
- ✅ Configuración del sitio
- ✅ Galería de imágenes

### **Oracle** (Base de Datos Relacional)
- ✅ Empleados y staff
- ✅ Registros financieros
- ✅ Inventario y recursos
- ✅ Reportes corporativos
- ✅ Clientes corporativos

### **Cassandra** (Base de Datos No Relacional)
- ✅ Sesiones de usuario
- ✅ Cache de destinos
- ✅ Métricas en tiempo real
- ✅ Notificaciones
- ✅ Datos de alta velocidad

## 🔧 Variables de Entorno

```env
# Servidor
PORT=3000
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=chimbote_travel
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_postgres

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chimbote_travel

# Oracle
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XE
ORACLE_USER=chimbote_user
ORACLE_PASSWORD=tu_password_oracle

# Cassandra
CASSANDRA_HOSTS=localhost:9042
CASSANDRA_DATACENTER=datacenter1
CASSANDRA_KEYSPACE=chimbote_travel
CASSANDRA_USER=cassandra
CASSANDRA_PASSWORD=tu_password_cassandra
```

## 📝 Notas de Implementación

### **AQUÍ SE LLENA:**
- Configurar las 4 bases de datos según tu entorno
- Llenar datos iniciales en cada base de datos
- Configurar usuarios y permisos
- Ajustar configuraciones de conexión

### **AQUÍ ES LA CONEXIÓN:**
- Todas las conexiones están configuradas en `/api/config/database.js`
- Se inicializan automáticamente al iniciar el servidor
- Cada base de datos tiene su modelo específico en `/api/models/`

## 🎯 Características

- ✅ **4 Bases de Datos** especializadas
- ✅ **API REST** completa
- ✅ **Logs y Analytics** automáticos
- ✅ **Cache inteligente** con Cassandra
- ✅ **Reportes financieros** con Oracle
- ✅ **Métricas en tiempo real**
- ✅ **Notificaciones** automáticas
- ✅ **Seguridad** con Helmet y CORS
- ✅ **Rate Limiting** para protección
- ✅ **Manejo de errores** robusto

## 🚀 Próximos Pasos

1. **Configurar las 4 bases de datos**
2. **Llenar datos iniciales**
3. **Probar endpoints**
4. **Configurar monitoreo**
5. **Implementar autenticación**

---

**Desarrollado para Chimbote Travel Tours** 🏖️
