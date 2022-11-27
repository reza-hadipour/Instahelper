let mongoose = require('mongoose');
const paginate = require('mongoose-paginate');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt');

const userSchema = Schema({
    name: {type: String},
    family: {type: String},
    // fullname : {type: String, default : ''},
    email: {type: String, unique: false, required: false},
    password: {type: String, required: false},
    mobile: {type: String ,  required:true , unique:false},
    otp: {type: Object , default:{
        code: 0,
        expiresIn : 0
    }},
    roles: [{type: String, default:'USER'}],
    refreshToken: {type: String, default: null},
    // pages : [{type: mongoose.Types.ObjectId, ref: "Page"}],
    verifyed : {type: Boolean, default: false},
    // followings : [{type: mongoose.Types.ObjectId, ref : "Page"}]
},{timestamps: true, toJSON:{virtuals: true}});

// userSchema.pre('save',function(next){
//     bcrypt.hash(this.password,4,(err,hash)=>{
//         if(err) console.log(err);
//         this.password = hash;
//         next();
//     })
// })

userSchema.virtual('pages',{
    ref: 'Page',
    localField : '_id',
    foreignField : 'owner'
});

userSchema.virtual('followings',{
    ref: 'Page',
    localField : '_id',
    foreignField : 'followers'
});

userSchema.methods.hashPassword = function(password){
    const salt = bcrypt.genSaltSync(3);
    return bcrypt.hashSync(password,salt);
}

userSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password,this.password);
}

userSchema.virtual('fullname').get(function(){
    return `${this.name} ${this.family}`;
});

userSchema.pre('save',function(next){
    this.fullname = `${this.get('name')} ${this.get('family')}`;
    next();
})

userSchema.plugin(paginate);

module.exports = new mongoose.model('User',userSchema)