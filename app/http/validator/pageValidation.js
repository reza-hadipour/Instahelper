let {body,check, param} = require('express-validator');
const Validator = require('./validator');

const pageModel = require('../../models/pageModel');

class pageValidation extends Validator{
    addPage(){
        return[
            body('username')
                .notEmpty()
                    .withMessage('نام کاربری نباید خالی باشد.')
                .custom( async (username,{req})=>{
                    let page = await pageModel.findOne({username});
                    if(page) throw new Error('نام کاربری تکراری است.');
                    // let checkCharacter = this.hasSpecialSymbol(username);
                    if(username){
                        if(this.hasSpecialSymbol(username)) throw new Error('نام کاربری نمیتواند شامل کاراکترهای خاص باشد. مثال: `~!@#$%^&*?');
                    }
                })
        ]
    }

    
}

module.exports = new pageValidation;