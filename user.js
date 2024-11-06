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

router.get('/id/groups/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const groups = await getGroupsFromDB('SELECT * FROM GroupAndUser WHERE userID = ?;', [id]);

        const groupIds = groups.map(group => group.GroupID);

        // 第二次查询，根据 GroupID 查询更多的组信息
        const placeholders = groupIds.map(() => '?').join(',');
        const groupDetailsQuery = `SELECT * FROM GroupTypes WHERE ID IN (${placeholders})`;
        const groupDetails = await getGroupsFromDB(groupDetailsQuery, groupIds);
        res.status(200).json(groupDetails);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;
