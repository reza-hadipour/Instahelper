const autoBind = require('auto-bind');
const {validationResult} = require('express-validator');

const { randomNumberGenerator } = require('../../../helpers');

const isMongoID = require('validator/lib/isMongoId');

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

    async storeOtp(user,otp){
        user.otp = otp;
        await user.save();
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

    successPrams(){
        return {
            status: "success",
            statusCode: 200
        }
    }

    successResponse(message,res){
        let response = {
            status : 'success',
            statusCode: 200,
            message
        }

        res.status(200).json(response);
    }

    validationData(req){
        return new Promise((resolve)=>{
            let result = validationResult(req);
            if(!result.isEmpty()){
                let errors=[];
                result.array().forEach(err =>{
                    errors.push(`${err.param}: ${err.msg}`);
                });
                req.errors = errors;
                resolve(false);
            }
            resolve(true);
        });
    }

    isMongoId(mongoId,res){
        if(!isMongoID(mongoId)){
            req.errors = "آی دی صفحه معتبر نمی باشد."
            this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }
    }
    
}

module.exports = Controller;