const express = require('express');
const router = express.Router();
const { createPost } = require('../controllers/post-controller');
const authenticatedReq = require('../middlewares/authMiddleware');


router.use(authenticatedReq);
router.post('/create-post', createPost);


module.exports = router;