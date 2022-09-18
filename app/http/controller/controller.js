const autoBind = require('auto-bind');
const {validationResult} = require('express-validator');


class Controller {
    constructor(){
        autoBind(this);
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