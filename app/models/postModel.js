const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {type: String},
    body: {type: String},
    image: {type: String, default: '/images/postDef.jpg'},
    links : [{
        url: {type: String},
        title: {type: String}
    }],
    directLink: {type: String},
    parentPage: {type: mongoose.Types.ObjectId, default: null, ref: 'Page'}
},{timestamps: true , toJSON: {virtuals: true}});

module.exports = new mongoose.model('Post',postSchema);