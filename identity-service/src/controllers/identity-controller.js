
const logger = require('../utils/logger');
const User = require('../models/User');
const { validateRegistration, validateLogin } = require('../utils/validation');
const generateToken = require('../utils/generateToken');
const RefreshToken = require('../models/RefreshToken');

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
                accessToken,
                refreshToken,
            },
        });

    } catch (error) {
        logger.error('Error registering user: ', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const loginUser = async (req, res) => {
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn('Validation error: ', error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) {
            logger.warn('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            logger.warn('Invalid password');
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }
        const { accessToken, refreshToken } = await generateToken(user);
        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
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
        logger.error('Error logging in user: ', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const refreshToken = async (req, res) => {
    logger.info('Refresh token endpoint hit...');
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('Refresh token not provided');
            return res.status(400).json({ success: false, message: 'Refresh token not provided' });
        }
        const currentRfsToken = await RefreshToken.findOne({ token: refreshToken });
        if (!currentRfsToken || currentRfsToken.expiresAt < Date.now()) {
            logger.warn('Invalid or expired refresh token');
            return res.status(404).json({ success: false, message: 'Refresh token not found' });
        }
        const user = await User.findById(currentRfsToken?.user);
        if (!user) {
            logger.warn('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateToken(user);
        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error) {
        logger.error('Error refreshing token: ', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const logoutUser = async (req, res) => {
    logger.info('Logout user endpoint hit...');
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn('Refresh token not provided');
            return res.status(400).json({ success: false, message: 'Refresh token not provided' });
        }
        const currentRfsToken = await RefreshToken.findOne({ token: refreshToken });
        if (!currentRfsToken) {
            logger.warn('Invalid refresh token');
            return res.status(404).json({ success: false, message: 'Refresh token not found' });
        }
        await RefreshToken.findByIdAndDelete(currentRfsToken._id);
        logger.info('Refresh token deleted successfully');
        return res.status(200).json({
            success: true,
            message: 'User logged out successfully',
        });
    } catch (error) {
        logger.error('Error logging out user: ', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser
};