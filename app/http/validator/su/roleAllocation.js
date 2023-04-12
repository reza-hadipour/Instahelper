const {body,param} = require('express-validator');
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

    getUserRoles(){
        return [
            param('id')
                .notEmpty()
                .withMessage('شناسه کاربر را وارد کنید.')
                .custom( id => {
                    if(id){
                        if(!Validator.isMongoId(id)){
                            throw new Error('شناسه کاربر معتبر نمی باشد.');
                        }
                    }
                    return true;
                })
        ]
    }

    updateUserRole(){
        return [
            param('id')
                .notEmpty()
                .withMessage('شناسه کاربر باید وارد شود.')
                .custom( id => {
                    if(id){
                        if(!Validator.isMongoId(id)){
                            throw new Error('شناسه وارد شده کاربر معتبر نمی باشد.')
                        }else{
                            return true;
                        }
                        
                    }else{
                        return true;
                    }
                })
        ],

        body('role')
            .custom( role => {
                if(role){
                    let userRole = [];
                    if( typeof role == 'string'){
                        userRole.push(...role.split(','));
                    }else{
                        userRole = role;
                    }
    
                    let result = userRole.filter( role => {
                        if (!Validator.isMongoId(role)) return role;
                    });
    
                    if( !! result.length ){
                        throw new Error(`شناسه نقش (${result}) معتبر نمی باشد.`);
                    }
                }
                return true;
            })
    }
}

module.exports = new roleAllocation;