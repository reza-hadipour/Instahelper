const router = require('express').Router();

// Controllers
const registerController = require('../../http/controller/auth/registerController');

// Validators
const userValidation = require('../../http/validator/userValidation');

// Login
router.get('/login',(req,res,next)=>{
    res.json({
        'Path' : 'Login'
    })
})


// Register
router.post('/register',userValidation.checkRegister(),registerController.regiser)

module.exports = router;