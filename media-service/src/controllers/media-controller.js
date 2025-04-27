const logger = require("../utils/logger")
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const Media = require("../models/Media");

const uploadMedia = async (req, res) => {
    logger.info("Uploading media...");
    try {
        const { file } = req;
        if (!file) {
            logger.error("No file uploaded");
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const { originalname, mimetype, buffer } = file;
        const userId = req.user.id;
        logger.info("File details:", { originalname, mimetype, userId });

        const uploadResult = await uploadMediaToCloudinary(file);
        logger.info("File uploaded publicId:", uploadResult?.public_id);

        const newMedia = await Media.create({
            publicId: uploadResult?.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: uploadResult?.secure_url,
            userId,
        })

        return res.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            data: newMedia,
        });
    } catch (error) {
        logger.error("Error uploading media:", error);
        return res.status(500).json({
            success: false,
            message: "Error uploading media",
            error: error.message,
        });
    }
}

module.exports = {
    uploadMedia,
}
