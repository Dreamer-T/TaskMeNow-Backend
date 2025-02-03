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
        await SQLExecutor('UPDATE Usergroups SET groupName = ? WHERE groupID = ?', [newGroupName, groupID]);

        res.status(200).json({ message: 'Group renamed successfully' });
    } catch (error) {
        console.error('Error renaming group:', error);
        res.status(500).json({ error: 'Database update error' });
    }
});

module.exports = router;