const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const postSchema = Schema({
    page: {type: mongoose.Types.ObjectId, require: true, ref: 'Page'},
    title: {type: String, require: true},
    slug: {type: String},
    body: {type: String},
    images: [{type: String}],
    links : [{type: mongoose.Types.ObjectId , ref: 'PostLink'}],
    // links : [{
    //         title : {type: String},
    //         url: {type: String},
    //         price: {type: String}
    //     }],
    likes : [{type: mongoose.Types.ObjectId, default: null , ref: 'User'}],
    likeCount : {type: Number, default: 0},
    viewCount : {type: Number, default: 0},
    commentCount: {type: Number, default: 0},
    active : {type: Boolean, default: true}
},{timestamps: true , toJSON: {virtuals: true}});


postSchema.virtual('comments',{
    ref: 'Comment',
    localField: '_id',
    foreignField: 'post'
})

postSchema.methods.inc = async function(field = 'like' ,number = 1){
    switch (field) {
        case 'like':
            this.likeCount += number;
            break;
        case 'view':
            this.viewCount += number;
            break;
        case 'comment':
            this.commentCount += number;
            break;
    }
    
    await this.save();
}

postSchema.methods.dec = async function(field = 'like' ,number = 1){
    switch (field) {
        case 'like':
            this.likeCount -= number;
            break;
        case 'view':
            this.viewCount -= number;
            break;
        case 'comment':
            this.commentCount -= number;
            break;
    }
    
    await this.save();
}

postSchema.methods.activate = async function(status = false){
    this.active = status;
    await this.save();
}

postSchema.methods.path = function(){
    return `${this.page.path()}/${this.slug}`;
}

postSchema.plugin(mongoosePaginate);

module.exports = new mongoose.model('Post',postSchema);