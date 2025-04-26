const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        logger.warn(`No token provided`);
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn(`Invalid token`);
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        req.user = user;
        next();
    });

}

module.exports = validateToken;