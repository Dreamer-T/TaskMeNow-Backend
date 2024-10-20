const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, getUserByUseremail } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// user registration
router.post('/register_user', async (req, res) => {
    const { username, email, password, companyID } = req.body;  // 添加可选字段 'company'
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 判断是否提供了可选字段 'company'
        if (companyID) {
            // 如果提供了 'company' 字段，则将其插入数据库
            await conn.query('INSERT INTO Users (email, password, name, companyID) VALUES (?, ?, ?, ?)', [email, hashedPassword, username, companyID]);
        } else {
            // 如果没有提供 'company' 字段，则不插入该字段
            await conn.query('INSERT INTO Users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, username]);
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ error: 'Registration error' });
    } finally {
        await conn.release();
    }
});


// company registration
router.post('/register_company', async (req, res) => {
    const { companyname, adminPassword } = req.body;
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
        // encrypted
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        // insert
        await conn.query('INSERT INTO Companies (companyname, adminPassword) VALUES (?, ?)', [companyname, hashedPassword]);
        res.status(201).json({ message: 'Company registered successfully' });
    } catch (error) {
        console.error('Error during company registration:', error);
        res.status(500).json({ error: 'Registration error' });
    } finally {
        await conn.release();
    }
});

// user login
router.post('/login_user', async (req, res) => {
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
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' }); // 返回令牌和用户信息
        res.json({
            status: 'success',
            message: '登录成功',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role  // 返回用户角色或其他必要信息
            },
            expiresIn: 3600  // 告知客户端令牌的过期时间
        })
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login error' });
    }
});

module.exports = router;
