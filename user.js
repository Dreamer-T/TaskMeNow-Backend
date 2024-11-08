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
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// set a user as a member of a group
router.post('/setGroup', async (req, res) => {
    const { groupID, userID } = req.body;  // get groupID and userID from body

    if (!userID) {
        res.status(400).json({ error: 'User info is required' });
    }
    if (!groupID) {
        res.status(400).json({ error: 'Group info is required' });
    }
    try {
        // check whether user is in the group
        const result = await getGroupsFromDB('SELECT * FROM GroupAndUser WHERE groupID = ? AND userID = ?', [groupID, userID]);
        if (result.length > 0) {
            res.status(400).json({ error: 'User is already in the group' });
        } else {
            // if not, add the user into the group
            const insertResult = await getGroupsFromDB('INSERT INTO GroupAndUser (groupID, userID) VALUES (?,?)', [groupID, userID]);
            res.status(200).json({ message: 'User is added into the group successfully' });
        }
    } catch (error) {
        console.error('Error setting user\'s group: ', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// delete a user from a group
router.post('/setGroup', async (req, res) => {
    const { groupID, userID } = req.body;  // get groupID and userID from body

    if (!userID) {
        res.status(400).json({ error: 'User info is required' });
    }
    if (!groupID) {
        res.status(400).json({ error: 'Group info is required' });
    }
    try {
        // check whether user is in the group
        const result = await getGroupsFromDB('SELECT * FROM GroupAndUser WHERE groupID = ? AND userID = ?', [groupID, userID]);
        if (result.length === 0) {
            res.status(400).json({ error: 'User is not in the group' });
        } else {
            // if not, add the user into the group
            const deleteResult = await getGroupsFromDB('DELETE FROM GroupAndUser WHERE groupID = ? AND userID = ?', [groupID, userID]);
            res.status(200).json({ message: 'User is deleted from the group successfully' });
        }
    } catch (error) {
        console.error('Error setting user\'s group: ', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;
