const User = require("../models/user");
const { MongoError } = require("../util/mongoError");
const messages = require("../messages/messages");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OneTimeToken = require("../models/oneTimeToken");
const { throwError } = require("../util/throwError");

exports.login = async (req, res, next) => {
  const { password, username } = req.body;
  const rememberMe = req.query.rememberMe || "false";

  try {
    const findedUser = await User.findOne({
      username: username,
      isActivated: true,
    });
    if (!findedUser) {
      throwError({
        message: messages.user.invalidData,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, findedUser.password);
    if (!isPasswordValid) {
      throwError({
        message: messages.user.invalidData,
      });
    }
    const payload = {
      id: findedUser._id,
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN_MILISECONDS,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN_MILISECONDS,
    });

    if (rememberMe === "true") {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/refresh",
        maxAge: +process.env.REFRESH_TOKEN_EXPIRES_IN_MILISECONDS,
      });
    }

    res.send({
      accessToken: accessToken,
      accessTokenExpiresIn: +process.env.ACCESS_TOKEN_EXPIRES_IN_MILISECONDS,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  try {
    res.clearCookie("refreshToken", {
      path: "/refresh",
      sameSite: "lax",
      httpOnly: true,
    });

    res.send({ message: messages.user.logoutSuccessfully });
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  const { username, password, email } = req.body;

  try {
    const newUser = new User({
      username: username,
      password: password,
      email: email,
      isActivated: false,
    });

    await newUser.validate();
    newUser.password = await bcrypt.hash(
      password,
      +process.env.HASHED_PASSWORD_LENGTH
    );

    const createdUser = await newUser.save({ validateBeforeSave: false });
    const newOneTimeToken = new OneTimeToken({ creator: createdUser._id });
    const createdOneTimeToken = await newOneTimeToken.save();

    createdOneTimeToken.sendEmailWithToken("activation");
    res
      .status(201)
      .send({ message: messages.oneTimeToken.newTokenHasBeenCreated });
  } catch (err) {
    const mongoError = new MongoError(err);
    const message = mongoError.getMessage();

    const isDuplicateError = mongoError.isDuplicateError();
    if (message) {
      err.statusCode = isDuplicateError ? 409 : 400;
      err.errorMessage = message;
    }
    next(err);
  }
};

exports.activate = async (req, res, next) => {
  const { token } = req.params;
  try {
    if (token === "0") {
      throwError({
        message: messages.oneTimeToken.invalidData,
      });
    }

    const findedOneTimeToken = await OneTimeToken.findOne({
      "activation.token": token,
    });
    if (!findedOneTimeToken) {
      throwError({
        message: messages.oneTimeToken.invalidData,
      });
    }

    const oneTimeTokenHasExpired =
      findedOneTimeToken.hasTokenExpired("activation");
    if (oneTimeTokenHasExpired) {
      const updatedOneTimeToken = await findedOneTimeToken.makeValid();
      updatedOneTimeToken.sendEmailWithToken("activation");
      res.send({ message: messages.oneTimeToken.newTokenHasBeenGenerated });
    }

    if (!oneTimeTokenHasExpired) {
      await User.updateOne(
        { _id: findedOneTimeToken.creator },
        {
          $set: {
            isActivated: true,
          },
        }
      );
      await OneTimeToken.updateOne(
        { _id: findedOneTimeToken._id },
        {
          $set: {
            activation: {
              token: "0",
            },
          },
        }
      );
      res.send({ message: messages.oneTimeToken.tokenHasBeenUsedSuccessfully });
    }
  } catch (err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  const userId = req.userData.id;
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throwError();
    }

    res.send({
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    const mongoError = new MongoError(err);
    const message = mongoError.getMessage();
    if (message) {
      err.statusCode = 400;
      err.errorMessage = message;
    }
    next(err);
  }
};
