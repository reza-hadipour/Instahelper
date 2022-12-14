let {body, check, param} = require('express-validator');
const Validator = require('./validator');
const path = require('path');

// Models
const pageModel = require('../../models/pageModel');

class pageValidation extends Validator {
    
    showPosts() {
        return [
            param('page').notEmpty().withMessage('شناسه صفحه را وارد کنید.'),
            param('page').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه صفحه معتبر نمی باشد.');
                    }else{
                        return true;
                    }
                }else{
                    return true;
                }
            })
            ]
    }

    addPage() {
        return [
            body('username').notEmpty()
            .withMessage('نام کاربری نباید خالی باشد.')
            .custom(async (username, {req}) => {
                let page = await pageModel.findOne({username});
                if (page) 
                    throw new Error('نام کاربری تکراری است.');
                
                // let checkCharacter = this.hasSpecialSymbol(username);
                if (username) {
                    if (this.hasSpecialSymbol(username)) 
                        throw new Error('نام کاربری نمیتواند شامل کاراکترهای خاص باشد. مثال: `~!@#$%^&*?');
                    
                }
            }),
            body('pageimage')
            .custom(async (value, {req}) => {
                if (value) {
                    let fileExt = ['.PNG', '.JPG', '.JPEG', '.SVG'];
                    if (! fileExt.includes(path.extname(req ?. body ?. pageimage || '').toUpperCase())) {
                        throw new Error('فرمت تصویر ارسالی مجاز نیست. فرمت های قابل قبول: *.png *.jpg *.jpeg *.svg');
                    }
                }
                if (req ?. file) {
                    if (req ?. file ?. size >= (CONSTS.PAGE_MAX_FILE_SIZE)) {
                        throw new Error(`حجم تصویر نباید از ${CONSTS.PAGE_MAX_FILE_SIZE / 1048576} مگابایت بیشتر باشد.`);
                    }
                }
            })
        ]
    }
    editPage() {
        return [
            param('page')
            .notEmpty()
            .withMessage('شناسه صفحه مورد نظر را وارد کنید.')
            .custom(async (pageId, {req}) => {
                if (!Validator.isMongoId(pageId)) 
                    throw new Error('آی دی صفحه معتبر نمی باشد.');
                
                let page = await pageModel.findOne({_id: pageId, owner: req.user.id});
                if (! page) 
                    throw new Error('صفحه مورد نظر پیدا نشد.');
                
            }),
            body('pageimage')
            .custom(async (value, {req}) => {
                if (value) {
                    let fileExt = ['.PNG', '.JPG', '.JPEG', '.SVG'];
                    if (! fileExt.includes(path.extname(req ?. body ?. pageimage || '').toUpperCase())) {
                        throw new Error('فرمت تصویر ارسالی مجاز نیست. فرمت های قابل قبول: *.png *.jpg *.jpeg *.svg');
                    }
                }
                if (req ?. file) {
                    if (req ?. file ?. size >= (CONSTS.PAGE_MAX_FILE_SIZE)) {
                        throw new Error(`حجم تصویر نباید از ${CONSTS.PAGE_MAX_FILE_SIZE / 1048576} مگابایت بیشتر باشد.`);
                    }
                }
            })
        ]
    }

    removePageImage() {
        return [
            param('page')
            .notEmpty()
            .withMessage('شناسه صفحه مورد نظر را وارد کنید.')
            .custom(async (pageId, {req}) => {
                if (!Validator.isMongoId(pageId)) 
                    throw new Error('شناسه صفحه معتبر نمی باشد.');
                return true;
            })
        ]
    }

    removePage() {
        return [
            param('page')
            .notEmpty()
            .withMessage('شناسه صفحه مورد نظر را وارد کنید.')
            .custom(async (pageId, {req}) => {
                if (!Validator.isMongoId(pageId)) 
                    throw new Error('شناسه صفحه معتبر نمی باشد.');
                return true;
            })
        ]
    }

    activationPage() {
        return [
            param('page')
            .notEmpty()
            .withMessage('شناسه صفحه مورد نظر را وارد کنید.')
            .custom(async (pageId, {req}) => {
                if (!Validator.isMongoId(pageId)) 
                    throw new Error('شناسه صفحه معتبر نمی باشد.');
                return true;
            })
            
        ]
    }


}

module.exports = new pageValidation;
