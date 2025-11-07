# 🐘 Configuración de PostgreSQL para Chimbote Travel API

## 📋 Requisitos Previos

1. **PostgreSQL instalado** (versión 12 o superior)
2. **Node.js** (versión 16 o superior)
3. **npm** o **yarn**

## 🚀 Configuración Paso a Paso

### 1. Instalar PostgreSQL

#### Windows:
```bash
# Descargar desde: https://www.postgresql.org/download/windows/
# O usar chocolatey:
choco install postgresql
```

#### macOS:
```bash
# Usar Homebrew:
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Crear la Base de Datos

```bash
# Conectar a PostgreSQL como superusuario
psql -U postgres

# Crear la base de datos
CREATE DATABASE chimbote_travel;

# Crear usuario (opcional)
CREATE USER chimbote_user WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE chimbote_travel TO chimbote_user;

# Salir
\q
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# ===========================================
# CONFIGURACIÓN DE POSTGRESQL
# ===========================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=chimbote_travel
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin123

# ===========================================
# CONFIGURACIÓN DEL SERVIDOR
# ===========================================
PORT=3000
NODE_ENV=development
```

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Inicializar la Base de Datos

```bash
# Ejecutar script de inicialización
npm run init-db
```

Este comando:
- ✅ Conecta a PostgreSQL
- ✅ Crea las tablas necesarias
- ✅ Inserta datos de ejemplo
- ✅ Muestra estadísticas

### 6. Iniciar el Servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## 🔧 Solución de Problemas

### Error: "database does not exist"
```bash
# Crear la base de datos manualmente
createdb -U postgres chimbote_travel
```

### Error: "password authentication failed"
```bash
# Verificar credenciales en .env
# O cambiar contraseña de PostgreSQL:
sudo -u postgres psql
ALTER USER postgres PASSWORD 'admin123';
```

### Error: "connection refused"
```bash
# Verificar que PostgreSQL esté ejecutándose
# Windows:
net start postgresql-x64-13

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

## 📊 Estructura de la Base de Datos

### Tabla: destinations
- `id` - ID único del destino
- `name` - Nombre del destino
- `location` - Ubicación
- `description` - Descripción
- `price` - Precio por persona
- `duration_days` - Duración en días
- `includes` - Array de servicios incluidos
- `image_url` - URL de la imagen
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización

### Tabla: reservations
- `id` - ID único de la reserva
- `client_name` - Nombre del cliente
- `client_email` - Email del cliente
- `destination_id` - ID del destino (FK)
- `travel_date` - Fecha de viaje
- `number_of_people` - Número de personas
- `total_price` - Precio total
- `status` - Estado de la reserva
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización

### Tabla: users
- `id` - ID único del usuario
- `username` - Nombre de usuario
- `email` - Email del usuario
- `password_hash` - Hash de la contraseña
- `role` - Rol del usuario
- `created_at` - Fecha de creación

## 🧪 Probar la API

### Endpoints Disponibles:

```bash
# Obtener todos los destinos
GET http://localhost:3000/api/destinations

# Obtener destino específico
GET http://localhost:3000/api/destinations/1

# Crear nueva reserva
POST http://localhost:3000/api/reservations
Content-Type: application/json

{
  "client_name": "Juan Pérez",
  "client_email": "juan@email.com",
  "destination_id": 1,
  "travel_date": "2024-02-15",
  "number_of_people": 2
}

# Obtener todas las reservas
GET http://localhost:3000/api/reservations

# Actualizar estado de reserva
PUT http://localhost:3000/api/reservations/1/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

## 📈 Monitoreo

### Verificar Conexión:
```bash
# Conectar directamente a PostgreSQL
psql -U postgres -d chimbote_travel

# Ver tablas
\dt

# Ver datos
SELECT * FROM destinations;
SELECT * FROM reservations;
```

### Logs del Servidor:
```bash
# Ver logs en tiempo real
npm run dev

# Los logs mostrarán:
# ✅ PostgreSQL conectado exitosamente
# 📊 Base de datos: chimbote_travel
# 🏠 Host: localhost:5432
```

## 🎯 Próximos Pasos

1. **Configurar respaldos automáticos**
2. **Implementar autenticación JWT**
3. **Agregar validaciones de datos**
4. **Configurar índices para optimización**
5. **Implementar cache con Redis**

## 📞 Soporte

Si tienes problemas:
1. Verifica que PostgreSQL esté ejecutándose
2. Revisa las credenciales en `.env`
3. Ejecuta `npm run init-db` para reinicializar
4. Consulta los logs del servidor

¡Listo! Tu API de Chimbote Travel está configurada con PostgreSQL. 🎉
