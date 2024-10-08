const express = require('express');
const app = express();

// 定义路由，响应根路径请求
app.get('/', (req, res) => {
    res.send('Hello World');
});

// 启动服务器
const PORT = process.env.PORT || 8080; // 使用环境变量 PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
