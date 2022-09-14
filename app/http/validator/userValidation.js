let {check} = require('express-validator');

class userValidation {
    checkRegister(){
        return[
            check('name')
                .notEmpty()
                .withMessage('نام را وارد کنید.'),
            check('email')
                .isEmail()
                .withMessage('ایمیل را وارد کنید.'),
            check('password')
                .notEmpty()
                .withMessage('رمز ورود را وارد کنید.')
        ]
    }
}

module.exports = new userValidation;