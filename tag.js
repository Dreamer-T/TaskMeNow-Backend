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
        return res.status(400).json({ error: 'Tag name is required' });
    }
    try {
        // check whether tag name has already existed
        const result = await SQLExecutor('SELECT tagName FROM TagTypes WHERE tagName = ?', [tagName]);
        if (result.length > 0) {
            return res.status(400).json({ error: 'Tag name already exists' });
        }
        const insertResult = await SQLExecutor('INSERT INTO TagTypes (tagName) VALUES (?)', [tagName]);
        res.status(200).json({ message: `Tag "${tagName}" has been created` });
    } catch (error) {
        console.error('Error creating tag:', error);
        return res.status(500).json({ error: 'Database query error' });
    }
});

// API for changing a tag
router.post('/changeTag', async (req, res) => {
    const { oldTagName, newTagName } = req.body;  // 从请求体中获取 tagName

    if (!oldTagName || !newTagName) {
        return res.status(400).json({ error: 'Tag name is required' });
    }
    try {
        // check whether tag name has already existed
        const result = await SQLExecutor('SELECT tagName FROM TagTypes WHERE tagName = ?', [oldTagName]);
        if (result.length === 0) {
            return res.status(400).json({ error: 'No such tag' });
        }
        const updateResult = await SQLExecutor('UPDATE TagTypes SET tagName = ? WHERE tagName = ?', [newTagName, oldTagName]);
        return res.status(200).json({ message: `Tag "${oldTagName}" has been changed into "${newTagName}` });
    } catch (error) {
        console.error('Error changing tag:', error);
        return res.status(500).json({ error: 'Database query error' });
    }
});

// API for deleting a tag
router.post('/deleteTag', authorizeRole('Manager'), async (req, res) => {
    const { tagName } = req.body;  // 从请求体中获取 tagName

    if (!tagName) {
        return res.status(400).json({ error: 'Tag name is required' });
    }

    try {
        // 检查该组是否存在
        const result = await SQLExecutor('SELECT ID FROM TagTypes WHERE tagName = ?', [tagName]);
        if (result.length === 0) {
            // 如果找不到该组，返回错误
            return res.status(400).json({ error: 'No such tag' });
        }
        const tagID = result[0].ID;

        // delete tag and task relationship from table
        const tasks = await SQLExecutor(`SELECT ID, tags FROM Tasks WHERE JSON_CONTAINS(tags->'$.ID', JSON_ARRAY(?))`, [tagID]);

        // 如果没有任务包含该 tagID，直接返回
        if (tasks.length === 0) {
            return res.status(200).json({
                message: `Tag "${tagName}" has been deleted from table, relationships have been removed`,
                updatedTaskCount: 0
            });
        }

        // 更新每个任务的 tags 字段，移除指定的 tagID
        for (let task of tasks) {
            let tags = task.tags;
            console.log(tags.ID);
            let updatedTagIDs = tags.ID.filter((id) => id !== parseInt(tagID, 10));
            console.log(updatedTagIDs);
            var jsonTagIDs = JSON.stringify({ "ID": updatedTagIDs });
            await SQLExecutor('UPDATE Tasks SET tags = ? WHERE ID = ?', [jsonTagIDs, task.ID]);
        }
        // delete tag info from table
        let deleteResult = await SQLExecutor(`DELETE FROM TagTypes WHERE ID = ${tagID}`, []);

        if (deleteResult.affectedRows === 0) {
            return res.status(500).json({ error: 'Failed to delete tag' });
        }

        // delete tag and user relationship from table
        deleteResult = await SQLExecutor(`DELETE FROM TagAndUser WHERE tagID = ${tagID}`, []);


        // // 返回成功信息
        return res.status(200).json({
            message: `Tag "${tagName}" has been deleted from table, relationships have been removed`,
            updatedTaskCount: tasks.length
        });

    } catch (error) {
        console.error('Error deleting tag:', error);
        return res.status(500).json({ error: 'Database query error' });
    }
});


module.exports = router;
