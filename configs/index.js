const database = require('./database');
const session = require('./session');

module.exports = {
    port : process.env.APPLICATION_PORT,
    host: process.env.APPLICATION_HOST,
    database,
    jwt: {
        accessTokenSecret : process.env.ACCESS_SECRET_KEY,
        refreshTokenSecret : process.env.REFRESH_SECRET_KEY
    },
    session
}