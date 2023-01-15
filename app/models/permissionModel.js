const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionSchema = Schema({
    name : {type: String, unique : true , required: true},
    label : {type: String, required: true}
},{timestamps: true, toJSON : {virtuals : true}});

permissionSchema.virtual('roles',{
    ref : 'Role',
    localField: '_id',
    foreignField: 'permissions'
});

module.exports = new mongoose.model('Permissions',permissionSchema);