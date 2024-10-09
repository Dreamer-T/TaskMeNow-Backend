const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based API for better async/await support
const multer = require('multer');
const app = express();
app.use(express.json());

// Configure MySQL database connection pool
const pool = mysql.createPool({
    host: '34.129.180.29', // Database host
    user: 'root',          // Replace with your MySQL username
    password: 'taskme103',  // Replace with your MySQL password
    database: 'Company1',
    waitForConnections: true,
    connectionLimit: 10, // Limit the number of simultaneous connections
    queueLimit: 0        // No limit on connection queue
});

// Multer configuration for image uploads
const upload = multer({ dest: 'uploads/' }); // Images will be saved to the uploads folder

// Connect to the MySQL database (optional, for logging)
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

// API routes

app.get('/', (req, res) => {
    res.send('Hello World from TaskMeNow');
});

// Get all Character records
app.get('/characters', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM Characters');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch characters', details: error.message });
    }
});

// Add a new Character
app.post('/characters', upload.single('avatar'), async (req, res) => {
    const { name, groupclass, level } = req.body;
    const avatar = req.file ? req.file.path : null;

    const query = 'INSERT INTO Characters (name, groupclass, level, avatar) VALUES (?, ?, ?, ?)';
    try {
        const [results] = await pool.query(query, [name, groupclass, level, avatar]);
        res.json({ id: results.insertId, name, groupclass, level, avatar });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create character', details: error.message });
    }
});

// Update a Character
app.put('/characters/:id', upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    const { name, groupclass, level } = req.body;
    const avatar = req.file ? req.file.path : null;

    const query = 'UPDATE Characters SET name = ?, groupclass = ?, level = ?, avatar = ? WHERE id = ?';
    try {
        const [results] = await pool.query(query, [name, groupclass, level, avatar, id]);
        if (results.affectedRows > 0) {
            res.json({ id, name, groupclass, level, avatar });
        } else {
            res.status(404).json({ message: 'Character not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update character', details: error.message });
    }
});

// Delete a Character
app.delete('/characters/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Characters WHERE id = ?';

    try {
        const [results] = await pool.query(query, [id]);
        res.json({ message: results.affectedRows > 0 ? 'Character deleted' : 'Character not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete character', details: error.message });
    }
});

// Get all Task records
app.get('/tasks', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM Tasks');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
    }
});

// Get a specific Task record by ID
app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await pool.query('SELECT * FROM Tasks WHERE id = ?', [id]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task', details: error.message });
    }
});

// Add a new Task
app.post('/tasks', upload.single('image'), async (req, res) => {
    const { description, groupclass, urgency, createdBy } = req.body;
    const image = req.file ? req.file.path : null;

    // Either description or image must be provided
    if (!description && !image) {
        return res.status(400).json({ message: 'Either description or image is required' });
    }

    const query = 'INSERT INTO Tasks (_description, image, groupclass, urgency, createdBy) VALUES (?, ?, ?, ?, ?)';
    try {
        const [results] = await pool.query(query, [description, image, groupclass, urgency, createdBy]);
        res.json({ id: results.insertId, description, image, groupclass, urgency, createdBy });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task', details: error.message });
    }
});

// Update a Task
app.put('/tasks/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { description, groupclass, urgency, finished } = req.body;
    const image = req.file ? req.file.path : null;

    const query = 'UPDATE Tasks SET _description = ?, groupclass = ?, urgency = ?, image = ?, finished = ? WHERE id = ?';
    try {
        const [results] = await pool.query(query, [description, groupclass, urgency, image, finished, id]);
        if (results.affectedRows > 0) {
            res.json({ id, description, groupclass, urgency, image, finished });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task', details: error.message });
    }
});

// Delete a Task
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Tasks WHERE id = ?';

    try {
        const [results] = await pool.query(query, [id]);
        res.json({ message: results.affectedRows > 0 ? 'Task deleted' : 'Task not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task', details: error.message });
    }
});

// Start the server
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
