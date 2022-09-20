const Controller = require("../controller");
const createHttpError = require("http-errors");
const {validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

const { normalizeData } = require("../../../../helpers");

// Models
const userModel = require('../../../models/user');
const configs = require("../../../../configs");

class loginController extends Controller{
    constructor(){
        super();
    }

    async login(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }

        try {
            let {email,password} = req.body;
            let user = await userModel.findOne({email});

            if(!user || !user.comparePassword(password)) return this.errorResponse(createHttpError.Unauthorized('اطلاعات وارد شده صحیح نمی باشد.'),res);

            if(!user?.verifyed) return this.errorResponse(createHttpError.Unauthorized('حساب کاربری تایید نشده است. مجدد درخواست ارسال کد یکبارمصرف را بدهید.'),res);

            ////// >>>>>>>>>>>>> Create Token
            let accessToken = this.createTokne(user.id);
            let refreshToken = await this.createRefreshTokne(user);

            // Store Refresh Token in User
            // user.refreshToken = refreshToken;
            // await user.save();

            return res.json({
                status: "success",
                Tokens:{
                    accessToken,
                    refreshToken
                },
                user:{
                    id : user.id,
                    name: user.name,
                    family : user.family,
                    email : user.email
                }
            });
            
        } catch (error) {
            next(createHttpError.BadRequest(error.message));
        }
    }

    async logOut(req,res,next){
        let result = await this.jwtr.destroy(req.user.mobile)
        
        res.json({
            status: 'success',
            safeLogOut : result
        });
    }

    async resendOtp(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }

        let {mobile} = req.body;

        let user = await userModel.findOne({mobile});
    
        if(!user) return this.errorResponse(createHttpError.Unauthorized('اطلاعات وارد شده صحیح نمی باشد.'),res); 

        let otp = this.createOtp();

        user.otp = otp;
        await user.save();

        ////// >>>>>>>>>>  SEND SMS FUNCTION  <<<<<<<<<<<<<<<<  ///////

        res.json({
            status: "success",
            mobile,
            code : otp.code,
            message : "کد یکبار مصرف برای شما ارسال شد."
        });
    }

    async refreshToken(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }

        try {
            let {refreshToken} = req.body;

            this.jwtr.verify(refreshToken,configs.jwt.refreshTokenSecret)
                .then(async (decoded)=>{
                    console.log(decoded);
                    let user = await userModel.findById(decoded.userId);
                
                    if(!user) return this.errorResponse(createHttpError.NotFound('کاربر یافت نشد.'),res);

                    let accessToken = this.createTokne(user.id);

                    return res.json({
                        status: "success",
                        accessToken
                    });

                })
                .catch(err=>{
                    console.log('invalid token');
                    if(err) return this.errorResponse(createHttpError.BadRequest('توکن نامعتبر است.'),res);
                });

        } catch (error) {
            next(error);
        }

    }


    async getOtp(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res)
        }
        
        try {
            let {mobile} = req.body;

            let otp = this.createOtp();
            const result = await this.saveUser(mobile,otp);
            
            if(!result) throw createHttpError.BadRequest('ورود شما با خطا مواجه شد.');

            ////// >>>>>>>>>>  SEND SMS FUNCTION  <<<<<<<<<<<<<<<<  ///////

            res.json({
                status: "success",
                mobile,
                code : otp.code,
                message : "کد یکبار مصرف برای شما ارسال شد."
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
            let accessToken = this.createTokne(user.id)
            let refreshToken = await this.createRefreshTokne(user);

            // Verify the user account and store refreshToken
            user.verifyed = true;
            await user.save();

            return res.json({
                status: "success",
                Tokens:{
                    accessToken,
                    refreshToken
                }
            });
            
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