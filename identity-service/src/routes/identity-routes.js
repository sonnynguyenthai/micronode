const express = require('express');
const { registerUser, loginUser, logoutUser, refreshToken } = require('../controllers/identity-controller');

const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh_token', refreshToken);
router.post('/logout', logoutUser);
module.exports = router;