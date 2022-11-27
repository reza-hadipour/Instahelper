let {body,check, param} = require('express-validator');
const Validator = require('./validator');
const jwt = require('jsonwebtoken');

const userModel = require('../../models/userModel');

class userValidation extends Validator{
    checkRefreshToken(){
        return[
            body('refreshToken')
                .notEmpty()
                    .withMessage('توکن بازیابی یافت نشد.')
        ]
    }

    checkEditProfile(){
        return[
            body('name').custom(value=>{
                if(value != undefined){
                    if(value.length > 0){
                        return true
                    }else{
                        throw new Error('مقدار نام نمی تواند خالی باشد.');
                    }
                }else{
                    return true;
                }
            }),
            body('family').custom(value=>{
                if(value != undefined){
                    if(value.length > 0){
                        return true
                    }else{
                        throw new Error('مقدار نام خانوادگی نمی تواند خالی باشد.');
                    }
                }else{
                    return true;
                }
            }),
            body('mobile')
            .custom(async (value,{req})=>{

                if(value != undefined){
                    
                    if(! new RegExp('^(\\+{1})(\\d{12})$').test(value)){
                        throw new Error('فرمت ارسالی شماره موبایل صحیح نیست. مثال: +989123456789');
                    }

                    let user = await userModel.findOne({$and:[{'_id' : {$ne : req.user.id}},{"mobile":value}]});
                    if(user) throw new Error('موبایل وارد شده تکراری است');
                }else{
                    return true;
                }

            })
        ]
    }
    
    checkRegister(){
        return[
            body('name')
                .notEmpty()
                    .withMessage('نام را وارد کنید.'),
            body('family')
                .notEmpty()
                    .withMessage('نام خانوادگی را وارد کنید.'),
            body('email')
                .isEmail()
                    .withMessage('ایمیل را وارد کنید.')
                .custom(async (value)=>{
                    let user = await userModel.findOne({"email":value});
                    if(user) throw new Error('ایمیل وارد شده تکراری است');
                }),
            body('password')
                .notEmpty()
                    .withMessage('رمز ورود را وارد کنید.')
                .isLength({min:8})
                    .withMessage('طول رمزعبور باید حداقل 8 کاراکتر باشد.')
                // .custom((value)=>{  // Check for Special Characters
                //     let result = value.split('').some(hasSpecialSymbol);
                //     if(!result) throw new Error('رمزعبور باید شامل حداقل یک کاراکتر خاص (!@#$%^&*) باشد.')
                //     return
                // })
                // .custom(value=>{    // Check for Password Conditions => Has Uppercase, Lowercase, Number and Special Characters.
                //     if(!this.checkPasswordConditions(value)) return new Error('رمزعبور ضعیف است.')
                //     return
                // })
                .matches('[0-9]')
                    .withMessage('رمزعبور باید دارای حداقل یک عدد باشد.')
                .matches('[A-Z]')
                    .withMessage('رمزعبور باید دارای حروف بزرگ باشد.')
                .matches('[a-z]')
                    .withMessage('رمزعبور باید دارای حروف کوچک باشد.')
                .matches('[ !"#$%&\'()*+,\-./:;<=>?@[\\\]^_`{|}~]')
                    .withMessage('رمزعبور باید شامل حداقل یک کاراکتر خاص (!@#$%^&*) باشد.'),
            body('mobile')
                .notEmpty()
                    .withMessage('شماره موبایل را وارد کنید.')
                .matches('^(\\+{1})(\\d{12})$')
                    .withMessage('فرمت ارسالی شماره موبایل صحیح نیست. مثال: +989123456789')
                .custom(async (value)=>{
                    let user = await userModel.findOne({"mobile":value});
                    if(user) throw new Error('موبایل وارد شده تکراری است');
                })
        ]
    }

    checkGetOtp(){
        return [
            body('mobile')
            .matches('^(\\+{1})(\\d{12})$')
                .withMessage('فرمت ارسالی شماره موبایل صحیح نیست. مثال: +989123456789')
        ]
    }

    checkOtp(){
        return[
            body('mobile')
                .matches('^(\\+{1})(\\d{12})$')
                    .withMessage('فرمت ارسالی شماره موبایل صحیح نیست. مثال: +989123456789'),
            body('code')
                .matches('^\\d{6}$')
                    .withMessage('رمز یکبار مصرف را وارد کنید.')
        ]
    }

    checkLogin(){
        return[
            body('email')
                .isEmail()
                    .withMessage('ایمیل را وارد کنید.'),
            body('password')
                .isLength({min:3})
                    .withMessage('رمبز عبور را وارد کنید.')
                
            
        ]
    }
    
    checkSendResetPassword(){
        return [
            body('email')
                .isEmail()
                    .withMessage('ایمیل را وارد کنید.')
        ]
    }

    checkResetPassword(){
        return [
            param('resetToken')
                .custom(async (resetToken)=>{
                    let result = await jwt.verify(resetToken,configs.jwt.resetPassSecret);
                    if(!result){
                        throw new Error('توکن نامعتبر است.');
                    }
            }),
            body('newPassword')
            .notEmpty()
                .withMessage('رمز ورود را وارد کنید.')
            .isLength({min:8})
                .withMessage('طول رمزعبور باید حداقل 8 کاراکتر باشد.')
            .matches('[0-9]')
                .withMessage('رمزعبور باید دارای حداقل یک عدد باشد.')
            .matches('[A-Z]')
                .withMessage('رمزعبور باید دارای حروف بزرگ باشد.')
            .matches('[a-z]')
                .withMessage('رمزعبور باید دارای حروف کوچک باشد.')
            .matches('[ !"#$%&\'()*+,\-./:;<=>?@[\\\]^_`{|}~]')
                .withMessage('رمزعبور باید شامل حداقل یک کاراکتر خاص (!@#$%^&*) باشد.'),
        ]
    }

    
}

module.exports = new userValidation;