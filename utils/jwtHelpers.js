const jwt = require('jsonwebtoken')

//const { token } = require('morgan')
const secret = process.env.JWT_SECRET
const expiresIn = process.env.JWT_EXPIRES_IN

//console.log("JWT Secret:", process.env.JWT_SECRET);

const sign = (payload) => {
    return jwt.sign(payload, secret, { expiresIn });
};

const verify = (token) => {
    try {
        return jwt.verify(token, secret);
    } catch (e) {
        return false;
    }
};


module.exports = {
    sign,
    verify
};











