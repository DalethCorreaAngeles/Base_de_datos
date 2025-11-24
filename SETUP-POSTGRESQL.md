# PostgreSQL

## Requisitos Previos

1. **PostgreSQL**
2. **Node.js**
3. **npm**

## Configuración Paso a Paso

### 1. Instalar PostgreSQL

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows:
Descargar e instalar desde [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Crear Base de Datos y Usuario

```bash
# Acceder a la consola de Postgres
sudo -u postgres psql

# Crear usuario
CREATE USER postgres WITH PASSWORD 'admin123';

# Crear base de datos
CREATE DATABASE chimbote_travel OWNER postgres;

# Dar privilegios
GRANT ALL PRIVILEGES ON DATABASE chimbote_travel TO postgres;

# Salir
\q
```

### 3. Configurar Variables de Entorno

Agrega al archivo `.env`:

```env
# ===========================================
# CONFIGURACIÓN DE POSTGRESQL
# ===========================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=chimbote_travel
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin123
```

### 4. Inicializar Tablas

```bash
# Ejecutar script de inicialización
npm run init-db
```

## Estructura de Datos (Tablas)

### 1. destinations
Destinos turísticos disponibles.
- `id`, `name`, `location`, `price`, `description`

### 2. reservations
Reservas realizadas por clientes.
- `id`, `client_name`, `travel_date`, `status`

### 3. users
Usuarios del sistema (admin/clientes).
- `id`, `username`, `email`, `role`

## Endpoints Disponibles

Estos endpoints interactúan principalmente con PostgreSQL:

### Destinos
```http
GET /api/destinations
```
- **Descripción**: Obtiene todos los destinos turísticos.
- **Respuesta**: Array de objetos destino.

```http
GET /api/destinations/:id
```
- **Descripción**: Obtiene detalles de un destino específico.

### Reservas
```http
GET /api/reservations
```
- **Descripción**: Lista todas las reservas (requiere admin).

```http
POST /api/reservations
```
- **Descripción**: Crea una nueva reserva.
- **Body**: `{ client_name, destination_id, travel_date, ... }`

### Compañía
```http
GET /api/company/info
```
- **Descripción**: Información general de la empresa.

## Solución de Problemas

### Error: "password authentication failed"
1. Verifica `POSTGRES_PASSWORD` en `.env`.
2. Asegúrate de que el usuario `postgres` tenga esa contraseña.

### Error: "database does not exist"
1. Ejecuta `createdb chimbote_travel` manualmente si el script falla.



