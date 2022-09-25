let {body,check, param} = require('express-validator');
const Validator = require('./validator');
const jwt = require('jsonwebtoken');

const userModel = require('../../models/user');

class userValidation extends Validator{
    checkRefreshToken(){
        return[
            body('refreshToken')
                .notEmpty()
                    .withMessage('توکن بازیابی یافت نشد.')
        ]
    }
    
    checkRegister(){
        return[
            body('name')
                .notEmpty()
                    .withMessage('نام را وارد کنید.'),
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
                .custom((resetToken)=>{
                    console.log('REset TOken:', resetToken);
                    jwt.verify(resetToken,configs.jwt.resetPassSecret,async (err)=>{
                        if(err) {
                            console.log('Error in validation');
                            throw new Error('Invalid Token');
                        }
                    })
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