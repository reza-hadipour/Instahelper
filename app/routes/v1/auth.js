const router = require('express').Router();

// Controllers
const registerController = require('../../http/controller/auth/registerController');
const loginController = require('../../http/controller/auth/loginController');

// Validators
const {checkRegister, checkGetOtp, checkOtp} = require('../../http/validator/userValidation');

// Login
router.get('/login',(req,res,next)=>{
    res.json({
        'Path' : 'Login'
    })
})

// Login using OTP - Step 1 - getting code
router.post('/login/getotp', checkGetOtp() , loginController.getOtp);
router.post('/login/otp', checkOtp(), loginController.checkOtp);

// Register
router.post('/register',checkRegister(),registerController.regiser)

module.exports = router;