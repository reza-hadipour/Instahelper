const createHttpError = require("http-errors");
const Controller = require("../controller");
const userModel = require("../../../models/user");
const resetPasswordModel = require('../../../models/resetPassword');
const jwt = require("jsonwebtoken");
const {JsonWebTokenError} = require('jsonwebtoken').JsonWebTokenError;

class resetPassword extends Controller {

    async createResetPassword(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }
        
        let {email} = req.body;
        let user = await userModel.findOne({email});
        if(!user) return this.errorResponse(createHttpError.NotFound('کاربر مورد نظر یافت نشد.'),res);

        let resetToken = jwt.sign({userId : user.id},configs.jwt.resetPassSecret,{expiresIn: new Date().getTime() + 3600});

        
        let resetPassword = new resetPasswordModel({resetToken});
        await resetPassword.save();
        return res.json({
            status: 'Success',
            resetTokenLink : `${configs.host}:${configs.port}/auth/resetPassword/${resetToken}`
        })
    }

    async resetPassword(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }
        
        let {resetToken} = req.params;
        let {newPassword} = req.body;

        let resetPass = await resetPasswordModel.findOne({resetToken});
        if(!resetPass) { return this.errorResponse({Error: 'Your token is used once.'},res)};
        
        jwt.verify(resetToken,configs.jwt.resetPassSecret,async (err,decoded)=>{
            if(err) {
                return this.errorResponse(createHttpError.BadRequest('Invalid Token'),res);
            }


            let {userId} = decoded;
            let user = await userModel.findById(userId);
            if(!user) return this.errorResponse(createHttpError.NotFound('کاربر پیدا نشد.'),res);
            user.password = user.hashPassword(newPassword);
            await user.save();

            resetPasswordModel.deleteOne({resetToken},(err,result)=>{
                return res.json({
                    status: 'success',
                    delete: result
                })
            })
        });
    }

}

module.exports = new resetPassword();