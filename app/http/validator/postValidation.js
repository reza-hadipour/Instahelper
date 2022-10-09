let {body,check, param} = require('express-validator');
const Validator = require('./validator');
const path = require('path');
const fs = require('fs');

// Models
const postModel = require('../../models/postModel');
const pageModel = require('../../models/pageModel');


class postValidation extends Validator{
    addPost(){
        return[
            param('page')
                .notEmpty()
                    .withMessage('شناسه صفحه والد نباید خالی باشد.')
                .custom(async (pageId,{req})=>{
                    if(pageId){
                        if(!this.isMongoId(pageId)) throw new Error('شناسه صفحه وارد شده معتبر نمی باشد.');
                        return true;
                    }
                }),
            body('title')
                .notEmpty()
                    .withMessage('عنوان پست نباید خالی باشد.')
                .custom(async (title,{req})=>{
                    let slug = this.slug(title);
                    let page = req?.params?.page;
                    if(page && this.isMongoId(page)){
                        let post = await postModel.findOne({page, slug})
                        if(post) throw new Error('عنوان پست در این صفحه تکراری است.');
                        return true;
                    }
                }),
            body('postimage')
                .custom(async (file,{req}) => {
                    // Check file size
                    if(req?.files.length > 0){
                        let sizeError = [];

                        for (const item of req.files) {
                            if(item.size >= (CONSTS.POST_MAX_FILE_SIZE)){
                                sizeError.push(item.originalname);
                            }
                        }

                        if (sizeError.length > 0) {
                            throw new Error(`حجم تصویر نباید از ${CONSTS.POST_MAX_FILE_SIZE/1048576} مگابایت بیشتر باشد. ${sizeError}`);
                        }

                    }
                })
                .custom(async (file,{req}) => {
                    // Check file limit
                    // if(req?.files.length > CONSTS.POST_MAX_FILE){
                    //     req.files.forEach((item,index)=>{
                    //         if(index > CONSTS.POST_MAX_FILE-1){
                    //             fs.unlinkSync(`${item.destination}/${item.filename}`);
                    //         }
                    //     });
                        // throw new Error(`تعداد تصاویر نباید بیشتر از ${CONSTS.POST_MAX_FILE} عکس باشد.`);
                    // }                    
                })
                .custom(async (postimage,{req})=>{
                        // Check file extentions
                        if(postimage)
                        {
                            let formatError = [];
                            Object.values(postimage).forEach(file => {
                                let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
                                if(!fileExt.includes(path.extname(file||'').toUpperCase())){
                                    formatError.push(file);
                                }
                            })

                            if(formatError.length > 0){
                                throw new Error(`فرمت تصویر ارسالی مجاز نیست. فرمت های قابل قبول: *.png *.jpg *.jpeg *.svg ${formatError}`);
                            }
                            
                        }
                    }
                )
        ]
    }

    editPost(){
        return [
            param('id')
                .custom(async(id,{req})=>{
                    if(id){
                        if(!this.isMongoId(id)) {
                            throw new Error('شناسه صفحه معتبر نمی باشد.')
                        }else{
                            let page = req?.params?.page;
                            if(this.isMongoId(page)){
                                let post = await postModel.findOne({page,id});
                                if(!post) throw new Error('پست مورد نظر یافت نشد.');
                                return true;
                            }
                        }

                    }
                }),
            param('page')
                .custom(async (page, {req})=>{
                    if(page){
                        if(!this.isMongoId(page)){
                            throw new Error('شناسه صفحه معتبر نمی باشد.');
                        }else{
                            let foundPage = await pageModel.findOne({owner: req.user.id, id: page});
                            if(!foundPage) throw new Error('این پست متعلق به شما نیست.')
                            return true;
                        }
                    }else{
                        throw new Error('شناسه صفحه را وارد کنید.');
                    }
                }),
                
             body('title')
                .custom(async (title,{req})=>{
                    let page = req?.params?.page;
                    let postId = req?.params?.id;
                    if(this.isMongoId(postId) && this.isMongoId(page)){
                        let slug = this.slug(title);
                        let posts = await postModel.find({page,slug}).exec();
                        if(posts.length > 0){
                            posts.forEach(post=>{
                                if(post.id != postId) throw new Error('عنوان پست تکراری است.');
                            })
                        }
                    }
                    return true
                })
        ]
    }


    removePost(){
        return [
            param('id')
                .custom(async(id,{req})=>{
                    if(id){
                        if(!this.isMongoId(id)) {
                            throw new Error('شناسه صفحه معتبر نمی باشد.')
                        }else{
                            return true;
                        }
                    }
                }),
            param('page')
                .custom(async (page, {req})=>{
                    if(page){
                        if(!this.isMongoId(page)){
                            throw new Error('شناسه صفحه معتبر نمی باشد.');
                        }else{
                            return true;
                        }
                    }else{
                        throw new Error('شناسه صفحه را وارد کنید.');
                    }
                })
        ]
    }

    addPostImage(){
        return [
            param('id')
                .custom(async(id,{req})=>{
                    if(id){
                        if(!this.isMongoId(id)) {
                            throw new Error('شناسه صفحه معتبر نمی باشد.')
                        }else{
                            return true;
                        }
                    }
                }),
            param('page')
                .custom(async (page, {req})=>{
                    if(page){
                        if(!this.isMongoId(page)){
                            throw new Error('شناسه صفحه معتبر نمی باشد.');
                        }else{
                            return true;
                        }
                    }else{
                        throw new Error('شناسه صفحه را وارد کنید.');
                    }
                }),
            body('postimage')
            .notEmpty()
                .withMessage('تصویری برای آپلود انتخاب کنید.')
            .custom(async (file,{req}) => {
                // Check file size
                if(req?.files?.length > 0){
                    let sizeError = [];

                    for (const item of req.files) {
                        if(item.size >= (CONSTS.POST_MAX_FILE_SIZE)){
                            sizeError.push(item.originalname);
                        }
                    }

                    if (sizeError.length > 0) {
                        throw new Error(`حجم تصویر نباید از ${CONSTS.POST_MAX_FILE_SIZE/1048576} مگابایت بیشتر باشد. ${sizeError}`);
                    }

                }
            })
            .custom(async (file,{req}) => {
                // Check file limit
                // if(req?.files.length > CONSTS.POST_MAX_FILE){
                //     req.files.forEach((item,index)=>{
                //         if(index > CONSTS.POST_MAX_FILE-1){
                //             fs.unlinkSync(`${item.destination}/${item.filename}`);
                //         }
                //     });
                    // throw new Error(`تعداد تصاویر نباید بیشتر از ${CONSTS.POST_MAX_FILE} عکس باشد.`);
                // }                    
            })
            .custom(async (postimage,{req})=>{
                    // Check file extentions
                    if(postimage)
                    {
                        let formatError = [];
                        Object.values(postimage).forEach(file => {
                            let fileExt = ['.PNG','.JPG','.JPEG','.SVG'];
                            if(!fileExt.includes(path.extname(file||'').toUpperCase())){
                                formatError.push(file);
                            }
                        })

                        if(formatError.length > 0){
                            throw new Error(`فرمت تصویر ارسالی مجاز نیست. فرمت های قابل قبول: *.png *.jpg *.jpeg *.svg ${formatError}`);
                        }
                        
                    }
                }
            )
        ]
    }
    
}

module.exports = new postValidation;