let {check} = require('express-validator');
const Validator = require('./validator');

const userModel = require('../../models/user');

class userValidation extends Validator{
    checkRegister(){
        return[
            check('name')
                .notEmpty()
                    .withMessage('نام را وارد کنید.'),
            check('email')
                .isEmail()
                    .withMessage('ایمیل را وارد کنید.')
                .custom(async (value)=>{
                    let user = await userModel.findOne({"email":value});
                    if(user) throw new Error('ایمیل وارد شده تکراری است');
                }),
            check('password')
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
            check('mobile')
                .matches('^(\\+{1})(\\d{12})$')
                    .withMessage('فرمت ارسالی شماره موبایل صحیح نیست. مثال: +989123456789')
                .custom(async (value)=>{
                    let user = await userModel.findOne({"mobile":value});
                    if(user) throw new Error('موبایل وارد شده تکراری است');
                }),
                
                
        ]
    }
}

module.exports = new userValidation;