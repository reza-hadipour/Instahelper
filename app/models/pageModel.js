const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    title: {type: String, require:true},
    description : {type: String},
    image: {type: String, default : "/image/pageDef.jpg"},
    instagramURL: {type: String},
    posts: {type: [mongoose.Types.ObjectId], default: null, ref: 'Post'},
    followers : { type: [mongoose.Types.ObjectId],default: null, ref: 'User'},
    followersNum : {type: Number, default: 0}
},{timestamps: true , toJSON: { virtuals: true}});

pageSchema.methods.inc = async function(number = 1){
    this.followersNum += number;
    await this.save();
}

module.exports = new mongoose.model('Page',pageSchema);
