const {param, body} = require('express-validator');
const Validator = require('../validator');

class roles extends Validator{
    addRole(){
        return [
            body('name')
                .notEmpty()
                .withMessage('نام نقش را وارد کنید.')
            ,
            body('permissions')
            .custom(id => {
                if(id){
                    let permissionIds = [];
                    if( typeof id == 'string'){
                        permissionIds.push(...id.split(','));
                        permissionIds.forEach(permId=>{
                            if(! Validator.isMongoId(permId)){
                                throw new Error('شناسه مجوز وارد شده مجاز نیست.')
                            }
                        })
                    }else{
                        id.forEach(permId=>{
                            if(! Validator.isMongoId(permId)){
                                throw new Error('شناسه مجوز وارد شده مجاز نیست.')
                            }
                        })
                    }
                }
                return true;
            })
        ]
    }

    editRole(){
        return [
            param('id').notEmpty()
            .withMessage('شناسه نقش مورد نظر را وارد کنید.')
            .custom(id => {
                if(! Validator.isMongoId(id)){
                    throw new Error('شناسه نقش معتبر نمی باشد.')
                }
                return true;
            }),
            body('permissions')
            .custom(id => {
                if(id){
                    let permissionIds = [];
                    if( typeof id == 'string'){
                        permissionIds.push(...id.split(','));
                        permissionIds.forEach(permId=>{
                            if(! Validator.isMongoId(permId)){
                                throw new Error('شناسه مجوز وارد شده مجاز نیست.')
                            }
                        })
                    }else{
                        id.forEach(permId=>{
                            if(! Validator.isMongoId(permId)){
                                throw new Error('شناسه مجوز وارد شده مجاز نیست.')
                            }
                        })
                    }
                }
                return true;
            })
                
        ]
    }

    removeRole(){
        return [
            param('id').notEmpty()
            .withMessage('شناسه نقش مورد نظر را وارد کنید.')
            .custom(id => {
                if(! Validator.isMongoId(id)){
                    throw new Error('شناسه نقش معتبر نمی باشد.')
                }
                return true;
            })
                
        ]
    }
    
    
}


module.exports = new roles;