# Configuración de MongoDB para Chimbote Travel API

## Requisitos Previos

1. **MongoDB Atlas** (Cloud) 
2. **Node.js** (versión 16 o superior)
3. **npm** o **yarn**

## Opciones de Configuración

### Opción 1: MongoDB Atlas (Cloud)

MongoDB Atlas es la solución en la nube, no requiere instalación local.

## Configuración con MongoDB Atlas (Cloud)

### 1. Crear cuenta en MongoDB Atlas

1. Visita [https://www.mongodb.com/cloud/atlas]
2. Crea una cuenta gratuita (M0 - Free tier)
3. Crea un nuevo cluster (elige la región más cercana)

### 2. Configurar acceso a la base de datos

#### 2.1. Crear usuario de base de datos

1. Ve a **Database Access** → **Add New Database User**
2. Crea un usuario con:
   - **Username**: `chimbote_travel` 
   - **Password**: Genera una contraseña segura
   - **Database User Privileges**: `Read and write to any database`
3. Guarda las credenciales (las necesitarás después)

#### 2.2. Configurar acceso de red

1. Ve a **Network Access** → **Add IP Address**
2. Para desarrollo: Agrega `0.0.0.0/0` (permite acceso desde cualquier IP)
   -- **Nota**: En producción, usa IPs específicas
3. O agrega tu IP actual

### 3. Obtener cadena de conexión

1. Ve a **Database** → **Connect** → **Connect your application**
2. Elige **Node.js** como driver
3. Copia la cadena de conexión, ejemplo:
   ```
  MONGODB_URI=mongodb+srv://daliaph3929q_db_user:AkfuLFnVeVsjuFG8@cluster.mongodb.net/chimbote_travel
   ```
4. **Importante**: Agrega el nombre de la base de datos a la URI:
   ```
   mongodb+srv://daliaph3929q_db_user:AkfuLFnVeVsjuFG8@cluster0.xxxxx.mongodb.net/chimbote_travel?retryWrites=true&w=majority
   ```

### 4. Configurar Variables de Entorno

Crear o editar archivo `.env` en la raíz del proyecto:

```env
# ===========================================
# CONFIGURACIÓN DE MONGODB
# ===========================================
MONGODB_URI=mongodb+srv://daliaph3929q_db_user:AkfuLFnVeVsjuFG8@cluster.mongodb.net/chimbote_travel

# ===========================================
# CONFIGURACIÓN DEL SERVIDOR
# ===========================================
PORT=3002
NODE_ENV=development
```

**Nota importante**: 
- Con `mongodb+srv://` **NO necesitas especificar puerto** (se resuelve automáticamente)
- El puerto 27017 es el estándar, pero se maneja automáticamente con SRV


### 2. Verificar instalación

```bash
# Verificar que MongoDB esté corriendo
# Windows:
net start MongoDB


### 3. Crear la base de datos

MongoDB crea las bases de datos automáticamente al usarlas, pero puedes verificar:

```bash
# Conectar a MongoDB
mongosh

# Ver bases de datos
show dbs

# Usar la base de datos (se crea automáticamente si no existe)
use chimbote_travel

# Ver colecciones
show collections

# Salir
exit
```

## Instalar Dependencias

```bash
npm install
```

## Probar la Conexión

```bash
# Ejecutar script de prueba de conexiones
npm run test-connections
```

Este comando:
- ✅ Verifica conexión a MongoDB
- ✅ Muestra información de la conexión (host, puerto, base de datos)
- ✅ Lista las colecciones existentes
- ✅ Muestra estadísticas del servidor

## Solución de Problemas

### Error: "MongoServerError: bad auth"

**Causa**: Credenciales incorrectas o usuario no existe

**Solución**:
1. Verifica las credenciales en `.env`
2. En MongoDB Atlas: Verifica que el usuario tenga permisos correctos
3. Verifica que la contraseña no tenga caracteres especiales que necesiten encoding

### Error: "MongoServerSelectionError: connection timed out"

**Causa**: No se puede alcanzar el servidor de MongoDB

**Soluciones**:

#### MongoDB Atlas:
1. Verifica que tu IP esté en la lista de **Network Access**
2. Agrega `0.0.0.0/0` temporalmente para desarrollo
3. Verifica que la cadena de conexión sea correcta
4. Verifica tu conexión a internet

## Probar la API

### Endpoints Disponibles (que usan MongoDB):

```bash
# Obtener configuración del sitio
GET http://localhost:3002/api/company/info

# Ver logs de actividad
GET http://localhost:3002/api/activity-logs

# Obtener analytics
GET http://localhost:3002/api/analytics
```

## Monitoreo

### Verificar Conexión:
```bash
# Ejecutar script de prueba
npm run test-connections

# Ver información de MongoDB
# El script mostrará:
# ✅ MongoDB conectado correctamente
#    Estado: Conectado
#    Host: [host]
#    Puerto: 
#    Base de datos: chimbote_travel
#    Versión: [versión]
#    Colecciones: activitylogs, galleries, analytics, siteconfigs, reviews
```

### Ver datos en MongoDB Atlas:
1. Ve a **Database** → **Browse Collections**
2. Selecciona la base de datos `chimbote_travel`
3. Explora las colecciones y documentos

## Notas Importantes

### Puerto en MongoDB Atlas
- ⚠️ **Con `mongodb+srv://` NO se especifica puerto en la URI**
- El protocolo SRV resuelve automáticamente el puerto (normalmente 27017)
- El puerto se muestra en los logs solo como información


### Seguridad
- 🔒 **En producción**: No uses `0.0.0.0/0` en Network Access
- 🔒 **En producción**: Usa variables de entorno para las credenciales
- 🔒 **En producción**: Usa autenticación fuerte
- 🔒 **Nunca**: Commitees el archivo `.env` al repositorio


**¿Necesitas ayuda?** Revisa la sección "Solución de Problemas" o ejecuta `npm run test-connections` para obtener información detallada de la conexión.

