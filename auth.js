const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, getUserByUseremail } = require('./db');


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const getTagsFromDB = async (id) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query("SELECT * FROM TagAndUser WHERE userID = ?;", id);
        console.log(result);
        return result;
    } finally {
        await conn.release();
    }
};

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

// user login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await getUserByUseremail(email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // compare password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const loginTimesResult = await SQLExecutor('SELECT loginTimes FROM Users WHERE ID = ?', [user.ID]);
        const loginTimes = loginTimesResult[0].loginTimes;
        SQLExecutor('UPDATE Users SET loginTimes = ? WHERE ID = ?', [loginTimes + 1, user.ID]);
        // JWT
        const token = jwt.sign({ id: user.ID, email: user.email, role: user.userRole, 'loginTimes': loginTimes + 1 }, JWT_SECRET, { expiresIn: '7d' }); // 返回令牌和用户信息
        const tagReult = getTagsFromDB(user.ID);
        res.status(200).json({
            message: '登录成功',
            user: {
                id: user.ID,
                userName: user.userName,
                email: user.email,
                role: user.userRole, // 返回用户角色或其他必要信息
                avatar: user.avatar,
                createdTime: user.createdTime,
                'token': token,
                // 这里还需要修改，添加查询Tag的操作，通过查询Tags来得到TagID
                tags: tagReult.tagID,
                'loginTimes': loginTimes + 1
            },
            expiresIn: 7 * 24 * 60 * 60
        })
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login error' });
    }
});
// Change Password API
router.post('/changePassword', async (req, res) => {
    const { userID, newPassword } = req.body;
    const token = req.headers['Authorization']?.split(' ')[1]; // 从请求头获取 JWT
    try {
        // Validate input
        if (!userID || !newPassword) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // 验证 JWT 并提取用户 ID
        if (token.length === 0) {
            return res.status(401).json({ error: 'Unauthorized. Token is missing.' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const tokenID = decoded.id; // 从 JWT 中提取用户 ID
        if (parseInt(tokenID) !== parseInt(userID)) {
            return res.status(401).json({ error: 'Unauthorized. Token is invalid.' });
        }
        // Fetch the user's current password hash from the database
        const user = await SQLExecutor('SELECT password FROM Users WHERE ID = ?', [userID]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }


        // // Ensure the new password meets complexity requirements
        // if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        //     return res.status(400).json({
        //         error: 'New password must be at least 8 characters long, contain an uppercase letter, and a number.',
        //     });
        // }

        // Hash the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await SQLExecutor('UPDATE Users SET password = ? WHERE ID = ?', [newHashedPassword, userID]);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Error changing password.' });
    }
});
module.exports = router;
