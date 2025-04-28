require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mediaRoutes = require('./routes/media-routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandlers/media-event-handlers');
const app = express();
const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', err));

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
}
);

app.use('/api/media', mediaRoutes);
app.use(errorHandler);



async function startServer() {
    try {
        await connectRabbitMQ();
        //consume events
        await consumeEvent('post.deleted', handlePostDeleted);
        logger.info('RabbitMQ connected');
        app.listen(PORT || 3003, () => {
            logger.info(`Post service is running on port ${process.env.PORT}`);
        }
        );
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        process.exit(1);
    }
}

startServer();
//unhandle promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, "reason:", reason);
}
);

module.exports = app;