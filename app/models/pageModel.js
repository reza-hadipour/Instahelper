const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pageSchema = Schema({
    owner: {type: mongoose.Types.ObjectId, recuired: true, ref: 'User'},
    username: {type:String, require: true, unique: true},
    title: {type: String, require:true},
    description : {type: String},
    thumb: {type: String},
    images : {type: Object},
    instagramURL: {type: String},
    posts: [{type: mongoose.Types.ObjectId, default: null, ref: 'Post'}],
    followers : [{ type: mongoose.Types.ObjectId,default: null, ref: 'User'}],
    followersNum : {type: Number, default: 0}
},{timestamps: true , toJSON: { virtuals: true}});

pageSchema.methods.inc = async function(number = 1){
    this.followersNum += number;
    await this.save();
}

pageSchema.methods.path = function(){
    return `/page/${this.username}`;
}

module.exports = new mongoose.model('Page',pageSchema);
