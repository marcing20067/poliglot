const crypto = require('crypto');
const OneTimeTokenDb = require('../models/oneTimeToken');
const config = require('../config/config');

module.exports = class OneTimeToken {
    constructor(creator, resetPassword, resetUsername, activation) {
        this.creator = creator;
        this.resetPassword = resetPassword || {
            token: this.generateToken(),
            endOfValidity: this.generateEndOfValidity(),
        };
        this.resetUsername = resetUsername || {
            token: this.generateToken(),
            endOfValidity: this.generateEndOfValidity(),
        };
        this.activation = activation || {
            token: this.generateToken(),
            endOfValidity: this.generateEndOfValidity(),
        };
    }

    generateToken() {
        const tokenLength = config.ONE_TIME_TOKEN_LENGTH;
        const token = crypto.randomBytes(tokenLength / 2).toString('hex');
        return token;
    }

    generateEndOfValidity() {
        const oneTimeTokenExpiresInWeeks = config.ONE_TIME_TOKEN_EXPIRES_IN_WEEKS;
        const now = new Date();
        const endOfValidity = new Date().setDate(now.getDate() + oneTimeTokenExpiresInWeeks * 7);
        return endOfValidity;
    }

    createUrl(tokenType) {
        const frontendUrl = config.FRONTEND_URL;
        const token = this[tokenType].token;
        return `${frontendUrl}/${token}`;
    }

    hasTokenExpired(tokenType) {
        const now = Date.now();
        return now > this[tokenType].endOfValidity;
    }

    async save() {
        const oneTimeToken = new OneTimeTokenDb(this);
        await oneTimeToken.save()
    }

    static async findOne(filterData) {
        const findedOneTimeToken = await OneTimeTokenDb.findOne(filterData);
        if (findedOneTimeToken) {
            const oneTimeToken = new OneTimeToken(
                findedOneTimeToken.creator,
                findedOneTimeToken.resetPassword,
                findedOneTimeToken.resetUsername,
                findedOneTimeToken.activation,
            );
            
            return oneTimeToken;
        }
    }

    static async updateOne(filterData, creator) {
        const newOneTimeToken = new OneTimeToken(creator);
        await OneTimeTokenDb.updateOne(filterData, newOneTimeToken);
        return newOneTimeToken;
    }
}