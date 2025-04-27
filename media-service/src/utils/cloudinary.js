const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'media',
            },
            (error, result) => {
                if (error) {
                    logger.error('Error uploading media to Cloudinary:', error);
                    return reject(error);
                }
                resolve(result);
            }
        );

        uploadStream.end(file.buffer);
    });
}

module.exports = {
    uploadMediaToCloudinary,
};