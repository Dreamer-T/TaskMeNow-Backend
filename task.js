const express = require('express');
const { getPool } = require('./db');

const router = express.Router();

const getTasksFromDB = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(query, params);
        return result;
    } finally {
        await conn.release();
    }
};


const createTaskInDB = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(query, params);
        return result;
    } finally {
        await conn.release();
    }
};

router.get('/id', async (req, res) => {
    const id = req.params.id;
    try {
        const task = await getTasksFromDB('SELECT * FROM Tasks WHERE id = ?;', [id]);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

router.get('/assignedTo', async (req, res) => {
    const assignedTo = req.params.assignedTo;
    try {
        const task = await getTasksFromDB('SELECT * FROM Tasks WHERE assignedTo= ?', [assignedTo])
        console.log(task);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
})


// API of create task
router.post('/createTask', async (req, res) => {
    const { taskDescription, taskImage, assignedTo, createdBy, urgencyLevel } = req.body;

    // check those are necessary
    if (!taskDescription || !assignedTo || !createdBy || !urgencyLevel) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const query = 'INSERT INTO Tasks (taskDescription, taskImage, assignedTo, createdBy, urgencyLevel) VALUES (?, ?, ?, ?, ?)';
        const values = [taskDescription, taskImage || null, assignedTo, createdBy, urgencyLevel];
        const result = await createTaskInDB(query, values);

        res.status(200).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
