const createHttpError = require('http-errors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// controller
const Controller = require('../controller');

// Models
const pageModel = require('../../../models/pageModel');
const postModel = require('../../../models/postModel');
const postLinkModel = require('../../../models/postLinkModel');

// Helper
const helpers = require('../../../../helpers');

'use strict';
class postController extends Controller {

    async showPosts(req,res,next){
        if (!await this.validationData(req)) {
            return this.errorResponse(createHttpError.BadRequest(req.errors), res);
        }

        this.#checkOwnershipOfPage(req).catch(err => {
            return this.errorResponse(err, res);
        });

        let pageId = req.params.page;

        let page = req.query.page || 1;
        let limit = req.query.limit || 5;

        let posts = await postModel.paginate({page: pageId},{
            select : ['-id','-createdAt','-__v','-likes'],
            page,
            limit, 
            populate : [
                {
                    path: 'page',
                    select: ['owner','username','title','images','thumb'],
                },
                {
                    path: 'links',
                    select: ['-__v']
                }
            ]
        });

        return res.json(posts);
    }
    

    async addPost(req, res, next) {
        if (!await this.validationData(req)) {
            if (req ?. files ?. length > 0) { // Remove the file if it was stored
                for (const item of req.files) {
                    fs.unlinkSync(item.path);
                }
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors), res);
        } 

        let page = await this.#checkOwnershipOfPage(req).catch(err => {
            return this.errorResponse(err, res);
        });

        
        if (req ?. files.length > CONSTS.POST_MAX_FILE) {
            req.files.forEach((item, index) => {
                if (index > CONSTS.POST_MAX_FILE - 1) {
                    fs.unlinkSync(`${item.destination}/${item.filename}`);
                    delete req.files[index];
                }
            });

            req.files.length = CONSTS.POST_MAX_FILE;
        }

        req.body.postimage = undefined; // Clear postimage from postValidation

        let images = [];

        if (req.files.length > 0) { // if files were stored, transfer the images path into req.body
            images = await this.#imageResizeMulti(req.files);
            req.body.images = images;
            req.files.forEach(async (item) => {
                fs.unlinkSync(`${item.destination}/${item.filename}`);
            });

        } else { // Set default images for new page
            images.push(CONSTS.POST_DEFAULT_THUBM);
            req.body.images = images;
        }

        req.body.slug = helpers.slug(req.body.title);
        req.body.page = req.params.page;
        let body = helpers.normalizeData(req.body);

        // Store Links objects in postLinks collection
        let newPostLinksId = [];
    
        if(body?.links?.length > 0){
            let bodyLinks = [];
            bodyLinks.push(...body.links);
    
            let resultPostLink = await postLinkModel.insertMany(bodyLinks)
            .catch(err => {
                debugDB(err);
                return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد پست'),res);
            });
            
            // Achieve new stored links ID
            resultPostLink.forEach((link)=>{
                newPostLinksId.push(link.id);
            });
            
            // post.links.push(...postLinksId)
            // await post.save();
            // delete body['links'];
            
            bodyLinks = [];
            bodyLinks.push(...newPostLinksId);
    
            body.links = bodyLinks;
        }

        let newPost = new postModel(body);

        newPost.save()
        .then(() => {
            return res.json({
                ...this.successPrams(),
                message: "پست جدید با موفقیت ساخته شد.",
                newPost: {
                    title: newPost.title,
                    slug: newPost.slug,
                    images: newPost.images,
                    postId: newPost.id,
                    pageId: newPost.page
                }
            })
        })
        .catch(err => {
            // Remove all new links from postLinks collection
            if(newPostLinksId.length > 0){
                postLinkModel.deleteMany({ _id : { $in : newPostLinksId}},(err,result)=>{
                    if(err) debugDB(err);
                    console.log('Deleting new postLinks...',result);
                });
            }
            debugDB(err);
            return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد پست جدید.'), res)
        })
    }


    async editPost(req, res, next) {
        try {

            if (!await this.validationData(req)) {
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            }
    
            let post = await this.#checkOwnerShipOfPost(req).catch(err => {
                return this.errorResponse(err, res);
            });
    
            if (req ?. body ?. title) 
                req.body.slug = helpers.slug(req.body.title);
            
            // prevent edit page/images/likes,likeCount,viewCount,comments
            let unchangableItems = [
                'images',
                'page',
                'likes',
                'likeCount',
                'viewCount',
                'comments'
            ]
    
            Object.keys(req.body).forEach(key => {
                if (unchangableItems.includes(key)) 
                    delete req.body[key];
            });
    
            let body = helpers.normalizeData(req.body);
    
            // Store Links objects in postLinks collection
            let newPostLinksId = [];
    
            if(body?.links?.length > 0){
                let bodyLinks = [];
                bodyLinks.push(...body.links);
        
                let resultPostLink = await postLinkModel.insertMany(bodyLinks)
                .catch(err => {
                    return this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش پست'),res);
                });
                
                // Achieve new stored links ID
                resultPostLink.forEach((link)=>{
                    newPostLinksId.push(link.id);
                });
                
                // post.links.push(...postLinksId)
                // await post.save();
                // delete body['links'];
                
                bodyLinks = [];
                bodyLinks.push(...post.links,...newPostLinksId);
        
                body.links = bodyLinks;
            }
    
            let result = await post.updateOne({$set: body})
            .catch(err => {
                // Remove all new links from postLinks collection
                if(newPostLinksId.length > 0){
                    postLinkModel.deleteMany({ _id : { $in : newPostLinksId}},(err,result)=>{
                        if(err) debugDB(err);
                        console.log('Deleting new postLinks...',result);
                    });
                }
                debugDB(err);
                return this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش پست.'), res)
            })
    
            if (result ?. acknowledged === true) {
                return this.successResponse('پست مورد نظر با موفقیت ویرایش شد.', res);
            }
        } catch (error) {
            next(error);
        }

    }

    async removePost(req, res, next) {
        try {
            if (!await this.validationData(req)) {
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            }

            let post = await this.#checkOwnerShipOfPost(req)
            .catch(err => {
                return this.errorResponse(err, res);
            });

            // remove links
            if(post?.links?.length > 0){
                let postLinks = posts.links;
                postLinkModel.deleteMany({_id : {$in : postLinks.toArray()}})
                .then( info => {
                    debugDB(info);
                    console.log(info);
                })
                .catch(err=>{
                    debugDB(err);
                    return this.errorResponse(createHttpError.InternalServerError('خطا در حذف لینک های پست.'),res);
                })
            }
            

            // remove comments
            // remove likes

            // Remove all comments and likes in posts.comment
            // post.comment.forEach(async (post)=>{
            // removePost function
            // await post.remove();
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

    async addPostImage(req, res, next) {

        try {
            if (!await this.validationData(req)) {
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            }

            let post = await this.#checkOwnerShipOfPost(req).catch(err => {
                return this.errorResponse(err, res);
            });


            // Check count of images in post
            let oldPostImagesLength = 1;

            (post ?. images[0] == CONSTS.POST_DEFAULT_THUBM) ? oldPostImagesLength = 0 : oldPostImagesLength = post.images.length;

            if (oldPostImagesLength == CONSTS.POST_MAX_FILE) { // Remove new uploaded images
                req.files.forEach((item) => {
                    fs.unlinkSync(`${
                        item.destination
                    }/${
                        item.filename
                    }`);
                });

                return this.errorResponse(createHttpError.NotAcceptable('سقف تصاویر آپلود شده پر شده است.'), res);
            } else {
                let uploadedImageNum = req ?. files ?. length;
                let postImages = uploadedImageNum + oldPostImagesLength;

                if (postImages > CONSTS.POST_MAX_FILE) {
                    let exceededImage = postImages - CONSTS.POST_MAX_FILE;
                    req.files.forEach((item, index) => {
                        if (index > (uploadedImageNum - exceededImage) - 1) {
                            fs.unlinkSync(`${
                                item.destination
                            }/${
                                item.filename
                            }`);
                            delete req.files[index];
                        }
                    });

                    req.files.length = uploadedImageNum - exceededImage;
                }
            }


            let images = [];
            if (post ?. images[0] != CONSTS.POST_DEFAULT_THUBM) 
                images.push(... post.images);
            

            images.push(...await this.#imageResizeMulti(req.files));

            // Remove original uploaded files
            req.files.forEach((item) => {
                fs.unlinkSync(`${item.destination}/${item.filename}`);
            });

            post.images = images;
            await post.save();

            res.json({
                ...this.successPrams(),
                message: 'تصاویر با موفقیت به پست شما اضافه شد.',
                post: post.id,
                images: post.images
            });

        } catch (error) {
            next(error);
        }

    }

    async removeOnePostImage(req, res, next) {
        try {
            if (!await this.validationData(req)) {
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            }

            let post = await this.#checkOwnerShipOfPost(req).catch(err => {
                return this.errorResponse(err, res);
            });

            if(post){
                let imageName = req?.body?.imagename;
                let images = [];
                images.push(...post.images);
                
                let indexOfImage = images.findIndex((x)=>{
                   return x.endsWith(imageName);
                });

                if(indexOfImage > -1 && images[0] != CONSTS.POST_DEFAULT_THUBM){
                    if (fs.existsSync(`./public${images[indexOfImage]}`)){
                        fs.unlinkSync(`./public${images[indexOfImage]}`);

                        post.images.splice(indexOfImage,1);
                        // Set default image for post
                        if(post.images.length == 0) post.images[0] = CONSTS.POST_DEFAULT_THUBM;
                        await post.save();

                        return res.json({
                            ...this.successPrams(),
                            message: `${imageName} is removed from the post.`,
                            images: post.images,
                            post: post.id
                        });
                    }else{
                        return res.json({
                            status: 'failed',
                            statusCode : 404,
                            message: "There is no file to remove."
                        });
                    }
                }else{
                    return res.json({
                        status: 'failed',
                        statusCode : 404,
                        message: "Image not found"
                    });
                }
            }
        } catch (error) {
            next(error);
        }
    }

    async removeAllPostImages(req, res, next) {
        try {
            if (!await this.validationData(req)) {
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            }

            let post = await this.#checkOwnerShipOfPost(req).catch(err => {
                return this.errorResponse(err, res);
            });

            if (post) { // Unlink pics
                post.images.forEach(image => {
                    if (image != CONSTS.POST_DEFAULT_THUBM) 
                        fs.unlinkSync(`./public${image}`);
                });

                // Set default picture
                post.images = [CONSTS.POST_DEFAULT_THUBM];
                await post.save();
                res.json({
                    ...this.successPrams(),
                    message: 'All images are removed.',
                    image: post.images[0],
                    post: post.id
                });
            }

        } catch (error) {
            next(error)
        }
    }

    async removePostLink(req,res,next){
        try {
            if (!await this.validationData(req)) {
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            }

            // let post = await this.#checkOwnerShipOfPost(req).catch(err => {
            //     return this.errorResponse(err, res);
            // });
            // let pageId = req.params.page;
            let postId = req.params.id;
            // let postSlug = req.params.slug;
            let owner = req.user.id;

            // Find Post
            let post = await postModel.findById(postId).populate([
                {path: 'page', select: 'owner'},
                {path: 'links'}]).exec();

            // Check ownership of post
            if (! post) 
                return this.errorResponse(createHttpError.NotFound('پست مورد نظر پیدا نشد.'),res);

            if (post ?. page ?. owner != owner) 
                return this.errorResponse(createHttpError.NotFound('شما مجاز به اعمال تغییرات در این پست نیستید.'),res);

            // Unlink postLinks
            // return res.json(post);

            let postLinkId = req?.query?.postlink;
            let postLinkIdx = undefined;
            post.links.forEach((link,index)=>{
                if(link._id == postLinkId) return postLinkIdx = index;
            });
            // let postLinkIdx = post?.links?.indexOf(postLinkId);
            if(postLinkIdx > -1){
                await post.links[postLinkIdx].remove()
                // await postLinkModel.findByIdAndRemove(postLinkId)
                .then(async (info) => {
                    post.links.splice(postLinkIdx,1);
                    await post.save();
                    return res.json({
                        ...this.successPrams(),
                        message: `${info.title} با موفقیت حذف شد.`
                    });
                    // return res.json(info);
                })
                .catch(err => {
                    debugDb(err);
                    return this.errorResponse(createHttpError.InternalServerError('خطا در حذف لینک'), res);
                })
            }else{
                res.json('Not Found');
            }
            
        }catch(error){
            next(error);
        }
    }

    #checkOwnerShipOfPost(req) {
        return new Promise(async (resolve, reject) => {
            let pageId = req.params.page;
            let postId = req.params.id;
            let owner = req.user.id;

            // Find Post
            let post = await postModel.findOne({page: pageId, _id: postId}).populate({path: 'page', select: 'owner'}).exec();

            // Check ownership of post
            if (! post) 
                reject(createHttpError.NotFound('پست مورد نظر پیدا نشد.'));
            


            if (post ?. page ?. owner != owner) 
                reject(createHttpError.NotFound('این پست متعلق به شما نیست.'));
            


            resolve(post);
        })
    }

    #checkOwnershipOfPage(req){
        return new Promise(async (resolve,reject)=>{
                let owner = req.user.id;
                let pageId = req.params.page;

                let page = await pageModel.findOne({owner, id: pageId});
                if (! page) 
                    reject(createHttpError.NotFound('این پست متعلق به شما نیست.'))
                resolve(page);
            })
        }

    async #imageResize(image) {
        let imageInfo = path.parse(image.path);
        let imageAddress = '';

        let resize = async (size) => {
            let imageName = `${
                imageInfo.name
            }-${size}${
                imageInfo.ext
            }`;
            imageAddress = this.#getImageUrl(image.destination, imageName);
            await sharp(image.path).resize(size).toFile(`${
                image.destination
            }/${imageName}`);
        }

        await resize(720);
        return imageAddress;
    }

    async #imageResizeMulti(images) {
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

    #getImageUrl(dir, name) {
        return `${
            dir.substr(8)
        }/${name}`;
    }
}


module.exports = new postController;
