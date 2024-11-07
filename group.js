const express = require('express');
const { getPool } = require('./db');

const router = express.Router();

const groupOpFromDB = async (query, params = []) => {
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

// API for getting all the groups
router.get('/getGroups', async (req, res) => {
    try {
        // check whether group name has already existed
        const result = await groupOpFromDB('SELECT groupName FROM GroupTypes');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// API for creating a group
router.post('/createGroup', async (req, res) => {
    const { groupName } = req.body;  // 从请求体中获取 groupName

    if (!groupName) {
        res.status(400).json({ error: 'Group name is required' });
    }
    try {
        // check whether group name has already existed
        const result = await groupOpFromDB('SELECT groupName FROM GroupTypes WHERE groupName = ?', [groupName]);
        if (result.length > 0) {
            res.status(400).json({ error: 'Group name already exists' });
        }
        const insertResult = await groupOpFromDB('INSERT INTO GroupTypes (groupName) VALUES (?)', [groupName]);
        res.status(200).json({ message: `Group "${groupName}" has been created` });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// API for deleting a group
router.post('/deleteGroup', async (req, res) => {
    const { groupName } = req.body;  // 从请求体中获取 groupName

    if (!groupName) {
        res.status(400).json({ error: 'Group name is required' });
    }


    try {
        // 检查该组是否存在
        const result = await groupOpFromDB('SELECT ID FROM GroupTypes WHERE groupName = ?', [groupName]);
        if (result.length === 0) {
            // 如果找不到该组，返回错误
            res.status(400).json({ error: 'No such group' });
        }
        const groupID = result[0].ID;
        // delete group info from table
        let deleteResult = await groupOpFromDB(`DELETE FROM GroupTypes WHERE ID = ${groupID}`, []);

        if (deleteResult.affectedRows === 0) {
            res.status(500).json({ error: 'Failed to delete group' });
        }

        // delete relationship from table
        deleteResult = await groupOpFromDB(`DELETE FROM GroupAndUser WHERE groupID = ${groupID}`, []);

        if (deleteResult.affectedRows === 0) {
            res.status(500).json({ error: 'Failed to delete group' });
        }
        // 返回成功信息
        res.status(200).json({ message: `Group "${groupName}" has been deleted from table, relationships have been removed` });

    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});


module.exports = router;
