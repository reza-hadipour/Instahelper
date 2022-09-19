const autoBind = require('auto-bind');
const {validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const { randomNumberGenerator } = require('../../../helpers');

class Controller {
    constructor(){
        autoBind(this);
    }

    createOtp(){
        return {
            code : randomNumberGenerator() , // xxx-xxx
            expiresIn : new Date().getTime() + 10*60000   // 10 Min
        }
    }

    createRefreshTokne(userId){
        return jwt.sign({userId},configs.jwt.refreshTokenSecret,{expiresIn: "1y"});
    }

    createTokne(userId){
        return jwt.sign({userId},configs.jwt.accessTokenSecret,{expiresIn: 10000});
    }

    errorResponse(error,res){
        let err = {
            status : 'failed',
            statusCode: error.statusCode,
            Error: {
                message: error.message
            }
        }

        res.status(error.statusCode).json(err);
    }

    validationData(req){
        return new Promise((resolve)=>{
            let result = validationResult(req);
            if(!result.isEmpty()){
                let errors=[];
                result.array().forEach(err =>{
                    errors.push(err.msg);
                });
                req.errors = errors;
                resolve(false);
            }
            resolve(true);
        });
    }
    
}

module.exports = Controller;