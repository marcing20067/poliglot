const User = require('../models/user.js');
const isShortErrorAndSendError = require('../utils/short.js');
const isRequiredErrorAndSendError = require('../utils/isRequired.js');
const errorTexts = require('../errorTexts/errorTexts.js');
const invalidDataErrorText = errorTexts.invalidData;
const usernameTakenErrorText = errorTexts.controllers.signup.usernameTaken;

exports.signup = async (req, res, next) => {
    const user = {
        username: req.body.username,
        password: req.body.password,
    };
    try {
        const createdUser = await createUser(user);
        res.status(201).send(createdUser);
    } catch (err) {
        if (isUsernameTakenErrorAndSendError(res, err)) {
            return;
        }
        if (err.errors.username) {
            const message = err.errors.username.properties.message;
            if (isShortOrRequiredErrorAndSendError(res, message)) {
                return;
            }
        }
        if (err.errors.password) {
            const message = err.errors.password.properties.message;
            if (isShortOrRequiredErrorAndSendError(res, message)) {
                return;
            }
        }
        res.status(400).send({ message: invalidDataErrorText })
    }
}

const createUser = async (user) => {
    const newUser = new User(user);
    const createdUser = await newUser.save();
    return createdUser;
}

const isUsernameTakenErrorAndSendError = (res, err) => {
    if (err.name === 'MongoError' && err.code === 11000) {
        res.status(409).send({ message: usernameTakenErrorText })
        return true;
    }
    return false;
}

const isShortOrRequiredErrorAndSendError = (res, message) => {
    return isShortErrorAndSendError(res, message) || isRequiredErrorAndSendError(res, message);
}

