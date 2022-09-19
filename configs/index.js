const database = require('./database');
const session = require('./session');

module.exports = {
    port : process.env.APPLICATION_PORT,
    host: process.env.APPLICATION_HOST,
    database,
    jwt: {
        secret : process.env.JWT_SECRET_KEY
    },
    session
}