const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = Schema({
    page: {type: mongoose.Types.ObjectId, require: true, ref: 'Page'},
    title: {type: String, require: true},
    slug: {type: String},
    body: {type: String},
    images: [{type: String}],
    links : [{type: mongoose.Types.ObjectId , ref: 'postLink'}],
    likes : [{type: mongoose.Types.ObjectId, default: null , ref: 'User'}],
    likeCount : {type: Number, default: 0},
    viewCount : {type: Number, default: 0},
    comments: [{type: mongoose.Types.ObjectId, default: null, ref: 'Comment'}]
},{timestamps: true , toJSON: {virtuals: true}});

postSchema.methods.inc = async function(number = 1){
    this.likeCount += number;
    await this.save();
}

postSchema.method.path = function(){
    return `${this.page.path()}/${this.slug}`;
}

module.exports = new mongoose.model('Post',postSchema);