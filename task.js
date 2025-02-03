const express = require('express');
const { SQLExecutor } = require('./db');
const { authorizeRole } = require('./authMiddleware');

const router = express.Router();

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


// API of create a task, at least to be a staff, tags have to contain "New" tag
router.post('/createTask', authorizeRole('Staff'), async (req, res) => {
    const { taskDescription, taskImage, assignedTo, assigneeName, createdBy, creatorName, urgencyLevel, tags } = req.body;

    // check those are necessary
    if (!taskDescription || !assignedTo || !assigneeName || !createdBy || !urgencyLevel || !tags) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        var jsonTagIDs = JSON.stringify({ "ID": tags });
        const query = 'INSERT INTO Tasks (taskDescription, taskImage, assignedTo, assigneeName, createdBy, creatorName, urgencyLevel, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [taskDescription, taskImage || null, assignedTo, assigneeName, createdBy, creatorName, urgencyLevel, jsonTagIDs];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task created successfully', taskId: result.insertId });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// API of view a task, once it viewed, the task is no longer a new task, that is to say, remove "new" tag in tags field
router.post('/viewTask', authorizeRole('Staff'), async (req, res) => {
    const { taskID, viewedByID, viewedByName } = req.body;

    if (!taskID) {
        return res.status(400).json({ error: 'Task ID is required' });
    }

    try {
        const modifiedTime = new Date();
        await SQLExecutor(`UPDATE Tasks SET isViewed = \'1\' WHERE ID = ?`, [taskID])
        const taskRecord = await SQLExecutor(`SELECT isViewed FROM Tasks WHERE ID = ?`, [taskID])
        if (taskRecord[0].isViewed === '1') {
            return res.status(200).json({ message: 'Task has been already viewed' });
        }
        else {
            await SQLExecutor(`
            INSERT INTO TaskHistory (taskID, fieldModified, previousValue, newValue, modifiedByID, modifiedByName, modifiedTime)
            VALUES(?, ?, ?, ?, ?, ?, ?) `, [taskID, 'isViewed', '0', '1', viewedByID, viewedByName, modifiedTime])
        }
        res.status(200).json({ message: 'Task viewed successfully' });
    } catch (error) {
        console.error('Error view task:', error);
        res.status(500).json({ error: 'Database update error' });
    }
});

// Something wrong, need to rethink
// API of update a task, at least to be a staff
router.put('/updateTask', authorizeRole('Staff'), async (req, res) => {
    const { taskID, updates, modifiedByID, modifiedByName } = req.body; // updates 是一个数组

    if (!updates || updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    const modifiedTime = new Date();

    try {
        // 获取当前任务状态
        const [task] = await SQLExecutor('SELECT * FROM Tasks WHERE ID = ?', [taskID]);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // 遍历 updates 并检查差异
        const historyEntries = [];
        const updateFields = [];
        const updateValues = [];
        for (const update of updates) {
            const [field, newValue] = Object.entries(update)[0]; // 获取 key-value 对
            const oldValue = task[field];
            if (oldValue != newValue) {
                // 如果字段有变化，记录到历史表
                // console.log("field:" + field);
                if (field === "tags") {
                    var newTags = JSON.stringify({ "ID": newValue });
                    historyEntries.push([
                        taskID, field, JSON.stringify(oldValue), newTags, modifiedByID, modifiedByName, modifiedTime
                    ]);
                    // 更新任务表
                    updateFields.push(`${field} = ?`);
                    updateValues.push(newTags);
                }
                else {
                    historyEntries.push([
                        taskID, field, oldValue, newValue, modifiedByID, modifiedByName, modifiedTime
                    ]);
                    // 更新任务表
                    updateFields.push(`${field} = ?`);
                    updateValues.push(newValue);
                }
            }
        }

        if (historyEntries.length === 0) {
            return res.status(200).json({ message: 'No changes detected' });
        }

        // 更新任务表
        const updateQuery = `
            UPDATE Tasks SET 
                ${updateFields.join(', ')},
                lastModifiedTime = ?
            WHERE ID = ?`;
        await SQLExecutor(updateQuery, [...updateValues, modifiedTime, taskID]);

        // 插入修改记录到 TaskHistory
        const historyQuery = `
            INSERT INTO TaskHistory (taskID, fieldModified, previousValue, newValue, modifiedByID, modifiedByName, modifiedTime)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        for (const entry of historyEntries) {
            await SQLExecutor(historyQuery, entry);
        }
        await SQLExecutor(`UPDATE Tasks SET isViewed = \'0\' WHERE ID = ?`, [taskID])

        res.status(200).json({ message: 'Task updated successfully', history: historyEntries });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


// API of getting the changing histroy of a task
router.get('/taskHistory/:taskID', authorizeRole('Supervisor'), async (req, res) => {
    const { taskID } = req.params;

    try {
        const history = await SQLExecutor(
            `SELECT fieldModified, previousValue, newValue, modifiedByID, modifiedByName, modifiedTime
             FROM TaskHistory WHERE taskID = ? ORDER BY modifiedTime ASC`,
            [taskID]
        );
        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching task history:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// // API of delete the tag of a task, at least to be a staff
// router.post('/deleteTagFromTask', authorizeRole('Staff'), async (req, res) => {
//     const { taskID, tagID } = req.body;

//     // check those are necessary
//     if (!taskID || !tagID) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     try {
//         // TODO:这里需要添加一个只删除tagID的方法
//         res.status(200).json({ message: `Task#${taskID} has deleted tag#${tagID} successfully` });
//     } catch (error) {
//         console.error('Error updating task:', error);
//         res.status(500).json({ error: 'Database error' });
//     }
// });

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
        const query = 'UPDATE Tasks SET isDone = \'1\', finishedTime = CURRENT_TIMESTAMP WHERE ID = ?';
        const values = [taskID];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task compelte successfully' });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
// API of complete task, at least to be a staff
router.post('/uncompleteTask', authorizeRole('Staff'), async (req, res) => {
    const { taskID } = req.body;

    // check those are necessary
    if (!taskID) {
        return res.status(400).json({ error: 'Missing taskID' });
    }

    try {
        const query = 'UPDATE Tasks SET isDone = \'0\', finishedTime = CURRENT_TIMESTAMP WHERE ID = ?';
        const values = [taskID];
        const result = await SQLExecutor(query, values);

        res.status(200).json({ message: 'Task uncompelte successfully' });
    } catch (error) {
        console.error('Error uncompelting task:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
// API of delete task, at least to be a staff
router.delete('/:id', authorizeRole('Supervisor'), async (req, res) => {
    const taskId = req.params.id; // 获取路径参数中的任务 ID

    try {
        // 检查任务是否存在
        const taskExists = await SQLExecutor('SELECT * FROM Tasks WHERE ID = ?', [taskId]);
        if (taskExists.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // 删除任务
        await SQLExecutor('DELETE FROM Tasks WHERE ID = ?', [taskId]);
        await SQLExecutor('DELETE FROM TaskHistory WHERE taskID = ?', [taskId]);


        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
// API for supervisor and manager to get all tasks
router.get('/allTasks', authorizeRole('Supervisor'), async (req, res) => {
    try {
        const tasks = await SQLExecutor('SELECT * FROM Tasks;', []);
        return res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching task:', error);
        return res.status(500).json({ error: 'Database query error' });
    }
});



module.exports = router;
