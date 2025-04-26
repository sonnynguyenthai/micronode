const logger = require('../utils/logger');
const Post = require('../models/Post');
const { validateCreatePost } = require('../utils/validation');

const invalidatePostCache = async (req, input) => {
    try {
        const cacheKey = `post:${input}`;
        await req.redisClient.get(cacheKey);
        const keys = await req.redisClient.keys('posts:*');
        console.log('Keys to be deleted:', keys);
        if (keys.length > 0) {
            await req.redisClient.del(keys);
        }
        logger.info('Post cache invalidated successfully for post ID: %s', id);
    } catch (error) {
        logger.error('Error invalidating post cache: %o', error);
    }
}

const createPost = async (req, res) => {
    try {
        logger.info('Create post endpoint hit...');
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.warn('Validation error: ', error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const { content, mediaIds } = req.body;
        const user = req?.user
        if (!user?.id || !content) {
            return res.status(400).json({ success: false, message: 'User ID and content are required' });
        }
        const post = await Post.create({ userId: user?.id, content, mediaIds: mediaIds || [] });
        await invalidatePostCache(req, post._id.toString());
        res.status(201).json({ success: true, message: 'Post created successfully', data: post });
        logger.info('Post created successfully: %o', post);
    } catch (error) {
        logger.error('Error creating post: %o', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        //cache
        const cacheKey = `posts:${page}:${limit}`;
        const cachedKeys = await req.redisClient.get(cacheKey);
        if (cachedKeys) {
            const cachedPosts = JSON.parse(cachedKeys);
            return res.status(200).json({ success: true, data: cachedPosts });
        }
        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);

        const totalPosts = await Post.countDocuments();
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            items: posts,
        }

        await req.redisClient.setex(cacheKey, 300, JSON.stringify(pagination));
        if (!posts || posts.length === 0) {
            return res.status(404).json({ success: false, message: 'No posts found' });
        }
        res.status(200).json({ success: true, data: { pagination } });
    } catch (error) {
        logger.error('Error fetching posts: %o', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Post ID is required' });
        }
        const cacheKey = `posts:${id}`;
        const cachedPost = await req.redisClient.get(cacheKey);
        if (cachedPost) {
            return res.status(200).json({ success: true, data: JSON.parse(cachedPost) });
        }
        const post = await Post.findById({ _id: id });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(post));
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        logger.error('Error fetching post: %o', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Post ID is required' });
        }
        const post = await Post.findByIdAndDelete({
            _id: id,
            userId: req.user.id,
        });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        await invalidatePostCache(req, id);
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