const express = require('express');
const { SQLExecutor } = require('./db');
const { authorizeRole } = require('./authMiddleware');

const router = express.Router();

// API for getting all the tags
router.get('/getGroups', authorizeRole('Supervisor'), async (req, res) => {
    try {
        const result = await SQLExecutor('SELECT * FROM GroupUsersView');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// API for creating a group
router.post('/createGroup', authorizeRole('Supervisor'), async (req, res) => {
    const { groupName } = req.body;

    if (!groupName) {
        return res.status(400).json({ error: 'Missing groupName' });
    }

    try {
        // 开启事务
        await SQLExecutor('START TRANSACTION');

        // 插入 Usergroups，如果重复则触发错误
        const result = await SQLExecutor('INSERT INTO Usergroups (groupName) VALUES (?)', [groupName]);

        // 直接从 INSERT 结果获取 insertId
        const groupID = result.insertId;

        await SQLExecutor('INSERT INTO UserinGroup (groupID, userID) VALUES (?, 1)', [groupID]);

        await SQLExecutor('COMMIT');
        res.status(200).json({ "groupID": groupID, message: 'Group created successfully' });
    } catch (error) {
        await SQLExecutor('ROLLBACK'); // 事务回滚

        console.error('Error creating group:', error);

        // 处理重复名称错误 (MySQL 错误代码 1062)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Group name already exists' });
        }

        res.status(500).json({ error: 'Database insert error' });
    }
});

// rename group API
router.put('/renameGroup', authorizeRole('Supervisor'), async (req, res) => {
    const { groupID, newGroupName } = req.body;

    if (!groupID || !newGroupName) {
        return res.status(400).json({ error: 'Missing groupID or newGroupName' });
    }

    try {
        // 检查 groupID 是否存在
        const checkGroup = await SQLExecutor('SELECT * FROM Usergroups WHERE idGroup = ?', [groupID]);
        if (checkGroup.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // 更新 groupName
        await SQLExecutor('UPDATE Usergroups SET groupName = ? WHERE idGroup = ?', [newGroupName, groupID]);

        res.status(200).json({ message: 'Group renamed successfully' });
    } catch (error) {
        console.error('Error renaming group:', error);
        res.status(500).json({ error: 'Database update error' });
    }
});

// API for deleting a group
router.delete('/deleteGroup', authorizeRole('Supervisor'), async (req, res) => {
    const { groupID } = req.body;

    if (!groupID) {
        return res.status(400).json({ error: 'Missing groupID' });
    }

    try {
        // 检查 groupID 是否存在
        const checkGroup = await SQLExecutor('SELECT * FROM Usergroups WHERE idGroup = ?', [groupID]);
        if (checkGroup.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // 删除 group
        await SQLExecutor('DELETE FROM Usergroups WHERE idGroup = ?', [groupID]);

        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Database delete error' });
    }
});

// API for adding a user to a group
router.post('/addUserToGroup', authorizeRole('Supervisor'), async (req, res) => {
    const { groupID, userID } = req.body;
    try {
        // 检查 groupID 是否存在
        const checkGroup = await SQLExecutor('SELECT * FROM Usergroups WHERE idGroup = ?', [groupID]);
        if (checkGroup.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // 检查 userID 是否存在
        const checkUser = await SQLExecutor('SELECT * FROM Users WHERE ID = ?', [userID]);
        if (checkUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 检查 userID 是否已经在 groupID 中
        const checkUserInGroup = await SQLExecutor('SELECT * FROM UserinGroup WHERE groupID = ? AND userID = ?', [groupID, userID]);
        if (checkUserInGroup.length > 0) {
            return res.status(400).json({ error: 'User already in group' });
        }

        // 添加 user 到 group
        await SQLExecutor('INSERT INTO UserinGroup (groupID, userID) VALUES (?, ?)', [groupID, userID]);

        res.status(200).json({ message: 'User added to group successfully' });
    } catch (error) {
        console.error('Error adding user to group:', error);
        res.status(500).json({ error: 'Database insert error' });
    }
});

// API for deleting a user from a group
router.delete('/removeUserFromGroup', authorizeRole('Supervisor'), async (req, res) => {
    const { groupID, userID } = req.body;
    try {
        // 检查 groupID 是否存在
        const checkGroup = await SQLExecutor('SELECT * FROM Usergroups WHERE idGroup = ?', [groupID]);
        if (checkGroup.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // 检查 userID 是否存在
        const checkUser = await SQLExecutor('SELECT * FROM Users WHERE ID = ?', [userID]);
        if (checkUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 检查 userID 是否在 groupID 中
        const checkUserInGroup = await SQLExecutor('SELECT * FROM UserinGroup WHERE groupID = ? AND userID = ?', [groupID, userID]);
        if (checkUserInGroup.length === 0) {
            return res.status(404).json({ error: 'User not in group' });
        }

        // 从 group 中移除 user
        await SQLExecutor('DELETE FROM UserinGroup WHERE groupID = ? AND userID = ?', [groupID, userID]);

        res.status(200).json({ message: 'User removed from group successfully' });
    } catch (error) {
        console.error('Error removing user from group:', error);
        res.status(500).json({ error: 'Database delete error' });
    }
})

module.exports = router;