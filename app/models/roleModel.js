const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = Schema({
    name : {type: String},
    label : {type: String},
    permissions : [{type: mongoose.Types.ObjectId, ref: 'Permissions'}]
},{timeStamps : true, toJson :{ virtuals: true}});

module.exports = new mongoose.model('Role',roleSchema);