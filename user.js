const express = require('express');
const { getPool } = require('./db');

const router = express.Router();

const getGroupsFromDB = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(query, params);
        console.log(result);
        return result;
    } finally {
        await conn.release();
    }
};
router.get('/id/:id/groups', async (req, res) => {
    const id = req.params.id;
    try {
        const groups = await getGroupsFromDB('SELECT * FROM Groups WHERE userID = ?;', [id]);
        res.status(200).json(groups);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;
