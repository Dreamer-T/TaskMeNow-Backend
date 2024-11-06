const express = require('express');
const { getPool } = require('./db');

const router = express.Router();

router.get('/id/:id/groups', async (req, res) => {
    const id = req.params.id;
    try {
        const groups = await getTasksFromDB('SELECT * FROM Groups WHERE userID = ?;', [id]);
        res.status(200).json(groups);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});