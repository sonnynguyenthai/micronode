const express = require('express');
const { searchPosts } = require('../controllers/search-controller');
const authenticatedReq = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/search-posts', authenticatedReq, searchPosts);

module.exports = router