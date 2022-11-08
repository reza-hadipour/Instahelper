const mongoose = require('mongoose');
const paginate = require('mongoose-paginate');

const requestSchema = new mongoose.Schema({
    page : {type: mongoose.Types.ObjectId , require : true, ref: 'Page'},
    requester : {type: mongoose.Types.ObjectId, require: true, ref: 'User'}
},{timestamps: true, toJSON : {virtuals:true}});

requestSchema.plugin(paginate);

module.exports = new mongoose.model('Requests',requestSchema);