require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const proxy = require('express-http-proxy');
const validateToken = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

//rate limiting
const rateLimitOptions = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 50 requests per windowMs
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

app.use(rateLimitOptions);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    },
}
//identity service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
        proxyReqOpt.headers['Content-Type'] = "application/json";
        return proxyReqOpt;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response from Identity Service: ${proxyRes.statusCode}`);
        return proxyResData;
    },
}));


// post service
app.use('/v1/posts', validateToken, proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
        proxyReqOpt.headers['Content-Type'] = "application/json";
        proxyReqOpt.headers['x-user-id'] = srcReq?.user?.id;
        return proxyReqOpt;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response from Post Service: ${proxyRes.statusCode}`);
        return proxyResData;
    },
}));


app.use(errorHandler)


app.listen(process.env.PORT || 3000, () => {
    logger.info(`API gateway is running on port ${PORT}`);
    logger.info(`Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Redis is running on port ${process.env.REDIS_URL}`);

}
);

//unhandle promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, "reason:", reason);
}
);

module.exports = app;