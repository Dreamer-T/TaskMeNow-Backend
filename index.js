const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
app.use(express.json());

// Configure MySQL database connection
const connection = mysql.createConnection({
    host: '34.129.180.29', // Database host
    user: 'root',          // Replace with your MySQL username
    password: 'taskme103',  // Replace with your MySQL password
    database: 'Company1'
});

// Multer configuration for image uploads
const upload = multer({ dest: 'uploads/' }); // Images will be saved to the uploads folder

// Connect to the MySQL database
connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// API routes

app.get('/', (req, res) => {
    res.send('Hello World from TaskMeNow');
});

// Get all Character records
app.get('/characters', (req, res) => {
    connection.query('SELECT * FROM Characters', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch characters', details: error.message });
        }
        res.json(results);
    });
});

// Add a new Character
app.post('/characters', upload.single('avatar'), (req, res) => {
    const { name, groupclass, level } = req.body;
    const avatar = req.file ? req.file.path : null;

    const query = 'INSERT INTO Character (name, groupclass, level, avatar) VALUES (?, ?, ?, ?)';
    connection.query(query, [name, groupclass, level, avatar], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to create character', details: error.message });
        }
        res.json({ id: results.insertId, name, groupclass, level, avatar });
    });
});

// Update a Character
app.put('/characters/:id', upload.single('avatar'), (req, res) => {
    const { id } = req.params;
    const { name, groupclass, level } = req.body;
    const avatar = req.file ? req.file.path : null;

    const query = 'UPDATE Characters SET name = ?, groupclass = ?, level = ?, avatar = ? WHERE id = ?';
    connection.query(query, [name, groupclass, level, avatar, id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to update character', details: error.message });
        }
        if (results.affectedRows > 0) {
            res.json({ id, name, groupclass, level, avatar });
        } else {
            res.status(404).json({ message: 'Character not found' });
        }
    });
});

// Delete a Character
app.delete('/characters/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Characters WHERE id = ?';

    connection.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to delete character', details: error.message });
        }
        res.json({ message: results.affectedRows > 0 ? 'Character deleted' : 'Character not found' });
    });
});

// Get all Task records
app.get('/tasks', (req, res) => {
    connection.query('SELECT * FROM Tasks', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
        }
        res.json(results);
    });
});

// Get a specific Task record by ID
app.get('/tasks/:id', (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM Tasks WHERE id = ?', [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch task', details: error.message });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    });
});

// Add a new Task
app.post('/tasks', upload.single('image'), (req, res) => {
    const { description, groupclass, urgency, createdBy } = req.body;
    const image = req.file ? req.file.path : null;

    // Either description or image must be provided
    if (!description && !image) {
        return res.status(400).json({ message: 'Either description or image is required' });
    }

    const query = 'INSERT INTO Tasks (_description, image, groupclass, urgency, createdBy) VALUES (?, ?, ?, ?, ?)';
    connection.query(query, [description, image, groupclass, urgency, createdBy], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to create task', details: error.message });
        }
        res.json({ id: results.insertId, description, image, groupclass, urgency, createdBy });
    });
});

// Update a Task
app.put('/tasks/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { description, groupclass, urgency, finished } = req.body;
    const image = req.file ? req.file.path : null;

    const query = 'UPDATE Tasks SET _description = ?, groupclass = ?, urgency = ?, image = ?, finished = ? WHERE id = ?';
    connection.query(query, [description, groupclass, urgency, image, finished, id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to update task', details: error.message });
        }
        if (results.affectedRows > 0) {
            res.json({ id, description, groupclass, urgency, image, finished });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    });
});

// Delete a Task
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Tasks WHERE id = ?';

    connection.query(query, [id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to delete task', details: error.message });
        }
        res.json({ message: results.affectedRows > 0 ? 'Task deleted' : 'Task not found' });
    });
});

// Start the server
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
