const passport = require('passport');
const userModel = require('../models/user');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

let opts = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: configs.jwt.accessTokenSecret
};

passport.use('jwt',new JwtStrategy(opts,(jwt_payload,done)=>{
    userModel.findById(jwt_payload.userId, (err,user)=>{
        if(err){
            return done(err,false,jwt_payload);
        }
        if(user){
            return done(null, user);
        }else{
            return done(null,false,jwt_payload);
        }
    })
}))
