const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, getUserByUseremail } = require('./db');


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const getGroupsFromDB = async (id) => {
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

        // JWT
        const token = jwt.sign({ id: user.ID, email: user.email, role: user.userRole }, JWT_SECRET, { expiresIn: '1h' }); // 返回令牌和用户信息
        const groupReult = getGroupsFromDB(user.ID);
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
                // 这里还需要修改，添加查询Group的操作，通过查询Groups来得到GroupID
                groups: groupReult.tagID
            },
            expiresIn: 3600  // 告知客户端令牌的过期时间
        })
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login error' });
    }
});

module.exports = router;
