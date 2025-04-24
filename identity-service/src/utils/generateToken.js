const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const generateToken = async (user) => {
    const accessToken = await jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7);

    await RefreshToken.create({
        user: user._id,
        token: refreshToken,
        expiresAt: expireAt,
    });
    return { accessToken, refreshToken };
}

module.exports = generateToken;