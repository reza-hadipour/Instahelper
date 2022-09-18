const Controller = require("../controller");
const createHttpError = require("http-errors");
const {validationResult} = require('express-validator');

const { randomNumberGenerator,normalizeData } = require("../../../../helpers");

// Models
const userModel = require('../../../models/user');


class loginController extends Controller{
    async getOtp(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }
        
        try {
            let {mobile} = req.body;
            let otp = {
                code: randomNumberGenerator(),  // xxx-xxx
                expiresIn: new Date().getTime() + 10*60000 // +10 min
            }
            const result = await this.saveUser(mobile,otp);
            if(!result) throw createHttpError.BadRequest('ورود شما با خطا مواجه شد.');

            ////// >>>>>>>>>>  SEND SMS FUNCTION  <<<<<<<<<<<<<<<<  ///////

            res.json({
                status: "success",
                message : "کد یکبار مصرف برای شما ارسال شد.",
                code : otp.code,
                mobile
            });

        } catch (error) {
            next(createHttpError.BadRequest(error.message));
        }
    }

    async checkOtp(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        try {
            let {mobile,code} = req.body;
            let user = await userModel.findOne({$and: [{mobile},{'otp.code' : Number(code)}]});
            if(!user) return this.errorResponse(createHttpError.Unauthorized('اطلاعات وارد شده صحیح نمی باشد.'),res);
            if((new Date().getTime()) > user.otp.expiresIn){
                await this.clearOtp(user);
                return this.errorResponse(createHttpError.Unauthorized('کد یکبارمصرف شما منقضی شده است.'),res);
            }

            await this.clearOtp(user);

            ////// >>>>>>>>>>>>> Create Token
            return res.json(user);
            
        } catch (error) {
            next(createHttpError.BadRequest(error.message));

        }
    }

    async clearOtp(user){
        user.otp = {};
        await user.save();
    }

    async saveUser(mobile,otp){
        if(await this.checkExistUser(mobile)){
            // Update the found user
            return (await this.updateUser(mobile,otp));
        }else{
            // Create new user
            let user = await new userModel({
                mobile,
                otp
            });
            return !!(await user.save(err=>{
                if(err) throw createHttpError.InternalServerError(err.message);
            }));
        }
    }

    async checkExistUser(mobile){
        let result = await userModel.findOne({mobile});
        return !!result;
    }

    async updateUser(mobile,objectData = {}){
        let data = normalizeData(objectData);
        const updateResult = await userModel.updateOne({mobile},{$set: {otp: data}});
        return !!updateResult.modifiedCount;
    }

}

module.exports = new loginController;