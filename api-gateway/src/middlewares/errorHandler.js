const logger = require('../utils/logger');

const errHandler = (err, req, res, next) => {
    logger.warn(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
}

module.exports = errHandler;
