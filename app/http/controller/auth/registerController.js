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

        try {
            let user = new userModel(req.body);
            user.password = user.hashPassword(user.password);
            user.otp = this.createOtp();
            user.save(err=>{
                if(err) {
                    debug(err);
                    return res.json(createHttpError.InternalServerError(err));
                }

                ////// >>>>>>>>>>>  SEND OTP CODE TO Verify User Mobile

                res.json({
                    status: "success",
                    user : {
                        name : user.name,
                        family : user.family,
                        email : user.email,
                        mobile: user.mobile,
                        code: user.otp.code
                    },
                    message: 'Verify the user mobile number in .../auth/login/otp'
                });
            });
        } catch (error) {
            next(error);
        }
    }


}

module.exports = new registerController;