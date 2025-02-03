require('dotenv').config();
const express = require('express');
const { createPool, closePool } = require('./db');
const tasksRouter = require('./task');
const userRouter = require('./user');
const tagRouter = require('./tag')
const authRouter = require('./auth');
const companyRouter = require('./company');
const groupRouter = require('./group');

const imageRouter = require('./image')
const { authenticateToken } = require('./authMiddleware');

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
    app.use('/users', authenticateToken, userRouter);
    app.use('/tags', authenticateToken, tagRouter);
    app.use('/images', authenticateToken, imageRouter);
    app.use('/groups', authenticateToken, groupRouter);



    // 404
    app.use((req, res, next) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Internal server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    // change database, unused currently
    app.post('/change-database', async (req, res) => {
        res.status(200).end();//：直接结束响应，这相当于发送一个空的响应。
        // const { dbName } = req.body;

        // if (!dbName) {
        //     return res.status(400).json({ error: 'Database name is required' });
        // }

        // try {
        //     await closePool();
        //     await createPool(dbName); // reconnect
        //     res.status(200).json({ message: `Successfully switched to database: ${dbName}` });
        // } catch (error) {
        //     console.error('Error changing database:', error);
        //     res.status(500).json({ error: 'Failed to change database' });
        // }
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();

process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});
