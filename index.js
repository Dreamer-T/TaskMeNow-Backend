const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const connector = new Connector();

const app = express();
const port = 3000;
const secret = 'your_jwt_secret'; // JWT 密钥，用于生成令牌

// 中间件来解析 JSON 请求体
app.use(express.json());

// 连接到 Cloud SQL 的函数
async function connectToDatabase() {
    const clientOpts = await connector.getOptions({
        instanceConnectionName: 'taskmenow:australia-southeast2:main-database',
        ipType: 'PUBLIC',
    });

    const connection = await mysql.createConnection({
        ...clientOpts,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'User',
    });

    return connection;
}

// 用户注册
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        // 连接数据库
        const connection = await connectToDatabase();

        // 检查用户是否已经存在
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length > 0) {
            return res.status(400).send('User already exists');
        }

        // 对密码进行哈希处理
        const hashedPassword = await bcrypt.hash(password, 10);

        // 将用户信息存入数据库
        await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// 用户登录
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        // 连接数据库
        const connection = await connectToDatabase();

        // 查找用户
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(400).send('Invalid username or password');
        }

        const user = rows[0];

        // 检查密码是否正确
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).send('Invalid username or password');
        }

        // 创建 JWT 令牌
        const token = jwt.sign({ username: user.username }, secret, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// 受保护的路由（只有登录后才能访问）
app.get('/protected', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send('Token is required');
    }

    try {
        const decoded = jwt.verify(token, secret);
        res.json({ message: 'Welcome to the protected route!', user: decoded });
    } catch (error) {
        res.status(401).send('Invalid token');
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
