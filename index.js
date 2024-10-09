const mysql = require('promise-mysql');

// 创建连接池的函数
const createUnixSocketPool = async config => {
    return mysql.createPool({
        user: "root",
        password: "taskme103",
        database: "Company1",
        socketPath: "/cloudsql/taskmenow:australia-southeast2:main-database",
        ...config,
    });
};

// 示例使用
(async () => {
    try {
        // 创建连接池
        const pool = await createUnixSocketPool();

        // 执行查询
        const rows = await pool.query('SELECT * FROM Tasks');
        console.log(rows);

        // 关闭连接池
        await pool.end();
    } catch (error) {
        console.error('Database error:', error);
    }
})();
