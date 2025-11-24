# MongoDB

## Requisitos Previos

1. **MongoDB Atlas** (Cloud) o **MongoDB Local**
2. **Node.js**
3. **npm**

## Configuración Paso a Paso

### 1. Opción A: MongoDB Atlas (Cloud)

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Crea un Cluster gratuito.
3. En **Database Access**, crea un usuario (ej. `chimbote_user`).
4. En **Network Access**, permite tu IP o `0.0.0.0/0`.
5. Obtén la URI de conexión: `mongodb+srv://<user>:<password>@cluster...`

### 2. Opción B: MongoDB Local

```bash
# Instalar MongoDB Community Edition
# Iniciar servicio
sudo systemctl start mongod
```

### 3. Configurar Variables de Entorno

Agrega al archivo `.env`:

```env
# ===========================================
# CONFIGURACIÓN DE MONGODB
# ===========================================
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/chimbote_travel
# O para local: mongodb://localhost:27017/chimbote_travel
```

### 4. Inicializar Colecciones

MongoDB crea las colecciones automáticamente al insertar datos, pero puedes verificar la conexión:

```bash
npm run test-connections
```

## Estructura de Datos (Colecciones)

### 1. activity_logs
Registro de acciones de usuarios.
- `user_id`, `action`, `resource`, `timestamp`

### 2. analytics
Métricas de uso del sitio.
- `date`, `page_views`, `unique_visitors`

### 3. reviews
Reseñas de destinos.
- `destination_id`, `rating`, `comment`, `client_name`

### 4. site_config
Configuración global del sitio (contacto, redes sociales).

## Endpoints Disponibles

Estos endpoints interactúan principalmente con MongoDB:

### Logs y Analíticas
```http
GET /api/activity-logs
```
- **Descripción**: Obtiene historial de actividad.

```http
GET /api/analytics
```
- **Descripción**: Obtiene métricas de rendimiento.

### Configuración
```http
GET /api/company/info
```
- **Descripción**: Obtiene información de contacto y configuración del sitio.

## Solución de Problemas

### Error: "bad auth"
1. Verifica usuario y contraseña en `MONGODB_URI`.
2. Asegúrate de que el usuario tenga permisos de lectura/escritura.

### Error: "connection timed out"
1. Revisa **Network Access** en Atlas (IP Whitelist).
2. Verifica tu conexión a internet.



