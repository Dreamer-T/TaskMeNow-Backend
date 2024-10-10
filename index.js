const express = require('express');
const mysql = require('mysql2/promise');
const { Connector } = require('@google-cloud/cloud-sql-connector');

const app = express();
const port = 8080; // 你可以根据需要更改端口

// 根路由
app.get('/', (req, res) => {
    res.send('Welcome to the Cloud SQL API! Use /current-time to get the current database time.');
});

// 当前时间路由
app.get('/current-time', async (req, res) => {
    const connector = new Connector();
    let pool; // 在这里声明 pool

    try {
        const clientOpts = await connector.getOptions({
            instanceConnectionName: 'taskmenow:australia-southeast2:main-database',
            ipType: 'PUBLIC',
        });

        pool = await mysql.createPool({
            ...clientOpts,
            user: 'root',
            password: 'taskme103',
            database: 'Company1',
        });

        const conn = await pool.getConnection();
        const [result] = await conn.query(`SELECT NOW();`);
        await conn.release();

        res.json(result); // 将结果以 JSON 格式返回
    } catch (error) {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'Error connecting to the database' });
    } finally {
        if (pool) { // 确保 pool 存在后再调用 end
            await pool.end();
        }
        connector.close();
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
