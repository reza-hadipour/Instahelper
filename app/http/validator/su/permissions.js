const {param, body} = require('express-validator');
const Validator = require('../../validator/validator');

class permissions extends Validator{
    addPermission(){
        return [
            body('name')
                .notEmpty()
                .withMessage('نام مجوز را وارد کنید.')
            ,
            body('label')
                .notEmpty()
                .withMessage('توضیحات مجوز را وارد کنید.')
        ]
    }

    editPermission(){
        return [
            param('id').notEmpty()
            .withMessage('شناسه مجوز مورد نظر را وارد کنید.')
            .custom(id => {
                if(! Validator.isMongoId(id)){
                    throw new Error('شناسه مجوز معتبر نمی باشد.')
                }
                return true;
            })
            ,
            body('name')
                .custom( name => {
                    if(name){
                        if( name?.length == 0) {
                            throw new Error('نام مجوز را وارد کنید.')
                        }else{
                            return true;
                        }
                    }else{
                        return true;
                    }
                })
            ,
            body('label')
                .custom( label => {
                    if(label){
                        // console.log(label.length);
                        if(label?.length == 0) {
                            throw new Error('توضیحات مجوز را وارد کنید.')
                        }else{
                            return true
                        }
                    }else{
                        return true;
                    }
                })
                
        ]
    }

    removePermission(){
        return [
            param('id').notEmpty()
            .withMessage('شناسه مجوز مورد نظر را وارد کنید.')
            .custom(id => {
                if(! Validator.isMongoId(id)){
                    throw new Error('شناسه مجوز معتبر نمی باشد.')
                }
                return true;
            })
                
        ]
    }
    
    
}


module.exports = new permissions;