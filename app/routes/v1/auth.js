const router = require('express').Router();
const createHttpError = require('http-errors');

// Controllers
const registerController = require('../../http/controller/auth/registerController');
const loginController = require('../../http/controller/auth/loginController');
const passport = require('passport');

// Middleware
const authenticateApi = require('../../http/middleware/authenticateApi');

// Validators
const {checkRegister, checkGetOtp, checkOtp, checkLogin} = require('../../http/validator/userValidation');
const userModel = require('../../models/user');


// Login    using email & password - recieve Token
router.post('/login',checkLogin(), loginController.login);

// Resend Otp Code
router.post('/resendOtp',checkGetOtp(),loginController.resendOtp);

// Test Token
router.get('/profile',authenticateApi.handle,async (req,res,next)=>{
    let user = await userModel.findById(req.user.id);
    res.json(user);
});

// Login using OTP - Step 1 - recieve code
router.post('/login/getotp', checkGetOtp() , loginController.getOtp);

// Login using OTP - Step 2 - verifying the code
router.post('/login/otp', checkOtp(), loginController.checkOtp);

// Register
router.post('/register',checkRegister(),registerController.regiser)

module.exports = router;