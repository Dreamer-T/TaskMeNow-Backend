// auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, getUserByUsername } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 注册
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
        // 检查用户名是否已存在
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 将用户信息插入数据库
        await conn.query('INSERT INTO Users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ error: 'Registration error' });
    } finally {
        await conn.release();
    }
});

// 登录
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // 比较密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // 生成 JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login error' });
    }
});

module.exports = router;
