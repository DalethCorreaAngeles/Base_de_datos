const oracledb = require('oracledb');
require('dotenv').config();


const OracleModels = require('./api/models/oracle');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD, 
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`
};

async function initializeDatabase() {
  console.log('📊 Inicializando base de datos Oracle...');
  
  if (!process.env.ORACLE_USER || !process.env.ORACLE_PASSWORD || !process.env.ORACLE_HOST) {
    console.error('❌ Error: Variables de entorno de Oracle no configuradas');
    console.error('💡 Verifica que .env contenga: ORACLE_USER, ORACLE_PASSWORD, ORACLE_HOST, ORACLE_PORT, ORACLE_SERVICE_NAME');
    process.exit(1);
  }
  
  let connection;
  
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conectado a Oracle');
    console.log(`   Usuario: ${process.env.ORACLE_USER}`);
    console.log(`   Servicio: ${process.env.ORACLE_SERVICE_NAME}`);
    
    console.log('\n📊 Creando tablas...');
    await OracleModels.initializeTables(connection);
    
    console.log('\n📊 Insertando datos de ejemplo...');
    
    const employeesExist = await OracleModels.tableExists(connection, 'employees');
    if (employeesExist) {
      const checkQuery = 'SELECT COUNT(*) as count FROM employees';
      const result = await connection.execute(checkQuery);
      
      if (result.rows[0].COUNT === 0) {
        const employees = [
          {
            first_name: 'Juan',
            last_name: 'Pérez',
            email: 'juan.perez@chimbotetravel.com',
            phone: '+51 999 888 777',
            position: 'Gerente General',
            department: 'Administración',
            salary: 5000.00
          },
          {
            first_name: 'María',
            last_name: 'García',
            email: 'maria.garcia@chimbotetravel.com',
            phone: '+51 999 888 778',
            position: 'Guía Turística',
            department: 'Operaciones',
            salary: 2500.00
          },
          {
            first_name: 'Carlos',
            last_name: 'Rodríguez',
            email: 'carlos.rodriguez@chimbotetravel.com',
            phone: '+51 999 888 779',
            position: 'Contador',
            department: 'Finanzas',
            salary: 3500.00
          }
        ];
        
        for (const emp of employees) {
          const query = `
            INSERT INTO employees (first_name, last_name, email, phone, position, department, salary)
            VALUES (:first_name, :last_name, :email, :phone, :position, :department, :salary)
          `;
          await connection.execute(query, emp);
        }
        console.log('✅ Empleados insertados');
      } else {
        console.log('📊 Datos de empleados ya existen');
      }
    }
    
    const financialExists = await OracleModels.tableExists(connection, 'financial_records');
    if (financialExists) {
      const checkQuery = 'SELECT COUNT(*) as count FROM financial_records';
      const result = await connection.execute(checkQuery);
      
      if (result.rows[0].COUNT === 0) {
        const records = [
          {
            transaction_type: 'INCOME',
            amount: 5000.00,
            description: 'Venta de paquetes turísticos',
            category: 'Ventas'
          },
          {
            transaction_type: 'EXPENSE',
            amount: 1200.00,
            description: 'Pago de servicios',
            category: 'Operaciones'
          },
          {
            transaction_type: 'INCOME',
            amount: 3000.00,
            description: 'Reservas del mes',
            category: 'Ventas'
          }
        ];
        
        for (const record of records) {
          const query = `
            INSERT INTO financial_records (transaction_type, amount, description, category)
            VALUES (:transaction_type, :amount, :description, :category)
          `;
          await connection.execute(query, record);
        }
        console.log('✅ Registros financieros insertados');
      } else {
        console.log('📊 Datos financieros ya existen');
      }
    }
    
    const inventoryExists = await OracleModels.tableExists(connection, 'inventory');
    if (inventoryExists) {
      const checkQuery = 'SELECT COUNT(*) as count FROM inventory';
      const result = await connection.execute(checkQuery);
      
      if (result.rows[0].COUNT === 0) {
        const items = [
          {
            item_name: 'Bus Turístico 40 plazas',
            item_type: 'VEHICLES',
            quantity: 2,
            unit_cost: 50000.00,
            supplier: 'AutoMundo S.A.',
            status: 'AVAILABLE'
          },
          {
            item_name: 'Equipo de Snorkeling',
            item_type: 'EQUIPMENT',
            quantity: 20,
            unit_cost: 150.00,
            supplier: 'Deportes Marinos',
            status: 'AVAILABLE'
          }
        ];
        
        for (const item of items) {
          const query = `
            INSERT INTO inventory (item_name, item_type, quantity, unit_cost, supplier, status)
            VALUES (:item_name, :item_type, :quantity, :unit_cost, :supplier, :status)
          `;
          await connection.execute(query, item);
        }
        console.log('✅ Inventario insertado');
      } else {
        console.log('📊 Datos de inventario ya existen');
      }
    }
    
    try {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM employees) as total_employees,
          (SELECT COUNT(*) FROM financial_records) as total_financial,
          (SELECT COUNT(*) FROM inventory) as total_inventory,
          (SELECT COUNT(*) FROM corporate_clients) as total_clients
        FROM dual
      `;
      const stats = await connection.execute(statsQuery);
      console.log('\n📊 Estadísticas de la base de datos:');
      console.log(`   👥 Empleados: ${stats.rows[0].TOTAL_EMPLOYEES}`);
      console.log(`   💰 Registros financieros: ${stats.rows[0].TOTAL_FINANCIAL}`);
      console.log(`   📦 Inventario: ${stats.rows[0].TOTAL_INVENTORY}`);
      console.log(`   🏢 Clientes corporativos: ${stats.rows[0].TOTAL_CLIENTS}`);
    } catch (statsError) {
      console.warn('⚠️  No se pudieron obtener estadísticas:', statsError.message);
    }
    
    console.log('\n✅ Base de datos Oracle inicializada exitosamente!');
    console.log('📝 Ahora puedes ejecutar: npm start');
    
  } catch (error) {
    console.error('\n❌ Error inicializando base de datos:', error.message);
    if (error.errorNum) {
      console.error(`   Código de error: ${error.errorNum}`);
    }
    console.error('\n💡 Soluciones posibles:');
    console.error('   1. Verifica que Oracle esté ejecutándose');
    console.error('   2. Verifica las credenciales en .env');
    console.error('   3. Verifica que el usuario tenga permisos para crear tablas');
    console.error('   4. Verifica que ORACLE_SERVICE_NAME sea correcto (ej: XEPDB1)');
    if (error.errorNum === 1017) {
      console.error('\n   🔑 Credenciales incorrectas. Verifica usuario y contraseña.');
    } else if (error.errorNum === 12514) {
      console.error('\n   🔌 Servicio no encontrado. Verifica ORACLE_SERVICE_NAME.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
}

initializeDatabase();

