const logger = require('../utils/logger');
const Search = require('../models/Search');

const searchPosts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }
        const cacheKey = `search:${query}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        if (cachedPosts) {
            return res.status(200).json({ success: true, data: JSON.parse(cachedPosts) });
        }
        const posts = await Search.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(10);
        if (!posts || posts.length === 0) {
            return res.status(404).json({ success: false, message: 'No posts found' });
        }
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(posts));
        res.status(200).json({ success: true, data: posts });
    } catch (error) {
        logger.error('Error searching posts: %o', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    searchPosts,
}