const logger = require('../utils/logger');

const authenticatedReq = (req, res, next) => {
    const userId = req.headers["x-user-id"];

    if (!userId) {
        logger.warn('Access attempt without user ID');
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
    req.user = { id: userId };
    next();
}
module.exports = authenticatedReq;