const Controller = require("../controller");
const createHttpError = require("http-errors");
const {validationResult} = require('express-validator');

const { randomNumberGenerator } = require("../../../../helpers");

// Models
const userModel = require('../../../models/user');

class registerController extends Controller{
    async regiser(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }

        let user = new userModel(req.body);
            user.password = user.hashPassword(user.password);
            user.otp = {
                code : randomNumberGenerator() , // xxx-xxx
                expiresIn : new Date().getTime() + 10*60000   // 10 Min
            }
            user.save(err=>{
                if(err) {
                    debug(err);
                    return res.json(createHttpError.InternalServerError(err));
                }
                res.json({
                    status: "success",
                    user : {
                        name : user.name,
                        family : user.family,
                        email : user.email,
                        mobile: user.mobile,
                        opt : user.otp
                    }
                });
            });
    }


}

module.exports = new registerController;