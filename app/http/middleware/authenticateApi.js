const createHttpError = require('http-errors');
const passport = require('passport');

class authenticateApi{
    handle(req,res,next){
        passport.authenticate('jwt',{session:false},(err,user,info)=>{
            if(err || !user){
                let response = createHttpError.Unauthorized('اجازه دسترسی ندارید.');
                return res.status(response.statusCode).json({
                    status : "failed",
                    Error: {
                        message : response.message,
                        info
                    }
                })
            }
            req.user = user;
            next();
        })(req,res,next);
    }
}

module.exports = new authenticateApi();