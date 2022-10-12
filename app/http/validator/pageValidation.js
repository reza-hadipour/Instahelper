let {body, check, param} = require('express-validator');
const Validator = require('./validator');
const path = require('path');

// Models
const pageModel = require('../../models/pageModel');

class pageValidation extends Validator {
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
            param('id')
            .notEmpty()
            .withMessage('شناسه صفحه مورد نظر را وارد کنید.')
            .custom(async (pageId, {req}) => {
                if (!this.isMongoId(pageId)) 
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


}

module.exports = new pageValidation;
