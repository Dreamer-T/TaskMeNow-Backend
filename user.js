const express = require('express');
const { getPool } = require('./db');
const { authorizeRole } = require('./authMiddleware');
const bcrypt = require('bcrypt');

const router = express.Router();

const SQLExecutor = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        console.log(query);
        const [result] = await conn.query(query, params);
        // console.log(result);
        return result;
    } finally {
        await conn.release();
    }
};

// user registration, only Manager can register a new user
router.post('/register_user', authorizeRole('Manager'), async (req, res) => {
    const { username, email, password, role } = req.body;
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        await conn.query('INSERT INTO Users (email, password, userName, userRole) VALUES (?, ?, ?, ?)', [email, hashedPassword, username, role]);

        res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ Error: error });
    } finally {
        await conn.release();
    }
});

// API for user to get all users info, for assignment use
router.get('/allUsers', authorizeRole('Staff'), async (req, res) => {
    try {
        // 查询所有用户
        const users = await SQLExecutor('SELECT ID, userName, email, userRole, avatar, createdTime FROM Users;', []);

        // 使用 Promise.all 并行查询每个用户对应的所有 groupID 和 groupName
        const usersWithGroups = await Promise.all(users.map(async (user) => {
            // 查询当前用户对应的所有 groupID
            const groupResults = await SQLExecutor('SELECT groupID FROM GroupAndUser WHERE userID = ?;', [user.ID]);

            // 查询每个 groupID 对应的 groupName
            const groupNames = await Promise.all(groupResults.map(async (group) => {
                const groupDetails = await SQLExecutor('SELECT groupName FROM GroupTypes WHERE ID = ?;', [group.groupID]);
                return groupDetails.length > 0 ? groupDetails[0].groupName : null; // 获取 groupName
            }));

            // 将所有的 groupNames 添加到 user 对象中
            user.groupNames = groupNames.filter(name => name !== null); // 过滤掉可能的 null 值
            return user; // 返回包含所有 groupNames 的用户数据
        }));

        // 返回合并后的用户数据
        res.status(200).json(usersWithGroups);
    } catch (error) {
        console.error('Error fetching users and groups:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});



router.get('/id/groups/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const groups = await SQLExecutor('SELECT * FROM GroupAndUser WHERE userID = ?;', [id]);

        // get all the group id
        const groupIds = groups.map(group => group.groupID);
        // map id to generate a query
        const placeholders = groupIds.map(() => '?').join(',');
        const groupDetailsQuery = `SELECT groupName FROM GroupTypes WHERE ID IN (${placeholders})`;
        // get the result
        const groupDetails = await SQLExecutor(groupDetailsQuery, groupIds);
        // use json to pass the result, which only contains group name
        res.status(200).json(groupDetails);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// set a user as a member of a group
router.post('/setGroup', authorizeRole('Manager'), async (req, res) => {
    const { groupID, userID } = req.body;  // get groupID and userID from body

    if (!userID) {
        res.status(400).json({ error: 'User info is required' });
    }
    if (!groupID) {
        res.status(400).json({ error: 'Group info is required' });
    }
    try {
        // check whether user is in the group
        let result = await SQLExecutor('SELECT * FROM GroupAndUser WHERE groupID = ? AND userID = ?', [groupID, userID]);
        if (result.length > 0) {
            return res.status(400).json({ error: 'User is already in the group' });
        }
        result = await SQLExecutor('SELECT * FROM GroupTypes WHERE ID = ?', [groupID]);
        if (result.length === 0) {
            return res.status(400).json({ error: 'No such group' });
        }
        result = await SQLExecutor('SELECT * FROM Users WHERE ID = ?', [userID]);
        if (result.length === 0) {
            return res.status(400).json({ error: 'No such user' });
        }
        // if not, add the user into the group
        const insertResult = await SQLExecutor('INSERT INTO GroupAndUser (groupID, userID) VALUES (?,?)', [groupID, userID]);
        res.status(200).json({ message: 'User is added into the group successfully' });

    } catch (error) {
        console.error('Error setting user\'s group: ', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// delete a user from a group
router.post('/deleteFromGroup', authorizeRole('Manager'), async (req, res) => {
    const { groupID, userID } = req.body;  // get groupID and userID from body

    if (!userID) {
        res.status(400).json({ error: 'User info is required' });
    }
    if (!groupID) {
        res.status(400).json({ error: 'Group info is required' });
    }
    try {
        // check whether user is in the group
        const result = await SQLExecutor('SELECT * FROM GroupAndUser WHERE groupID = ? AND userID = ?', [groupID, userID]);
        if (result.length === 0) {
            res.status(400).json({ error: 'User is not in the group' });
        } else {
            // if not, add the user into the group
            const deleteResult = await SQLExecutor('DELETE FROM GroupAndUser WHERE groupID = ? AND userID = ?', [groupID, userID]);
            res.status(200).json({ message: 'User is deleted from the group successfully' });
        }
    } catch (error) {
        console.error('Error setting user\'s group: ', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;
