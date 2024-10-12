// db.js
const mysql = require('mysql2/promise');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const connector = new Connector();

let pool;
let currentDatabase = process.env.DB_NAME || 'default_database'; // 默认数据库

const createPool = async (dbName = currentDatabase) => {
    try {
        const clientOpts = await connector.getOptions({
            instanceConnectionName: 'taskmenow:australia-southeast2:main-database',
            ipType: 'PUBLIC',
        });

        // 使用指定的数据库名称创建连接池
        pool = await mysql.createPool({
            ...clientOpts,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName,  // 使用传入的数据库名称
            connectionLimit: 10, // 根据负载调整连接数
        });

        currentDatabase = dbName;
        console.log(`Database pool created successfully for database: ${dbName}`);
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
// db.js
const getUserByUsername = async (username) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query('SELECT * FROM Users WHERE username = ?;', [username]);
        return result[0];
    } finally {
        await conn.release();
    }
};

module.exports = {
    createPool,
    getPool,
    closePool,
    getUserByUsername,
};
