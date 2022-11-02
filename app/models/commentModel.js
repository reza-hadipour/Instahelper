const mongoose = require('mongoose');
const paginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    author : {type: mongoose.Types.ObjectId, required: true, ref: 'User'},
    comment : {type: String, required: true},
    parent: {type: mongoose.Types.ObjectId, default: null, ref: 'Comment'},
    post: {type: mongoose.Types.ObjectId, required: true ,ref: 'Post'},
    approved : {type: Boolean, default: false},
    visible : {type: Boolean, default: true}
},{timestamps: true, toJSON: {virtuals: true}});

commentSchema.virtual('comments',{
    ref: 'Comment',
    localField: '_id',
    foreignField : 'parent'
});

commentSchema.methods.hide = async function(){
    this.visible = false;
    await this.save();
}

commentSchema.methods.approve = async function () {
    this.approved = true;
    await this.save();
    
}

commentSchema.plugin(paginate);

module.exports = new mongoose.model('Comment',commentSchema);