const express = require('express');
const { getPool, checkCompanyExist } = require('./db');

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

router.get('/:company/:id', async (req, res) => {
    const company = req.params.company;
    const id = req.params.id;
    try {
        const [rows] = await checkCompanyExist('SELECT * FROM company WHERE name = ? and id = ?;', [company, id]);
        if (rows.length === 0) {
            return res.status(404).send('Company not found.');
        }
        const tableName = `${company}_${id}_tasks`;
        const tasks = await getTasksFromDB('SELECT * FROM ??;', [tableName]);
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
