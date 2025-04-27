const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");

const handlePostDeleted = async (event) => {
    const { postId, userId, mediaIds } = event;
    try {
        const mediasToDelete = await Media.find({
            _id: { $in: mediaIds },
        });
        if (mediasToDelete.length === 0) {
            logger.warn('No media found for post deletion event');
            return;
        }
        mediasToDelete.forEach(async (media) => {
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);
            logger.info('Media deleted successfully: %s', media._id, ' in post: %s', postId);
        });

        logger.info('Post deleted event handled successfully for postId: %s', postId);
    } catch (error) {
        logger.error('Error handling post deleted event: %o', error);

    }
}
module.exports = {
    handlePostDeleted
}