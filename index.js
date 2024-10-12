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
    await createPool();

    app.get('/', (req, res) => {
        res.send("Welcome to TaskMeNow API!");
    });

    // 注册和登录路由
    app.use('/auth', authRouter);

    // 任务路由，受JWT验证保护
    app.use('/tasks', authenticateToken, tasksRouter);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();

process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});
