const Controller = require('../controller');

// Models
const userModel = require('../../../models/userModel');
const pageModel = require('../../../models/pageModel');
const createHttpError = require('http-errors');

class UserController extends Controller{
    
    async showProfile(req,res,next){
        let userId = req?.user?.id;

        let user = await userModel.findById(userId,{},{select : '-password -otp -refreshToken'})
        .populate([
            {
                path : 'pages',
                select : ['title','username','description','status','active'],
            },
            {
                path : 'followings',
                select : ['title','username','description'],
                match : {'active': true}
            }
        ]).exec();

        if(user){
            let followingCount = await pageModel.estimatedDocumentCount({$in : {'followers' : userId}})
            user._doc.followingCount = followingCount;
            return res.json({
                ...this.successPrams(),
                user
            });
        }else{
            return this.errorResponse(createHttpError.NotFound('User data not found'),res);
        }

    }

    async editProfile(req,res,next){
        let userId = req.user.id;

        let unchangableItems = ['role','email','verifyed','createdAt','updatedAt','id','_id','pages','followings'];

        Object.keys(req?.body).forEach(key => {
            if(unchangableItems.includes(key)){
                delete req.body[key];
            }
        });

        
        try {      
            let body = req.body;
            let result = await userModel.findByIdAndUpdate(userId,body,{rawResult : true, returnOriginal: false , new: true});
            let {email,mobile,fullname} = result?.value;

            return res.json({
                ...this.successPrams(),
                fullname,email,mobile
            });

        } catch (error) {
            debugDB(error);
            return this.errorResponse(createHttpError.BadRequest('ویرایش انجام نشد.'),res);
        }

    }

}

module.exports = new UserController;