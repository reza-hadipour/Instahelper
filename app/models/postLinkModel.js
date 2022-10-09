const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postLink = Schema({
    url : {type: String, default: 'http://instagram.com/ada3f12'},
    title : {type: String, default: 'Guard 102'},
    price : {type: String, default: '2200'},
})

module.exports = new mongoose.model('PostLink',postLink);