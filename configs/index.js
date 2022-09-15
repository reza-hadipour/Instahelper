const database = require('./database');

module.exports = {
    port : process.env.APPLICATION_PORT,
    host: process.env.APPLICATION_HOST,
    database
}