const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');
const helmet = require('helmet');
const { RateLimiterRedis } = require('rate-limiter-flexible')
const Redis = require('ioredis');
const app = express();
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const identityRoutes = require('./routes/identity-routes');
const errorHandler = require('./middlewares/errorHandler');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', err));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
}
);

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 10, // 10 requests
    duration: 1, // per second
    keyPrefix: 'middleware'
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            logger.warn(`Rate limit exceeded of IP: ${req.ip}`);
            res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
        });
}
);

//IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers,
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded of IP: ${req.ip}`);
        res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});


app.use('/api/auth/register', sensitiveEndpointsLimiter);

app.use('/api/auth', identityRoutes);

app.use(errorHandler);

app.listen(process.env.PORT || 3001, () => {
    logger.info(`Identity service is running on port ${process.env.PORT}`);
}
);

//unhandle promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, "reason:", reason);
}
);

module.exports = app;