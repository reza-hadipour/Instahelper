const Validator = require('../validator');
const {query, body} = require('express-validator');

class requestsValidator extends Validator {
    showRequests(){
        return [
            query('page').custom(pageId => {
                if(pageId){
                    if(Validator.isMongoId(pageId)){
                        return true;
                    }else{
                        throw new Error('شناسه پست وارد شده معتبر نمی باشد.')
                    }
                }else{
                    return true;
                }
            })
        ]
    }

    acceptOrRejectRequests(){
        return [
            query('page').custom(pageId => {
                if(pageId){
                    if(!Validator.isMongoId(pageId)){
                        throw new Error('شناسه پست وارد شده معتبر نمی باشد.')
                    }
                    return true;
                }else{
                    return true;
                }
            }),
            body('requests').custom(async (reqIds)=>{
                if(reqIds){
                    let multireqIds = [];
                    if (typeof reqIds == 'string'){
                        multireqIds.push(...reqIds.split(','));
                    }else{
                        multireqIds = reqIds;
                    }
        
                    if(!multireqIds.every(Validator.isMongoId)) {
                        throw new Error('شناسه درخواست های ارسالی صحیح نمی باشد.');
                    }
                }else{
                    return true;
                }
            })
        ]
    }

}

module.exports = new requestsValidator;