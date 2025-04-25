const joi = require('joi');

const validateRegistration = (data) => {
    const schema = joi.object({
        username: joi.string().min(3).max(30).required(),
        password: joi.string().min(4).max(100).required(),
        email: joi.string().email().required(),
    });

    return schema.validate(data);
}

const validateLogin = (data) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(4).max(100).required(),
    });

    return schema.validate(data);
}

module.exports = {
    validateRegistration,
    validateLogin
};