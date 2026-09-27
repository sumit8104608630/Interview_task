const jwt = require('jsonwebtoken');
const config = require('../config/env');

const signToken = (payload) => jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
const verifyToken = (token) => jwt.verify(token, config.jwt.secret);

module.exports = { signToken, verifyToken };
