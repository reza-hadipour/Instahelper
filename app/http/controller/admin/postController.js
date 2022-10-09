const createHttpError = require('http-errors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const unlink = require('fs').promises.unlink;

//controller
const Controller = require('../controller');

// Models
const pageModel = require('../../../models/pageModel');
const postModel = require('../../../models/postModel');

// Helper
const helpers = require('../../../../helpers');

'use strict';
class postController extends Controller{
    
    async addPost(req,res,next){
        if(!await this.validationData(req)){
            if(req?.files?.length> 0){    // Remove the file if it was stored
                for (const item of req.files) {
                    fs.unlinkSync(item.path);
                }
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        let owner = req.user.id;
        let pageId = req.params.page;

        // Find Page
        let page = await pageModel.findOne({owner, id: pageId});
        if(!page) return this.errorResponse(createHttpError.NotFound('این پست متعلق به شما نیست.'),res);

        if(req?.files.length > CONSTS.POST_MAX_FILE){
            req.files.forEach((item,index)=>{
                if(index > CONSTS.POST_MAX_FILE-1){
                    fs.unlinkSync(`${item.destination}/${item.filename}`);
                    delete req.files[index];
                }
            });

            req.files.length = CONSTS.POST_MAX_FILE;
        }    

        req.body.postimage = undefined;    // Clear postimage from postValidation
        
        let images = [];
        
        if(req.files.length > 0) { // if files were stored, transfer the images path into req.body
            images = await this.#imageResizeMulti(req.files);
            req.body.images = images;
            req.files.forEach(async (item)=>{
                fs.unlinkSync(`${item.destination}/${item.filename}`);
            });

        }else{
            // Set default images for new page
            images.push(CONSTS.POST_DEFAULT_THUBM);
            req.body.images = images;
        }
        
        req.body.slug = helpers.slug(req.body.title);
        req.body.page = pageId;
        let body = helpers.normalizeData(req.body);
        let newPost = new postModel(body);
        
        newPost.save()
        .then(()=>{
            return res.json({
                ...this.successPrams(),
                message: "پست جدید با موفقیت ساخته شد.",
                newPost: {
                    title: newPost.title,
                    slug: newPost.slug,
                    images : newPost.images,
                    postId: newPost.id,
                    pageId: newPost.page
                }
            })
        })
        .catch(err =>{
            next(err);
        })
    }


    
    async editPost(req,res,next){
        if(!await this.validationData(req)){
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        let pageId = req.params.page;
        let postId = req.params.id;
        let owner = req.user.id

        if(req?.body?.title) req.body.slug = helpers.slug(req.body.title);
        
        // prevent edit page/images/likes,likeCount,viewCount,comments
        let unchangableItems = ['images','page','likes','likeCount','viewCount','comments']
        Object.keys(req.body).forEach(key=>{
            if(unchangableItems.includes(key)) delete req.body[key];
        })
        
        let body = helpers.normalizeData(req.body);

        // Find Post
        let post = await postModel.findOne({page : pageId, id: postId}).populate({
            path : 'page',
            match: {owner}
        }).exec();

        // Check ownership of post
        if(post?.page?.owner != owner) return this.errorResponse(createHttpError.NotFound('این پست متعلق به شما نیست.'),res);

        if(!post) return this.errorResponse(createHttpError.NotFound('پست مورد نظر پیدا نشد.'),res);

        // let postLinks = [];
        // postLinks = post.links;
        // postLinks.forEach(value=>{
        //     console.log(value);
        // })

        // let postLinks = {};
        // postLinks = Object.values(post.links);
        // postLinks = Object.values(post.links);
        // console.log(postLinks);

        // let bodyLinks = body.links;
        // bodyLinks.push(...postLinks);

        // let linksSet = new Set();
        // bodyLinks.forEach(link=>{
        //     let keys = Object.keys(link);
        //     let newValue = {}
        //     keys.forEach(key=>{
        //         newValue[key] = link[key];
        //     })
        //     linksSet.add(newValue);
        // })

        // console.log(linksSet);
        
        // // body.links.push(...postLinks);
        // body.links = postLinks;

        // body.links.push(...postLinks);
        // post.links = body.links;
        // await post.save();

        let result = await post.updateOne({$set : body});
        // let result = await post.updateOne({$set : {links: {title: "yellow", price: 2000}}});
        
        if(result?.acknowledged === true){
            return this.successResponse('پست مورد نظر با موفقیت ویرایش شد.',res);
        }else{
            return this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش پست.'),res)
        }
        
    }

    async removePost(req,res,next){
        try {
            if(!await this.validationData(req)){
                return this.errorResponse(createHttpError.BadRequest(req.errors),res);
            }
    
            let pageId = req.params.page;
            let postId = req.params.id;
            let owner = req.user.id
    
            // Find Post
            let post = await postModel.findOne({page : pageId, id: postId}).populate({
                path : 'page',
                match: {owner}
            }).exec();

            // Check ownership of post
            if(post?.page?.owner != owner) return this.errorResponse(createHttpError.NotFound('این پست متعلق به شما نیست.'),res);

            if(!post) return this.errorResponse(createHttpError.NotFound('پست مورد نظر پیدا نشد.'),res);            

            // remove comments
            // remove likes
            
            // Remove all comments and likes in posts.comment
            // post.comment.forEach(async (post)=>{
                //removePost function
                //await post.remove();
                // console.log(`Remove ${post.comment}`);
            // });
    
            // Remove all images
            // if(page.thumb != CONSTS.PAGE_DEFAULT_THUBM){
            //     Object.values(page.images).forEach(image=>{
            //         fs.unlinkSync(`./public${image}`)
            //     })
            // }
    
            // Remove the page
            let result = await post.remove();
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async addPostImage(req,res,next){

        try {
            if(!await this.validationData(req)){
                return this.errorResponse(createHttpError.BadRequest(req.errors),res);
            }
    
            let pageId = req.params.page;
            let postId = req.params.id;
            let owner = req.user.id;
    
            // Find Post
            let post = await postModel.findOne({page : pageId, _id: postId}).populate({
                path : 'page',
                select: 'owner'
            }).exec();
    
            // Check ownership of post
            if(post?.page?.owner != owner) return this.errorResponse(createHttpError.NotFound('این پست متعلق به شما نیست.'),res);
    
            if(!post) return this.errorResponse(createHttpError.NotFound('پست مورد نظر پیدا نشد.'),res);
    
            // Check count of images in post
            let oldPostImagesLength = post.images.length;
            if( oldPostImagesLength == CONSTS.POST_MAX_FILE){
                // Remove new uploaded images
                req.files.forEach((item)=>{
                    fs.unlinkSync(`${item.destination}/${item.filename}`);
                });
    
                return this.errorResponse(createHttpError.NotAcceptable('سقف تصاویر آپلود شده پر شده است.'),res);
            }else{
                let uploadedImageNum = req?.files?.length;
                let postImages = uploadedImageNum + oldPostImagesLength;
                
                if(postImages > CONSTS.POST_MAX_FILE){
                    let exceededImage = postImages - CONSTS.POST_MAX_FILE;
                    req.files.forEach((item,index)=>{
                        if(index > (uploadedImageNum - exceededImage)-1){
                            fs.unlinkSync(`${item.destination}/${item.filename}`);
                            delete req.files[index];
                        }
                    });
        
                    req.files.length = uploadedImageNum - exceededImage;
                }    
            }
    
    
            let images = [];
            images.push(...post.images);
            images.push(...await this.#imageResizeMulti(req.files));
            
            // Remove original uploaded files
            req.files.forEach( (item)=>{
                fs.unlinkSync(`${item.destination}/${item.filename}`);
            });
            
            post.images = images;
            await post.save();
            
            res.json({
                ...this.successPrams(),
                message: 'تصاویر با موفقیت به پست شما اضافه شد.',
                post: postId,
                images: post.images
            });

        } catch (error) {
            next(error);
        }

    }

    async removePostImageSingle(req,res,next){

    }

    async removePageImageAll(req,res,next){
        try {
            // Check ID
            this.isMongoId(req?.params?.id);
        
            //Find page
            let page = await pageModel.findOne({owner: req.user.id, _id: req.params.id});//.populate('owner').exec();
            if(!page) return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر پیدا نشد.'),res);
    
            if(page.thumb != CONSTS.PAGE_DEFAULT_THUBM){
                Object.values(page.images).forEach(image=>{
                    fs.unlinkSync(`./public${image}`)
                })
            }
    
            let images = {}
    
            let imageSize = [1080,720,480];
            images['original'] = CONSTS.PAGE_DEFAULT_THUBM;
            imageSize.map(size => images[size] = `/images/pageDef-${size}.jpg`);
    
            let thumb = images['480'];
    
            let result = await page.updateOne({$set : {thumb, images}})

            return res.json({
                ...this.successPrams(),
                message: 'تصویر صفحه مورد نظر با موفقیت پاک شد.'
            });
        } catch (error) {
            next(error);
        }
    }

    async #imageResize(image){
        let imageInfo = path.parse(image.path);
        let imageAddress = '';

        let resize = async (size)=>{
            let imageName = `${imageInfo.name}-${size}${imageInfo.ext}`;
            imageAddress = this.#getImageUrl(image.destination,imageName);
            await sharp(image.path)
                .resize(size)
                .toFile(`${image.destination}/${imageName}`);
        }

        await resize(720);
        return imageAddress;
    }

    async #imageResizeMulti(images){
        let imageAddress = [];
        for (const image of images) {
            imageAddress.push(await this.#imageResize(image));
        }
        return imageAddress;
    }

    // async #imageResizeMulti(images){
    //     let imageAddress = [];

    //     for (const image of images) {
    //         let imageInfo = path.parse(image.path);
    //         let imageName = `${imageInfo.name}-${720}${imageInfo.ext}`;
    //         imageAddress.push(this.#getImageUrl(image.destination,imageName));
    //         sharp(image.path)
    //             .resize(720)
    //             .toFile(`${image.destination}/${imageName}`);
                
    //     }

    //     return imageAddress;
    // }

    #getImageUrl(dir,name){
        return `${dir.substr(8)}/${name}`;
    }
}


module.exports = new postController;