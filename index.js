const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql2');

// 配置 MySQL 连接
const db = mysql.createConnection({
    host: '34.129.180.29',  // 使用你的数据库hostname
    user: 'root',            // 替换为你的MySQL用户名
    password: 'taskme103',    // 替换为你的MySQL密码
    database: 'TaskMeNow' // 替换为你的数据库名称
});

// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.use(bodyParser.json());

// 模拟枚举类型，规定任务的类别
const TaskCategory = {
    WORK: 'Work',
    PERSONAL: 'Personal',
    HOBBY: 'Hobby',
    OTHER: 'Other'
};

// 假数据存储（通常会使用数据库）
let users = [];

// ========== Task APIs ========== //

// 获取所有tasks
app.get('/tasks', (req, res) => {
    const query = 'SELECT * FROM tasks';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});

// 根据ID获取单个task
app.get('/tasks/:id', (req, res) => {
    const query = 'SELECT * FROM tasks WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (results.length === 0) return res.status(404).send('Task not found');
        res.json(results[0]);
    });
});

// 创建task
app.post('/tasks', (req, res) => {
    const { description, image, urgency, category, creatorId } = req.body;

    // 验证数据
    if (!description && !image) return res.status(400).send('Either description or image must be provided.');
    if (!urgency || urgency < 1 || urgency > 4) return res.status(400).send('Urgency must be between 1 and 4.');
    if (!Object.values(TaskCategory).includes(category)) return res.status(400).send('Invalid task category.');

    const query = 'INSERT INTO tasks (description, image, urgency, category, creator_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [description, image, urgency, category, creatorId], (err, result) => {
        if (err) return res.status(500).send(err.message);

        const newTask = {
            id: result.insertId, // MySQL会返回自增的ID
            description,
            image,
            urgency,
            category,
            createdAt: new Date(),
            creatorId
        };
        res.status(201).json(newTask);
    });
});

// 更新task
app.put('/tasks/:id', (req, res) => {
    const { description, image, urgency, category } = req.body;
    const query = 'UPDATE tasks SET description = ?, image = ?, urgency = ?, category = ? WHERE id = ?';

    db.query(query, [description, image, urgency, category, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send('Task not found');

        res.json({ message: 'Task updated successfully' });
    });
});

// 删除task
app.delete('/tasks/:id', (req, res) => {
    const query = 'DELETE FROM tasks WHERE id = ?';

    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err.message);
        if (result.affectedRows === 0) return res.status(404).send('Task not found');

        res.status(204).send();
    });
});

// ========== User APIs ========== //

// 获取所有users
app.get('/users', (req, res) => {
    res.json(users);
});

// 根据ID获取单个user
app.get('/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).send('User not found');
    res.json(user);
});

// 创建user
app.post('/users', (req, res) => {
    const user = {
        id: users.length + 1,
        name: req.body.name,
        email: req.body.email
    };
    users.push(user);
    res.status(201).json(user);
});

// 更新user
app.put('/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).send('User not found');

    user.name = req.body.name;
    user.email = req.body.email;
    res.json(user);
});

// 删除user
app.delete('/users/:id', (req, res) => {
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) return res.status(404).send('User not found');

    users.splice(userIndex, 1);
    res.status(204).send();
});

// 启动服务器
const PORT = process.env.PORT || 3000; // 使用环境变量 PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
