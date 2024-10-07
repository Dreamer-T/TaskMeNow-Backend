const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// 模拟枚举类型，规定任务的类别
const TaskCategory = {
    WORK: 'Work',
    PERSONAL: 'Personal',
    HOBBY: 'Hobby',
    OTHER: 'Other'
};

// 假数据存储（通常会使用数据库）
let tasks = [];
let users = [];
let taskId = 1; // 自动递增的唯一编号

// ========== Task APIs ========== //

// 获取所有tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// 根据ID获取单个task
app.get('/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).send('Task not found');
    res.json(task);
});

// 创建task
app.post('/tasks', (req, res) => {
    console.log('Received request:', req.body); // 打印请求体
    const { description, image, urgency, category, creatorId } = req.body;

    // 验证请求数据
    // if (!description && !image) return res.status(400).send('Either description or image must be provided.');
    // if (!urgency || urgency < 1 || urgency > 4) return res.status(400).send('Urgency must be between 1 and 4.');
    // if (!Object.values(TaskCategory).includes(category)) return res.status(400).send('Invalid task category.');
    // const creator = users.find(u => u.id === creatorId);
    // if (!creator) return res.status(400).send('Creator not found.');

    // 创建新任务
    const newTask = {
        id: taskId++, // 自动生成唯一ID
        description,
        image,
        urgency,
        category,
        createdAt: new Date().toISOString(), // 自动生成创建时间
        creator: {
            id: creator.id,
            name: creator.name
        }
    };
    console(ncewTask.id);
    tasks.push(newTask);
    res.status(201).json(newTask);
});
app.post('/tasks', (req, res) => {
    console.log('Received request:', req.body); // 打印请求体
    // 其他代码...
});

// 更新task
app.put('/tasks/:id', (req, res) => {
    console.log(req)
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).send('Task not found');

    const { description, image, urgency, category } = req.body;

    // 验证请求数据
    if (!description && !image) return res.status(400).send('Either description or image must be provided.');
    if (!urgency || urgency < 1 || urgency > 4) return res.status(400).send('Urgency must be between 1 and 4.');
    if (!Object.values(TaskCategory).includes(category)) return res.status(400).send('Invalid task category.');

    // 更新任务
    task.description = description;
    task.image = image;
    task.urgency = urgency;
    task.category = category;

    res.json(task);
});

// 删除task
app.delete('/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (taskIndex === -1) return res.status(404).send('Task not found');

    tasks.splice(taskIndex, 1);
    res.status(204).send();
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
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
