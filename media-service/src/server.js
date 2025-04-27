require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mediaRoutes = require('./routes/media-routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');


const app = express();
const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.MONGO_URI)
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
app.listen(PORT, () => {
    logger.info(`Media service is running on port ${PORT}`);
}
);
//unhandle promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, "reason:", reason);
}
);

module.exports = app;