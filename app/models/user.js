let mongoose = require('mongoose');
let userSchema = mongoose.Schema({
    name: {type: String},
    family: {type: String},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    otp: {type: Object , default:{
        code: 0,
        expiresIn : 0
    }},
    roles: {type: [mongoose.Types.ObjectId], ref: "reole"},
    catalogues : {type: [mongoose.Types.ObjectId], ref: "catalogue"}
},{timestamps: true, toJSON:{virtuals: true}});


module.export = new mongoose.model('User',userSchema);