let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt');

const userSchema = Schema({
    name: {type: String},
    family: {type: String},
    email: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    mobile: {type: String ,  required:true , unique:true},
    otp: {type: Object , default:{
        code: 0,
        expiresIn : 0
    }},
    roles: {type: [mongoose.Types.ObjectId], ref: "reole"},
    catalogues : {type: [mongoose.Types.ObjectId], ref: "catalogue"}
},{timestamps: true, toJSON:{virtuals: true}});

// userSchema.pre('save',function(next){
//     bcrypt.hash(this.password,4,(err,hash)=>{
//         if(err) console.log(err);
//         this.password = hash;
//         next();
//     })
// })

userSchema.methods.hashPassword = function(password){
    const salt = bcrypt.genSaltSync(3);
    return bcrypt.hashSync(password,salt);
}


module.exports = new mongoose.model('User',userSchema)