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

        // 使用 Promise.all 并行查询每个用户对应的所有 tagID 和 tagName
        const usersWithTags = await Promise.all(users.map(async (user) => {
            // 查询当前用户对应的所有 tagID
            const tagResults = await SQLExecutor('SELECT tagID FROM TagAndUser WHERE userID = ?;', [user.ID]);

            // 查询每个 tagID 对应的 tagName
            const tagNames = await Promise.all(tagResults.map(async (tag) => {
                const tagDetails = await SQLExecutor('SELECT tagName FROM TagTypes WHERE ID = ?;', [tag.tagID]);
                return tagDetails.length > 0 ? tagDetails[0].tagName : null; // 获取 tagName
            }));

            // 将所有的 tagNames 添加到 user 对象中
            user.tagNames = tagNames.filter(name => name !== null); // 过滤掉可能的 null 值
            return user; // 返回包含所有 tagNames 的用户数据
        }));

        // 返回合并后的用户数据
        res.status(200).json(usersWithTags);
    } catch (error) {
        console.error('Error fetching users and tags:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});



router.get('/id/tags/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const tags = await SQLExecutor('SELECT * FROM TagAndUser WHERE userID = ?;', [id]);

        // get all the tag id
        const tagIds = tags.map(tag => tag.tagID);
        // map id to generate a query
        const placeholders = tagIds.map(() => '?').join(',');
        const tagDetailsQuery = `SELECT tagName FROM TagTypes WHERE ID IN (${placeholders})`;
        // get the result
        const tagDetails = await SQLExecutor(tagDetailsQuery, tagIds);
        // use json to pass the result, which only contains tag name
        res.status(200).json(tagDetails);
    } catch (error) {
        console.error('Error fetching tag:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// set a user as a member of a tag
router.post('/setTag', authorizeRole('Manager'), async (req, res) => {
    const { tagName, userID } = req.body;  // get tagID and userID from body

    if (!userID) {
        res.status(400).json({ error: 'User info is required' });
    }
    if (!tagName) {
        res.status(400).json({ error: 'Tag info is required' });
    }
    try {
        // check the restriction first
        let result;
        // whether the tag exists
        result = await SQLExecutor('SELECT * FROM TagTypes WHERE tagName = ?', [tagName]);
        if (result.length === 0) {
            return res.status(400).json({ error: 'No such tag' });
        }
        // whether the user exists
        result = await SQLExecutor('SELECT * FROM Users WHERE ID = ?', [userID]);
        if (result.length === 0) {
            return res.status(400).json({ error: 'No such user' });
        }
        // whether the user has already have that tag
        result = await SQLExecutor('SELECT * FROM TagAndUser WHERE tagID = ? AND userID = ?', [tagName, userID]);
        if (result.length > 0) {
            return res.status(400).json({ error: 'User is already in the tag' });
        }
        // get the tag id via tagName
        result = await SQLExecutor('SELECT * FROM TagTypes WHERE tagName = ?', [tagName]);
        let tagID = result[0].ID;
        // add the user into the tag
        const insertResult = await SQLExecutor('INSERT INTO TagAndUser (tagID, userID) VALUES (?,?)', [tagID, userID]);
        res.status(200).json({ message: 'User is added into the tag successfully' });

    } catch (error) {
        console.error('Error setting user\'s tag: ', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

// delete a user from a tag
router.post('/deleteFromTag', authorizeRole('Manager'), async (req, res) => {
    const { tagID, userID } = req.body;  // get tagID and userID from body

    if (!userID) {
        res.status(400).json({ error: 'User info is required' });
    }
    if (!tagID) {
        res.status(400).json({ error: 'Tag info is required' });
    }
    try {
        // check whether user is in the tag
        const result = await SQLExecutor('SELECT * FROM TagAndUser WHERE tagID = ? AND userID = ?', [tagID, userID]);
        if (result.length === 0) {
            res.status(400).json({ error: 'User is not in the tag' });
        } else {
            // if not, add the user into the tag
            const deleteResult = await SQLExecutor('DELETE FROM TagAndUser WHERE tagID = ? AND userID = ?', [tagID, userID]);
            res.status(200).json({ message: 'User is deleted from the tag successfully' });
        }
    } catch (error) {
        console.error('Error setting user\'s tag: ', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;
