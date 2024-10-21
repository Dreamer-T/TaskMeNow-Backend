const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, getUserByUseremail } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


// user registration
router.post('/register_user', async (req, res) => {
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
        const token = jwt.sign({ id: user.ID, email: user.email }, JWT_SECRET, { expiresIn: '1h' }); // 返回令牌和用户信息
        res.status(200).json({
            message: '登录成功',
            token,
            user: {
                id: user.ID,
                email: user.email,
                role: user.userRole  // 返回用户角色或其他必要信息
            },
            expiresIn: 3600  // 告知客户端令牌的过期时间
        })
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login error' });
    }
});

module.exports = router;
