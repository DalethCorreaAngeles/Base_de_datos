const oracledb = require('oracledb');
require('dotenv').config();

console.log('🔍 Probando configuración:');
console.log('Usuario:', process.env.ORACLE_USER);
console.log('Servicio:', process.env.ORACLE_SERVICE_NAME);
console.log('Connect String:', `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`);

const config = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: 'localhost:1521/XE'
};

async function test() {
  try {
    const conn = await oracledb.getConnection(config);
    console.log('✅ CONEXIÓN EXITOSA!');
    await conn.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();