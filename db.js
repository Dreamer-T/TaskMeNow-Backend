// db.js
const mysql = require('mysql2/promise');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const connector = new Connector();

let pool;

const createPool = async () => {
    try {
        const clientOpts = await connector.getOptions({
            instanceConnectionName: 'taskmenow:australia-southeast2:main-database',
            ipType: 'PUBLIC',
        });

        pool = await mysql.createPool({
            ...clientOpts,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
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

module.exports = {
    createPool,
    getPool,
    closePool,
};
