const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql2');

// 配置 MySQL 连接
const db = mysql.createConnection({
    host: '34.129.180.29',  // 使用你的数据库hostname
    user: 'root',            // 替换为你的MySQL用户名
    password: 'taskme103',    // 替换为你的MySQL密码
    database: 'Character' // 替换为你的数据库名称
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

// 定义路由，响应根路径请求
app.get('/', (req, res) => {
    res.send('Hello World');
});

// 启动服务器
const PORT = process.env.PORT || 8080; // 使用环境变量 PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
