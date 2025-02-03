const mysql = require('mysql2/promise');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const connector = new Connector();

let pool;
let currentDatabase = process.env.DB_NAME || 'TestDatabase'; // default
let connectionName = process.env.INSTANCE_CONNECTION_NAME || 'core-incentive-445913-q5:australia-southeast2:mitto';

const createPool = async () => {
    try {
        const clientOpts = await connector.getOptions({
            instanceConnectionName: connectionName,
            ipType: 'PUBLIC',
        });

        pool = await mysql.createPool({
            ...clientOpts,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: currentDatabase,
            connectionLimit: 10, // Adjust based on expected load
        });

        console.log('Database pool created successfully');
    } catch (error) {
        console.error('Error setting up the database pool:', error);
        process.exit(1);
    }
};

const getPool = () => pool;

const closePool = async () => {
    try {
        if (pool) {
            await pool.end();
            console.log('Database pool closed successfully');
        }
        connector.close();
    } catch (error) {
        console.error('Error closing the database pool:', error);
    }
};

const getUserByUseremail = async (email) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query('SELECT * FROM Users WHERE email = ?;', [email]);
        return result[0];
    } finally {
        await conn.release();
    }
};
/**
 * check whether company exists for security
 */
async function checkCompanyExist(query, params = []) {
    const [rows] = await connection.execute(query, params);
    return rows;
}

const SQLExecutor = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        console.log(query);
        const [result] = await conn.query(query, params);
        return result;
    } finally {
        await conn.release();
    }
};
module.exports = {
    createPool,
    getPool,
    closePool,
    getUserByUseremail,
    checkCompanyExist,
    SQLExecutor
};
