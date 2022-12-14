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
    followers : [{ type: mongoose.Types.ObjectId, ref: 'User'}],
    followersNum : {type: Number, default: 0},
    active : {type: Boolean, default: true},
    status : {type: String, default: 'public'}
},{timestamps: true , toJSON: { virtuals: true}});

pageSchema.virtual('posts',{
    ref: 'Post',
    localField : '_id',
    foreignField : 'page'
});

pageSchema.methods.activate = async function(status = false){
    this.active = status;
    await this.save();
}

pageSchema.methods.inc = async function(number = 1){
    this.followersNum += number;
    await this.save();
}

pageSchema.methods.path = function(){
    return `/page/${this.username}`;
}

module.exports = new mongoose.model('Page',pageSchema);
