const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = Schema({
    title: {type: String, require: true},
    slug: {type: String},
    body: {type: String},
    images: [{type: String, default: '/images/postDef.jpg'}],
    links : [{
        url: {type: String},
        title: {type: String},
        price: {type: Number}
    }],
    page: {type: mongoose.Types.ObjectId, default: null, ref: 'Page'},
    likes : [{type: mongoose.Types.ObjectId, default: null , ref: 'User'}],
    likeCount : {type: Number, default: 0},
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