const express = require('express');
const { getPool } = require('./db');
const { authorizeRole } = require('./authMiddleware');

const router = express.Router();

const SQLExecutor = async (query, params = []) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        console.log(query);
        const [result] = await conn.query(query, params);
        return result;
    } finally {
        await conn.release();
    }
};


router.get('/id/:id', authorizeRole('Staff'), async (req, res) => {
    const id = req.params.id;
    try {
        const task = await SQLExecutor('SELECT * FROM Tasks WHERE id = ?;', [id]);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

router.get('/assignedTo/:assignedTo', authorizeRole('Staff'), async (req, res) => {
    const assignedTo = req.params.assignedTo;
    try {
        // get all tasks
        const tasks = await SQLExecutor('SELECT * FROM Tasks WHERE assignedTo = ?', [assignedTo]);

        // get creatorName of each task
        const tasksWithCreator = await Promise.all(tasks.map(async (task) => {
            // get userName via Users according to createdBy
            const creatorResult = await SQLExecutor('SELECT userName FROM Users WHERE ID = ?', [task.createdBy]);
            // include creatorName in json
            task.creatorName = creatorResult.length > 0 ? creatorResult[0].userName : null;
            return task;
        }));

        res.status(200).json(tasksWithCreator);
    } catch (error) {
        console.error('Error fetching tasks and creator:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});



// API of create a task, at least to be a staff
router.post('/createTask', authorizeRole('Staff'), async (req, res) => {
    const { taskDescription, taskImage, assignedTo, createdBy, urgencyLevel, tags } = req.body;

    // check those are necessary
    if (!taskDescription || !assignedTo || !createdBy || !urgencyLevel || !tags) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        var jsonTagIDs = JSON.stringify(tags);
        const query = 'INSERT INTO Tasks (taskDescription, taskImage, assignedTo, createdBy, urgencyLevel, tags) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [taskDescription, taskImage || null, assignedTo, createdBy, urgencyLevel, jsonTagIDs];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


// API of update a task, at least to be a staff
router.post('/updateTask', authorizeRole('Staff'), async (req, res) => {
    const { taskID, taskDescription, taskImage, urgencyLevel, tags } = req.body;

    // check those are necessary
    if (!taskID || !taskDescription || !urgencyLevel || !tags) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        var jsonTagIDs = JSON.stringify(tags);
        const query = 'UPDATE Tasks SET taskDescription = ?, taskImage = ?, urgencyLevel = ?, tags = ? WHERE ID = ?';
        const values = [taskDescription, taskImage || null, urgencyLevel, jsonTagIDs, taskID];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task updated successfully', affectedRowNumber: result.affectedRows });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// API of reassign a task, at least to be a staff
router.post('/reassignTask', authorizeRole('Supervisor'), async (req, res) => {
    const { taskID, assignedTo } = req.body;

    // check those are necessary
    if (!taskID || !assignedTo) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const query = 'UPDATE Tasks SET assignedTo = ? WHERE ID = ?';
        const values = [assignedTo, taskID];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task reassigned successfully', affectedRowNumber: result.affectedRows });
    } catch (error) {
        console.error('Error reassigning task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// API of complete task, at least to be a staff
router.post('/completeTask', authorizeRole('Staff'), async (req, res) => {
    const { taskID } = req.body;

    // check those are necessary
    if (!taskID) {
        return res.status(400).json({ error: 'Missing taskID' });
    }

    try {
        const query = 'UPDATE Tasks SET isDone = \'1\' WHERE ID = ?';
        const values = [taskID];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task compelte successfully' });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// API for supervisor and manager to get all tasks
router.get('/allTask', authorizeRole('Supervisor'), async (req, res) => {
    try {
        const task = await SQLExecutor('SELECT * FROM Tasks;', []);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});



module.exports = router;
