const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, getPostById, deletePost } = require('../controllers/post-controller');
const authenticatedReq = require('../middlewares/authMiddleware');


router.use(authenticatedReq);
router.post('/create-post', createPost);
router.get('/all-posts', getAllPosts);
router.get('/:id', getPostById);
router.delete('/:id', deletePost);


module.exports = router;