const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const errorTexts = require('../errorTexts/errorTexts.js');
const invalidRefreshTokenErrorText = errorTexts.controllers.refresh.invalidRefreshToken;
const token = require('../utils/token.js');

exports.refresh = (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        const userData = jwt.verify(refreshToken, config.REFRESH_TOKEN)
        const tokenData = token.createTokenData(userData);

        token.setRefreshTokenInCookie(res, tokenData);

        res.status(201).send({ accessToken: tokenData.accessToken, accessTokenExpiresIn: tokenData.accessTokenExpiresIn, })
    } catch {
        res.status(400).send({ message: invalidRefreshTokenErrorText })
    }
}