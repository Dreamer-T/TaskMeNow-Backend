const mysql = require('mysql2/promise');
const { Connector } = require('@google-cloud/cloud-sql-connector'); // 假设你用的是某个数据库连接库
const connector = new Connector();
let pool;
const express = require('express');
(async () => {
    try {
        // 在应用程序启动时创建 connector 和连接池
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

        console.log('Database pool created successfully');
    } catch (error) {
        console.error('Error setting up the database pool:', error);
        process.exit(1); // 如果连接池创建失败，直接退出应用程序
    }
})();

// 在路由中重用全局的 `pool`
const someRouteHandler = async (req, res) => {
    try {
        const conn = await pool.getConnection(); // 从全局的连接池获取连接
        const [result] = await conn.query(`SELECT NOW();`); // 执行查询
        await conn.release(); // 释放连接，返回连接池
        res.json(result); // 返回查询结果
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Error executing query' });
    }
};

// 在应用程序关闭时清理资源
process.on('SIGINT', async () => {
    try {
        if (pool) {
            await pool.end(); // 关闭连接池
        }
        connector.close(); // 关闭 connector
        console.log('Database pool closed successfully');
        process.exit(0); // 正常退出
    } catch (error) {
        console.error('Error closing the database pool:', error);
        process.exit(1); // 出现问题时退出并带有错误码
    }
});
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/api/time', async (req, res) => {
    try {
        const conn = await pool.getConnection(); // 从连接池获取一个连接
        const [result] = await conn.query('SELECT NOW();'); // 执行查询
        await conn.release(); // 释放连接回到连接池
        res.json(result); // 返回查询结果
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});
// 启动服务器并监听指定端口
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});