const express = require('express');
const { getPool } = require('./db');

const router = express.Router();


const getCompaniesFromDB = async (query) => {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(query);
        return result;
    } finally {
        await conn.release();
    }
};
router.get('/search_company', async (req, res) => {
    try {
        const [rows] = await getCompaniesFromDB('SELECT * FROM Companies;');

        // Optionally format the data before sending it back
        const companies = rows.map(company => ({
            id: company.id,          // assuming there's an id field
            name: company.companyname,      // assuming there's a name field
            logo: company.logo       // assuming there's a logo field (URL or path)
        }));

        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Database query error' });
    }
});
module.exports = router;