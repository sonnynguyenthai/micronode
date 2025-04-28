require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { rateLimit } = require('express-rate-limit');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const searchRoutes = require('./routes/searchRoutes')
const { handlePostCreated, handlePostDeleted } = require('./eventHandlers/search-event-handlers')
const app = express();
const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGODB_URI).then(() => {
    logger.info('MongoDB connected');
}
).catch((err) => {
    logger.error('MongoDB connection error:', err);
});
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

const sensitiveEndpointsLimiter = (windowMs, max, message) => rateLimit({
    windowMs: windowMs * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    max: max || 50, // limit each IP to 50 requests per windowMs
    message: message || 'Too many requests from this IP, please try again later.',
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
app.use('/api/search', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, searchRoutes);
app.use(errorHandler);

async function startServer() {
    try {
        await connectRabbitMQ();
        await consumeEvent('post.created', handlePostCreated)
        await consumeEvent('post.deleted', handlePostDeleted)
        logger.info('RabbitMQ connected');
        app.listen(PORT || 3004, () => {
            logger.info(`Post service is running on port ${process.env.PORT}`);
        }
        );
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        process.exit(1);
    }
}

startServer();