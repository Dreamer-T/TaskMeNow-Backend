const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const ROLE_HIERARCHY = {
    Staff: 1,
    Supervisor: 2,
    Manager: 3
};
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};
const authorizeRole = (role) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        // if the role has the right
        if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]) {
            next();
        } else {
            res.status(401).json({ error: 'Access denied' }); // 用户角色权限不足
        }
    };
};
module.exports = { authenticateToken, authorizeRole };
