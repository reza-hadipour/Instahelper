const {body} = require('express-validator');
const Validator = require('../../validator/validator');

class roleAllocation extends Validator{

    allocationRole(){
        return [
            body('users')
                .notEmpty()
                .withMessage('شناسه کاربر را وارد کنید.')
                .custom( (users) => {
                    if(users){
                        let usersId = [];
                        if( typeof users == 'string'){
                            usersId.push(...users.split(','));
                        }else{
                            usersId = users;
                        }

                        let result = usersId.filter(id => {
                            if(! Validator.isMongoId(id)) return id;
                        })

                        if(!! result.length){
                            throw new Error(`شناسه کاربر (${result}) معتبر نمی باشد.`);
                        }
                    }
                    return true;
                }),

            body('roles')
                .notEmpty()
                .withMessage('شناسه نقش را وارد کنید')
                .custom( roles => {
                    if(roles){
                        let rolesId = [];
                        if( typeof roles == 'string'){
                            rolesId.push(...roles.split(','));
                        }else{
                            rolesId = roles;
                        }

                        let result =  rolesId.filter(id => {
                            if(! Validator.isMongoId(id)) return id
                        })

                        if(!! result.length){
                            throw new Error(`شناسه نقش (${result}) معتبر نمی باشد.`);
                        }
                    }
                    return true;
                })
        ]
    }
}

module.exports = new roleAllocation;