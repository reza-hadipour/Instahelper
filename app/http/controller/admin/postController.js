const createHttpError = require('http-errors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const isMongoID = require('validator/lib/isMongoId');

// controller
const Controller = require('../controller');

// Models
const pageModel = require('../../../models/pageModel');
const postModel = require('../../../models/postModel');
const postLinkModel = require('../../../models/postLinkModel');
const commentModel = require('../../../models/commentModel');

// Helper
const helpers = require('../../../../helpers');

'use strict';
class postController extends Controller {


    async addPost(req, res, next) {
        
            if (!await this.validationData(req)) {
                if (req ?. files ?. length > 0) { // Remove the file if it was stored
                    for (const item of req.files) {
                        fs.unlinkSync(item.path);
                    }
                }
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            } 
    
            let checkOwnershipOfPageError;
                let page = await this.checkOwnershipOfPage(req).catch(err => {
                    checkOwnershipOfPageError = err;
                });
                if(checkOwnershipOfPageError) return this.errorResponse(checkOwnershipOfPageError, res);
            
            if (req ?. files?.length > CONSTS.POST_MAX_FILE) {
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
    
            if (req.files?.length > 0) { // if files were stored, transfer the images path into req.body
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
                // In swagger I received the links as a string, so I need to cast it to json.
                if (typeof body?.links === 'string'){
                    bodyLinks.push(...JSON.parse(body.links));
                }else{
                    bodyLinks.push(...body.links);
                }
        
                let resultPostLink = await postLinkModel.insertMany(bodyLinks)
                .catch(err => {
                    debugDB(err);
                    return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد پست'),res);
                });
                
                // Achieve new stored links ID
                resultPostLink.forEach((link)=>{
                    newPostLinksId.push(link.id);
                });
                
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

            // if (!await this.validationData(req)) {
            //     return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            // }
            let checkOwnerShipOfPostError = undefined;
            let post = await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            });
            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError, res);
    
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
                // In swagger I received the links as a string, so I need to cast it to json.
                if (typeof body?.links === 'string'){
                    bodyLinks.push(...JSON.parse(body.links));
                }else{
                    bodyLinks.push(...body.links);
                }
        
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

    async #removeLinks(links,res){
        return new Promise(async (resolve)=>{
            let postLinks = links;
            console.log("postLinks: ",postLinks);
            postLinkModel.deleteMany({_id : {$in : postLinks}})
            .then( info => {
                debugDB(info);
                console.log('Delete postLink: ',info);
                resolve(true);
            })
            .catch(err=>{
                debugDB(err);
                return this.errorResponse(createHttpError.InternalServerError('خطا در حذف لینک های پست.'),res);
            })
        })
    }

    #removeComments(comments,res){
        return new Promise(resolve => {
            let commentsIds = [];
            comments.forEach(comment => {
                commentsIds.push(comment['id']);
            });

            console.log("commentsIds: ",commentsIds);
            commentModel.deleteMany({_id : {$in : commentsIds}})
            .then( info => {
                debugDB(info);
                console.log('Delete comment: ',info);
                resolve(true);
            })
            .catch(err=>{
                debugDB(err);
                return this.errorResponse(createHttpError.InternalServerError('خطا در حذف نظرات پست.'),res);
            })
        })
        // let commentsIds = [];
        // comments.forEach(comment => {
        //     commentsIds.push(comment['id']);
        // });

        // console.log("commentsIds: ",commentsIds);
        // commentModel.deleteMany({_id : {$in : commentsIds}})
        // .then( info => {
        //     debugDB(info);
        //     console.log('Delete comment: ',info);
        // })
        // .catch(err=>{
        //     debugDB(err);
        //     return this.errorResponse(createHttpError.InternalServerError('خطا در حذف نظرات پست.'),res);
        // })
    }
    
    #removePostImages(images){
        return new Promise(async (resolve)=>{
            images.forEach(image => {
                if(image != CONSTS.POST_DEFAULT_THUBM){
                    try {
                        fs.unlinkSync(`./public${image}`)
                    } catch (error) {
                        
                    }
                }
            })
            resolve(true);
        });
        // images.forEach(image => {
        //     if(image != CONSTS.POST_DEFAULT_THUBM){
        //         try {
        //             fs.unlinkSync(`./public${image}`)
        //         } catch (error) {
                    
        //         }
        //     }
        // })
    }

    async removePost(req, res, next) {
        try {
            // if (!await this.validationData(req)) {
            //     return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            // }
            let postId = req?.query?.post || undefined
            let pageId = req?.query?.page || undefined
            let multiPostIds = req?.body?.post || undefined
            let owner = req?.user?.id || undefined;
            let postIds = [];
            let post;
            
            if(postId){ // working with post
                let checkOwnerShipOfPostError = undefined;
                post = await this.checkOwnerShipOfPost(req)
                .catch(err => {
                    checkOwnerShipOfPostError = err;
                });
                if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError, res);
                // postIds.push(postId);
                
            }else if(pageId){   // working with posts
                let checkOwnershipOfPageError = undefined;
                await this.checkOwnershipOfPage(req)
                .catch(err => {
                    checkOwnershipOfPageError = err;
                });
                if(checkOwnershipOfPageError) return this.errorResponse(checkOwnershipOfPageError, res);
            }else if(multiPostIds){ // working with postIds
                if (typeof multiPostIds == 'string'){
                    postIds = multiPostIds.split();   // for multiple ids
                }else{
                    postIds = multiPostIds;   // for single id
                }
    
                if(!postIds.every(isMongoID)) {
                    return this.errorResponse(createHttpError.BadRequest('شناسه پست ها ارسالی صحیح نمی باشد.'),res);
                }
            }else{
                return this.errorResponse(createHttpError.BadRequest('شناسه پست ها را وارد کنید.'),res);
            }

            let posts;

            if(pageId){ // remove posts base on their pageId
                posts = await postModel.find({'active': 'true' , 'page' : pageId})
                .populate([{
                    path : 'page',
                    select : 'owner'
                },{
                    path: 'comments',
                    select : ['id']
                }]).exec();
            }else if(postIds?.length > 0){  // remove base on an array of postIds or postId in params
                posts = await postModel.find({'active': 'true' , '_id' : {$in : postIds}})
                .populate([{
                    path : 'page',
                    select : 'owner'
                },{
                    path: 'comments',
                    select : ['id']
                }]).exec();
            }
        
            if(posts?.length > 0){
                let countOfRemovedPosts = 0;

                posts.forEach(async (post) => {
                    if(post?.page?.owner == owner){    // Check comment ownership
                        // Remove Post
                        
                        // Remove links
                        if(post?.links?.length > 0){
                            console.log('>> Removing LINKS');
                            await this.#removeLinks(post.links,res);  // usign fetch in future
                        }

                        // Remove comments
                        if(post?.comments?.length > 0){
                            await this.#removeComments(post.comments,res);    // usign fetch in future
                        }

                        // remove likes

                        // Remove all images
                        if(post?.images?.length > 0){
                            console.log('>> Removing Images');
                            await this.#removePostImages(post.images);    // usign fetch in future
                        }

                        // Remove the post
                        post.remove().then(info => {
                            console.log('>> Removing Post');
                            // return res.json({
                            //     ...this.successPrams(),
                            //     message: `${info.title} با موفقیت حذف شد.`,
                            //     post: post._id
                            // });
                            countOfRemovedPosts += 1;
                            console.log(countOfRemovedPosts);
                        }).catch(err => {
                            debugDB(err);
                            // return this.errorResponse(createHttpError.InternalServerError('خطا در حذف پست.'),res);
                        })
                    }
                });
                
                console.log('Loop ',countOfRemovedPosts);
                console.log('resolving');
            
                return res.json({
                    ...this.successPrams(),
                    message: 'پست با موفقیت حذف شد.'
                    // message: (countOfRemovedPosts > 0) ? `${countOfRemovedPosts} پست با موفقیت حذف شد.` : 'هیچ پستی حذف نشد.'
                });
                

            }else if(post){
                // Remove Post based on postId
                        
                // remove links
                if(post?.links?.length > 0){
                    this.#removeLinks(post.links,res);  // usign fetch in future
                }

                // remove comments
                if(post?.comments?.length > 0){
                    this.#removeComments(post.comments,res);    // usign fetch in future
                }

                // remove likes
                // Remove all images
                if(post?.images?.length > 0){
                    this.#removePostImages(post.images);    // usign fetch in future
                }

                // Remove the post
                post.remove().then(info => {
                    return res.json({
                        ...this.successPrams(),
                        message: `${info.title} با موفقیت حذف شد.`,
                        post: post._id
                    });
                }).catch(err => {
                    debugDB(err);
                    return this.errorResponse(createHttpError.InternalServerError('خطا در حذف پست.'),res);
                })

            }else{
                return this.errorResponse(createHttpError.NotFound('پستی یافت نشد.'),res);
            }

            // post = await postModel.findById(req.params.post)
            // .populate([
            //     {
            //         path: 'comments',
            //         select : ['id']
            //     }
            // ]).exec();

            // return res.json({
            //     ...this.successPrams(),
            //     message: "Post Removed",
            //     post: post._id
            // });
        } catch (error) {
            next(error);
        }
    }

    async addPostImage(req, res, next) {

        try {
            if (!await this.validationData(req)) {
                if (req ?. files ?. length > 0) { // Remove the file if it was stored
                    for (const item of req.files) {
                        fs.unlinkSync(item.path);
                    }
                }
                return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            } 

            let checkOwnerShipOfPostError = undefined;
            let post = await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            });
            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError, res);

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
            // if (!await this.validationData(req)) {
            //     return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            // }

            let checkOwnerShipOfPostError = undefined;
            let post = await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            });
            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError, res);

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
                            message: `${imageName} با موفقیت از تصاویر پست مربوطه حذف شد.`,
                            images: post.images,
                            post: post.id
                        });
                    }else{
                        return res.status(400).json({
                            status: 'failed',
                            statusCode : 400,
                            message: "فایلی برای پاک کردن یافت نشد."
                        });
                    }
                }else{
                    return res.status(404).json({
                        status: 'failed',
                        statusCode : 404,
                        message: "تصویر مورد نظر در این پست یافت نشد."
                    });
                }
            }
        } catch (error) {
            next(error);
        }
    }

    async removeAllPostImages(req, res, next) {
        try {
            // if (!await this.validationData(req)) {
            //     return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            // }

            let checkOwnerShipOfPostError = undefined;
            let post = await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            });
            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError, res);


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
                    message: 'تمامی تصاویر پست مورد نظر حذف شدند.',
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
            // if (!await this.validationData(req)) {
            //     return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            // }
            
            let postId = req?.params?.post;
            let owner = req.user.id;

            // Find Post
            let post = await postModel.findById(postId).populate([
                {path: 'page', select: 'owner'},
                {path: 'links'}]).exec();

            // Check ownership of post
            if (! post) 
                return this.errorResponse(createHttpError.NotFound('پست مورد نظر پیدا نشد.'),res);

            if (post ?. page ?. owner != owner) 
                return this.errorResponse(createHttpError.NotAcceptable('شما مجاز به اعمال تغییرات در این پست نیستید.'),res);

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
                })
                .catch(err => {
                    debugDb(err);
                    throw new Error('خطار در حذف لینک');
                })
            }else{
                return this.errorResponse(createHttpError.NotFound('لینک مربوطه پیدا نشد.'), res);

            }
            
        }catch(error){
            next(error);
        }
    }

    async removeAllPostLink(req,res,next){
        try {
            // if (!await this.validationData(req)) {
            //     return this.errorResponse(createHttpError.BadRequest(req.errors), res);
            // }

            let postId = req?.params?.post;
            let owner = req.user.id;

            // Find Post
            let post = await postModel.findById(postId).populate([
                {path: 'page', select: 'owner'},
                {path: 'links'}]).exec();

            // Check ownership of post
            if (! post) 
                return this.errorResponse(createHttpError.NotFound('پست مورد نظر پیدا نشد.'),res);

            if (post ?. page ?. owner != owner) 
                return this.errorResponse(createHttpError.NotAcceptable('شما مجاز به اعمال تغییرات در این پست نیستید.'),res);

            if(post?.links?.length > 0){
                post.links.forEach(async (link)=>{
                    await link.remove()
                });
    
                post.links = []
                await post.save();
                return res.json({
                    ...this.successPrams(),
                    message: `تمام لینک ها حذف شدند.`
                });
            }else{
                return res.json({
                    ...this.successPrams(),
                    message: `تمام لینک ها حذف شدند.`
                });
            }
        
        }catch(error){
            next(error);
        }
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
