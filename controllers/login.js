const User = require('../models/user.js');
const isAnyPropertyUndefinedAndSendError = require('../utils/required.js');
const errorTexts = require('../errorTexts/errorTexts.js');
const loginInvalidDataErrorText = errorTexts.controllers.login.invalidData;
const token = require('../utils/token.js');

exports.login = async (req, res, next) => {
    const userData = {
        username: req.body.username,
        password: req.body.password,
    }

    if (isAnyPropertyUndefinedAndSendError(res, userData)) {
        return;
    }

    try {
        const findedUser = await findUser(userData);

        const userDataForToken = {
            id: findedUser._id,
        }

        const tokenData = token.createTokenData(userDataForToken);

        token.setRefreshTokenInCookie(res, tokenData);

        res.send({
            accessToken: tokenData.accessToken,
            accessTokenExpiresIn: tokenData.accessTokenExpiresIn,
        })
    } catch {
        return res.status(400).send({ message: loginInvalidDataErrorText });
    }
}

const findUser = async (userData) => {
    const findedUser = await User.findOne(userData)
    if (!findedUser) {
        throw new Error;
    }
    return findedUser;
}