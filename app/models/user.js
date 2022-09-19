let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt');

const userSchema = Schema({
    name: {type: String},
    family: {type: String},
    email: {type: String, unique: false, required: false},
    password: {type: String, required: false},
    mobile: {type: String ,  required:true , unique:false},
    otp: {type: Object , default:{
        code: 0,
        expiresIn : 0
    }},
    roles: {type: [String], default:['USER']},
    catalogues : {type: [mongoose.Types.ObjectId], ref: "catalogue"},
    verifyed : {type: Boolean, default: false}
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

userSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password,this.password);
}


module.exports = new mongoose.model('User',userSchema)