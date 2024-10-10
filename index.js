require('dotenv').config(); // 加载环境变量

const express = require('express');
const { createPool, closePool } = require('./db');
const tasksRouter = require('./task');

// 其余代码...

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
    await createPool();

    // Middleware to handle async errors
    const asyncHandler = fn => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    app.get('/', (req, res) => {
        res.send("Welcome to TaskMeNow API!");
    });

    app.use('/tasks', tasksRouter);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();

process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});
