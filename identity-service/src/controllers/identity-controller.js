const { log } = require('winston');
const logger = require('../utils/logger');
const User = require('../models/User');
const validateRegistration = require('../utils/validation').validateRegistration;
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res) => {
    logger.info('Registering user...');
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn('Validation error: ', error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const { username, email, password } = req.body;

        let currentUser = await User.findOne({ $or: [{ username }, { email }] });
        if (currentUser) {
            logger.warn('User already exists');
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const user = new User({
            username,
            email,
            password,
        });
        await user.save();
        logger.warn('User save successfully!');

        const { accessToken, refreshToken } = await generateToken(user);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                },
                accessToken,
                refreshToken,
            },
        });

    } catch (error) {
        logger.error('Error registering user: ', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
};