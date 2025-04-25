const logger = require('../utils/logger');
const Post = require('../models/Post');

const createPost = async (req, res) => {
    try {
        const { content, mediaIds } = req.body;
        const user = req?.user
        if (!user?.userId || !content) {
            return res.status(400).json({ success: false, message: 'User ID and content are required' });
        }
        const post = await Post.create({ user: user?.userId, content, mediaIds: mediaIds || [] });
        res.status(201).json({ success: true, message: 'Post created successfully', data: post });
        logger.info('Post created successfully: %o', post);
    } catch (error) {
        logger.error('Error creating post: %o', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.findAll();
        if (!posts || posts.length === 0) {
            return res.status(404).json({ success: false, message: 'No posts found' });
        }
        res.status(200).json({ success: true, data: posts });
    } catch (error) {
        logger.error('Error fetching posts: %o', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).populate('user', 'username email');
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        logger.error('Error fetching post: %o', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        logger.error('Error deleting post: %o', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    deletePost,
};