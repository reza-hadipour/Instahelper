const {param, body} = require('express-validator');
const Validator = require('../validator');

class pages extends Validator{
    addComment(){
        return [
            param('post')
            .custom(postId => {
                if(postId){
                    if(Validator.isMongoId(postId)){
                        return true
                    }else{
                        throw new Error('شناسه پست وارد شده معتبر نمی باشد.')
                    }
                }else{
                    throw new Error('شناسه پست مورد نظر وارد نشده است.')
                }
            }),
            body('comment')
            .notEmpty()
            .withMessage('نظر خودر را وارد کنید.')
        ]
    }

    addSubComment(){
        return [
            param('comment')
            .custom(commentId => {
                if(commentId){
                    if(Validator.isMongoId(commentId)){
                        return true
                    }else{
                        throw new Error('شناسه کامنت وارد شده معتبر نمی باشد.')
                    }
                }else{
                    throw new Error('شناسه کامنت مورد نظر وارد نشده است.')
                }
            }),
            body('comment')
            .notEmpty()
            .withMessage('نظر خود را وارد کنید.')
        ]
    }
    
}


module.exports = new pages;