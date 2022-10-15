const autoBind = require("auto-bind");
const { validationResult } = require("express-validator");
const createHttpError = require("http-errors");

class Validation {

    constructor(){
        autoBind(this);
    }

    async validation(req,res,next){
        if (!await this.#validationData(req)) {
            return this.#errorResponse(createHttpError.BadRequest(req.errors), res);
        }
        next();
    }

    #errorResponse(error,res){
        let err = {
            status : 'failed',
            statusCode: error.statusCode,
            Error: {
                message: error.message
            }
        }

        res.status(error.statusCode).json(err);
    }

    
    #validationData(req){
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

}


module.exports = new Validation()