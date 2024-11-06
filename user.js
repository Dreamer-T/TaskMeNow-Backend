const express = require('express');
const { getPool } = require('./db');

const router = express.Router();

const getGroupsFromDB = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        console.log(query);
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

        // get all the group id
        const groupIds = groups.map(group => group.groupID);
        // map id to generate a query
        const placeholders = groupIds.map(() => '?').join(',');
        const groupDetailsQuery = `SELECT groupName FROM GroupTypes WHERE ID IN (${placeholders})`;
        // get the result
        const groupDetails = await getGroupsFromDB(groupDetailsQuery, groupIds);
        // use json to pass the result, which only contains group name
        res.status(200).json(groupDetails);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;
