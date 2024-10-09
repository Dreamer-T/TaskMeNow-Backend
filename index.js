const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const app = express();
app.use(express.json());

// 配置MySQL数据库连接
const sequelize = new Sequelize('Company1', 'root', 'taskme103', {
    host: '34.129.180.29', // 数据库host
    user: 'root',       // 替换为你的MySQL用户名
    password: 'taskme103', // 替换为你的MySQL密码
    database: 'Company1',
    dialect: 'mysql'
});

// 定义Character模型
const Character = sequelize.define('Character', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    groupclass: {
        type: DataTypes.ENUM('group1', 'group2', 'group3'), // 改为普通枚举，而非数组
        allowNull: false
    },
    level: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// 定义Task模型
const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _description: {
        type: DataTypes.STRING,
        allowNull: true // 必须二选一
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    groupclass: {
        type: DataTypes.ENUM('group1', 'group2', 'group3'), // 改为普通枚举
        allowNull: false
    },
    urgency: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false
    },
    time: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    finished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// 同步数据库模型
sequelize.sync();

// Multer 配置，用于上传图片
const upload = multer({ dest: 'uploads/' }); // 图片将被保存到uploads文件夹

// 连接数据库
sequelize.authenticate().then(() => {
    console.log('数据库连接成功');
}).catch(err => {
    console.log('数据库连接失败:', err);
});

// API 路由

app.get('/', async (req, res) => {
    res.send('Hello World from TaskMeNow');
});
// 获取所有Character记录
app.get('/characters', async (req, res) => {
    const characters = await Character.findAll();
    res.json(characters);
});

// 新增Character
app.post('/characters', upload.single('avatar'), async (req, res) => {
    const { name, group, level } = req.body;
    const avatar = req.file ? req.file.path : null;

    const newCharacter = await Character.create({ name, group, level, avatar });
    res.json(newCharacter);
});

// 修改Character
app.put('/characters/:id', upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    const { name, group, level } = req.body;
    const avatar = req.file ? req.file.path : null;

    const character = await Character.findByPk(id);
    if (character) {
        character.name = name;
        character.groupclass = group;
        character.level = level;
        character.avatar = avatar;
        await character.save();
        res.json(character);
    } else {
        res.status(404).json({ message: 'Character not found' });
    }
});

// 删除Character
app.delete('/characters/:id', async (req, res) => {
    const { id } = req.params;
    const result = await Character.destroy({ where: { id } });
    res.json({ message: result ? 'Character deleted' : 'Character not found' });
});

// 获取所有Task记录
app.get('/tasks', async (req, res) => {
    const tasks = await Task.findAll();
    res.json(tasks);
});

// 获取特定ID的Task记录
app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await Task.findByPk(id);
        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// 新增Task
app.post('/tasks', upload.single('image'), async (req, res) => {
    const { description, group, urgency, createdBy } = req.body;
    const image = req.file ? req.file.path : null;

    // 必须提供description或image其中一个
    if (!description && !image) {
        return res.status(400).json({ message: 'Either description or image is required' });
    }

    const newTask = await Task.create({ description, image, group, urgency, createdBy });
    res.json(newTask);
});

// 修改Task
app.put('/tasks/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { description, group, urgency, finished } = req.body;
    const image = req.file ? req.file.path : null;

    const task = await Task.findByPk(id);
    if (task) {
        task._description = description;
        task.groupclass = group;
        task.urgency = urgency;
        task.image = image;
        task.finished = finished;
        await task.save();
        res.json(task);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
});

// 删除Task
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const result = await Task.destroy({ where: { id } });
    res.json({ message: result ? 'Task deleted' : 'Task not found' });
});

// 启动服务器
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
