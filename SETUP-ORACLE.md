# Oracle Database

## Requisitos Previos

1. **Oracle Database Express Edition (XE)**
2. **Node.js**
3. **Instant Client** 

## Configuración Paso a Paso

### 1. Instalar Oracle Database XE

Descarga e instala desde [Oracle Website](https://www.oracle.com/database/technologies/xe-downloads.html).
- **Contraseña SYS**: Recuerda la contraseña que configures.
- **Servicio**: Por defecto es `XEPDB1`.

### 2. Crear Usuario y Permisos

Conéctate con SQL Plus o SQL Developer como `SYS AS SYSDBA`:

```sql
-- Crear usuario
CREATE USER chimbote_user IDENTIFIED BY marinita;

-- Dar permisos
GRANT CONNECT, RESOURCE TO chimbote_user;
ALTER USER chimbote_user QUOTA UNLIMITED ON USERS;
```

### 3. Configurar Variables de Entorno

Agrega al archivo `.env`:

```env
# ===========================================
# CONFIGURACIÓN DE ORACLE
# ===========================================
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USER=chimbote_user
ORACLE_PASSWORD=marinita
```

### 4. Inicializar Tablas

El servidor intentará crear las tablas automáticamente al iniciar, o puedes usar el script:

```bash
npm run init-oracle
```

## Estructura de Datos (Tablas)

### 1. employees
Gestión de personal.
- `id_empleado`, `nombre`, `cargo`, `salario`

### 2. financial_records
Registro de ingresos y egresos.
- `id_finanza`, `descripcion`, `monto`, `tipo`

### 3. inventory
Inventario de recursos.
- `item_id`, `item_name`, `quantity`

### 4. corporate_clients
Clientes corporativos.
- `client_id`, `company_name`, `contact_person`

## Endpoints Disponibles

Estos endpoints interactúan principalmente con Oracle:

### Finanzas y Reportes
```http
GET /api/company/financials
```
- **Descripción**: Obtiene resumen financiero (ingresos/egresos).

### Empleados
```http
GET /api/company/employees
```
- **Descripción**: Lista de empleados activos.

### Inventario
```http
GET /api/company/inventory
```
- **Descripción**: Lista de items en inventario.

## Solución de Problemas

### Error: "ORA-12514: TNS:listener does not currently know of service"
1. Verifica que el servicio `XEPDB1` esté activo.
2. Comprueba `lsnrctl status` en la consola de comandos.

### Error: "ORA-01017: invalid username/password"
1. Verifica `ORACLE_USER` y `ORACLE_PASSWORD` en `.env`.




