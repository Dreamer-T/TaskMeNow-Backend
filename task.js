// task.js
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

router.get('', async (req, res) => {
    try {
        const tasks = await getTasksFromDB('SELECT * FROM Tasks;');
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const task = await getTasksFromDB('SELECT * FROM Tasks WHERE id = ?;', [id]);
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// Add more routes for create, update, and delete tasks here

module.exports = router;
