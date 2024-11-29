const express = require('express');
const { getPool } = require('./db');
const { authorizeRole } = require('./authMiddleware');

const router = express.Router();

const SQLExecutor = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        console.log(query);
        const [result] = await conn.query(query, params);
        return result;
    } finally {
        await conn.release();
    }
};


// API for getting all the tags
router.get('/getTags', authorizeRole('Staff'), async (req, res) => {
    try {
        // check whether tag name has already existed
        const result = await SQLExecutor('SELECT * FROM TagTypes');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// API for creating a tag, only manager can create a tag
router.post('/createTag', authorizeRole('Manager'), async (req, res) => {
    const { tagName } = req.body;  // 从请求体中获取 tagName

    if (!tagName) {
        res.status(400).json({ error: 'Tag name is required' });
    }
    try {
        // check whether tag name has already existed
        const result = await SQLExecutor('SELECT tagName FROM TagTypes WHERE tagName = ?', [tagName]);
        if (result.length > 0) {
            res.status(400).json({ error: 'Tag name already exists' });
        }
        const insertResult = await SQLExecutor('INSERT INTO TagTypes (tagName) VALUES (?)', [tagName]);
        res.status(200).json({ message: `Tag "${tagName}" has been created` });
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// API for changing a tag
router.post('/changeTag', async (req, res) => {
    const { oldTagName, newTagName } = req.body;  // 从请求体中获取 tagName

    if (!oldTagName || !newTagName) {
        res.status(400).json({ error: 'Tag name is required' });
    }
    try {
        // check whether tag name has already existed
        const result = await SQLExecutor('SELECT tagName FROM TagTypes WHERE tagName = ?', [oldTagName]);
        if (result.length === 0) {
            res.status(400).json({ error: 'No such tag' });
        }
        const updateResult = await SQLExecutor('UPDATE TagTypes SET tagName = ? WHERE tagName = ?', [newTagName, oldTagName]);
        res.status(200).json({ message: `Tag "${oldTagName}" has been changed into "${newTagName}` });
    } catch (error) {
        console.error('Error changing tag:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// API for deleting a tag
router.post('/deleteTag', async (req, res) => {
    const { tagName } = req.body;  // 从请求体中获取 tagName

    if (!tagName) {
        res.status(400).json({ error: 'Tag name is required' });
    }

    try {
        // 检查该组是否存在
        const result = await SQLExecutor('SELECT ID FROM TagTypes WHERE tagName = ?', [tagName]);
        if (result.length === 0) {
            // 如果找不到该组，返回错误
            res.status(400).json({ error: 'No such tag' });
        }
        const tagID = result[0].ID;
        // delete tag info from table
        let deleteResult = await SQLExecutor(`DELETE FROM TagTypes WHERE ID = ${tagID}`, []);

        if (deleteResult.affectedRows === 0) {
            res.status(500).json({ error: 'Failed to delete tag' });
        }

        // delete relationship from table
        deleteResult = await SQLExecutor(`DELETE FROM TagAndUser WHERE tagID = ${tagID}`, []);
        // 返回成功信息
        res.status(200).json({ message: `Tag "${tagName}" has been deleted from table, relationships have been removed` });

    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});


module.exports = router;
