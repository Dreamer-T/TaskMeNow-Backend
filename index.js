// index.js
require('dotenv').config();
const express = require('express');
const { createPool, closePool } = require('./db');
const tasksRouter = require('./task');
const authRouter = require('./auth');
const authenticateToken = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

(async () => {
    await createPool(); // 初始化连接池

    app.get('/', (req, res) => {
        res.send("Welcome to TaskMeNow API!");
    });

    // 注册和登录路由
    app.use('/auth', authRouter);

    // 任务路由，受JWT验证保护
    app.use('/tasks', authenticateToken, tasksRouter);

    // 新增路由：动态修改连接池使用的数据库
    app.post('/change-database', async (req, res) => {
        const { dbName } = req.body;

        if (!dbName) {
            return res.status(400).json({ error: 'Database name is required' });
        }

        try {
            await closePool(); // 关闭现有连接池
            await createPool(dbName); // 使用新数据库重新创建连接池
            res.status(200).json({ message: `Successfully switched to database: ${dbName}` });
        } catch (error) {
            console.error('Error changing database:', error);
            res.status(500).json({ error: 'Failed to change database' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();

process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});
