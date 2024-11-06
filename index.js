require('dotenv').config();
const express = require('express');
const { createPool, closePool } = require('./db');
const tasksRouter = require('./task');
const userRouter = require('./user')
const authRouter = require('./auth');
const companyRouter = require('./company')
const authenticateToken = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

(async () => {
    await createPool();

    app.get('/', (req, res) => {
        res.send("Welcome to TaskMeNow API!");
    });


    // router for login/registration
    app.use('', authRouter);
    app.use('', companyRouter);
    // router for tasks
    app.use('/tasks', authenticateToken, tasksRouter);
    app.use('/user', authenticateToken, userRouter);

    // change database, unused currently
    app.post('/change-database', async (req, res) => {
        res.status(200).end();//：直接结束响应，这相当于发送一个空的响应。
        const { dbName } = req.body;

        if (!dbName) {
            return res.status(400).json({ error: 'Database name is required' });
        }

        try {
            await closePool();
            await createPool(dbName); // reconnect
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
