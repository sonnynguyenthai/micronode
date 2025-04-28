const Search = require("../models/Search");
const logger = require("../utils/logger")

const handlePostCreated = async (event) => {
    const { postId, userId, content, createdAt } = event;
    try {
        const newSearchPost = await Search.create({
            postId,
            userId,
            content,
            createdAt
        })
        logger.info('Post created event handled successfully for postId: %s', postId, newSearchPost._id.toString());
    } catch (error) {
        logger.error('Error handling post created event: %o', error);
    }
}
const handlePostDeleted = async (event) => {
    const { postId } = event;
    try {
        await Search.findOneAndDelete({ postId })
        logger.info('Post deleted event handled successfully for postId: %s', postId);
    } catch (error) {
        logger.error('Error handling post deleted event: %o', error);
    }

}
module.exports = {
    handlePostCreated,
    handlePostDeleted
}