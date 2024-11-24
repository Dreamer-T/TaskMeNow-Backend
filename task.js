const express = require('express');
const { getPool } = require('./db');
const { authorizeRole } = require('./authMiddleware');

const router = express.Router();

const SQLExecutor = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        // console.log(query, params);
        const [result] = await conn.query(query, params);
        // console.log(result);
        return result;
    } finally {
        await conn.release();
    }
};

router.get('/id/:id', authorizeRole('Staff'), async (req, res) => {
    const id = req.params.id;
    try {
        const task = await SQLExecutor('SELECT * FROM Tasks WHERE id = ?;', [id]);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

router.get('/assignedTo/:assignedTo', authorizeRole('Staff'), async (req, res) => {
    const assignedTo = req.params.assignedTo;
    try {
        // get all tasks
        const tasks = await SQLExecutor('SELECT * FROM Tasks WHERE assignedTo = ?', [assignedTo]);

        // get creatorName of each task
        const tasksWithCreator = await Promise.all(tasks.map(async (task) => {
            // get userName via Users according to createdBy
            const creatorResult = await SQLExecutor('SELECT userName FROM Users WHERE ID = ?', [task.createdBy]);
            // include creatorName in json
            task.creatorName = creatorResult.length > 0 ? creatorResult[0].userName : null;
            return task;
        }));

        res.status(200).json(tasksWithCreator);
    } catch (error) {
        console.error('Error fetching tasks and creator:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});



// API of create task, at least to be a staff
router.post('/createTask', authorizeRole('Staff'), async (req, res) => {
    const { taskDescription, taskImage, assignedTo, createdBy, urgencyLevel } = req.body;

    // check those are necessary
    if (!taskDescription || !assignedTo || !createdBy || !urgencyLevel) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const query = 'INSERT INTO Tasks (taskDescription, taskImage, assignedTo, createdBy, urgencyLevel) VALUES (?, ?, ?, ?, ?)';
        const values = [taskDescription, taskImage || null, assignedTo, createdBy, urgencyLevel];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
