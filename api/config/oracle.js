const oracledb = require("oracledb");

let oraclePool = null;

async function initOracle() {
  if (oraclePool) return oraclePool;

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  oraclePool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });

  console.log("✅ Pool de Oracle creado exitosamente.");
  return oraclePool;
}

async function getOracleConnection() {
  if (!oraclePool) await initOracle();
  return oraclePool.getConnection();
}

module.exports = { initOracle, getOracleConnection };
