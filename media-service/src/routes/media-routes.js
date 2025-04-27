const express = require('express');
const multer = require('multer');
const { uploadMedia } = require('../controllers/media-controller');

const router = express.Router();
const authenticatedReq = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

// Config multer
const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    }
}).single('file');

router.post("/upload", (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logger.error("Multer error:", err);
            return res.status(400).json({ success: false, message: err.message, stack: err.stack });
        } else if (err) {
            logger.error("Unknown error:", err);
            return res.status(500).json({ success: false, message: "Unknown error", stack: err.stack });
        }
        next();
    });
}, authenticatedReq, uploadMedia);

module.exports = router;