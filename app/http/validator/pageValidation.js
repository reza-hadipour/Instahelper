let {body,check, param} = require('express-validator');
const Validator = require('./validator');
const path = require('path');

// Models
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
                }),
            body('pageimage')
                .custom(async (value,{req}) => {
                    if(value){
                        let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
                        if(!fileExt.includes(path.extname(req?.body?.pageimage||'').toUpperCase())){
                            throw new Error('فرمت تصویر ارسالی مجاز نیست. فرمت های قابل قبول: *.png *.jpg *.jpeg *.svg');
                        }
                    }
                    if(req?.file){
                        if(req?.file?.size >= (1024*1024)){
                            throw new Error('حجم تصویر نباید از 1 مگابایت بیشتر باشد.');
                        }
                    }
                })
        ]
    }
    editPage(){
        return[
            body('pageimage')
                .custom(async (value,{req}) => {
                    if(value){
                        let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
                        if(!fileExt.includes(path.extname(req?.body?.pageimage||'').toUpperCase())){
                            throw new Error('فرمت تصویر ارسالی مجاز نیست. فرمت های قابل قبول: *.png *.jpg *.jpeg *.svg');
                        }
                    }
                    if(req?.file){
                        if(req?.file?.size >= (1024*1024)){
                            throw new Error('حجم تصویر نباید از 1 مگابایت بیشتر باشد.');
                        }
                    }
                })
        ]
    }

    
}

module.exports = new pageValidation;