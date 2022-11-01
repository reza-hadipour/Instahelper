const router = require('express').Router();
const createHttpError = require('http-errors');
const passport = require('passport');

// Controllers
const registerController = require('../../http/controller/auth/registerController');
const loginController = require('../../http/controller/auth/loginController');
const resetPassword = require('../../http/controller/auth/resetPassword');

// Middleware
const authenticateApi = require('../../http/middleware/authenticateApi');

// Models
const userModel = require('../../models/userModel');

// Validators
const {checkRegister, checkGetOtp, checkOtp, checkLogin, checkRefreshToken, checkResetPassword, checkSendResetPassword} = require('../../http/validator/userValidation');


// Login    using email & password - recieve Token
router.post('/login',checkLogin(), loginController.login);

// Resend Otp Code
router.post('/resendOtp',checkGetOtp(),loginController.resendOtp);

// Refresh Token
router.post('/refreshToken',checkRefreshToken(),loginController.refreshToken);

// Test Token
router.get('/profile',authenticateApi.handle,async (req,res,next)=>{
    let user = await userModel.findById(req.user.id,{name:1, family : 1, mobile: 1,email : 1 , _id: 0});
    res.json(user);
});

// Login using OTP - Step 1 - recieve code
router.post('/login/getotp', checkGetOtp() , loginController.getOtp);

// Login using OTP - Step 2 - verifying the code
router.post('/login/otp', checkOtp(), loginController.checkOtp);

// Register
router.post('/register',checkRegister(),registerController.regiser)

// Logout
router.get('/logout', authenticateApi.handle, loginController.logOut);

// ResetPassword
router.post('/resetPassword', checkSendResetPassword() ,resetPassword.createResetPassword);
router.put('/resetPassword/:resetToken', checkResetPassword(), resetPassword.resetPassword);


module.exports = router;