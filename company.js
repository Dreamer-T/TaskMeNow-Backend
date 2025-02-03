const express = require('express');
const { SQLExecutor } = require('./db');

const router = express.Router();


router.get('/search_company', async (req, res) => {
    try {
        const rows = await SQLExecutor('SELECT * FROM Companies;', []);

        // Optionally format the data before sending it back
        const companies = rows.map(company => ({
            id: company.id,          // assuming there's an id field
            companyname: company.companyname,      // assuming there's a name field
            logo: company.logo,       // assuming there's a logo field (URL or path)
            uniqueName: company.uniqueName
        }));

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});
module.exports = router;