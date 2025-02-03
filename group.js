const express = require('express');
const { SQLExecutor } = require('./db');
const { authorizeRole } = require('./authMiddleware');

const router = express.Router();

// API for getting all the tags
router.get('/getGroups', authorizeRole('Supervisor'), async (req, res) => {
    try {
        // check whether tag name has already existed
        const result = await SQLExecutor('SELECT * FROM Usergroups');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});

module.exports = router;