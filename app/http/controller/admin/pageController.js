const createHttpError = require('http-errors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');

// controller
const Controller = require('../controller');
const {removePost} = require('./postController');

// Models
const pageModel = require('../../../models/pageModel');
const postModel = require('../../../models/postModel');

// Helper
const helpers = require('../../../../helpers');
const axios = require('axios');
const { NOTFOUND } = require('dns');

'use strict';
class pageController extends Controller {

    async showPosts(req,res,next){

        let checkOwnershipOfPageError = undefined;
        let page = await this.checkOwnershipOfPage(req).catch(err => {
            checkOwnershipOfPageError = err;
        });
        if(checkOwnershipOfPageError) return this.errorResponse(checkOwnershipOfPageError, res);

        let pageId = req.params.page;

        let pageNumber = req.query.page || 1;
        let limit = req.query.limit || 5;

        let posts = await postModel.paginate({page: pageId},{
            select : ['-id','-createdAt','-__v','-likes'],
            pageNumber,
            limit, 
            populate : [
                {
                    path: 'page',
                    select: ['owner','username','title','images','thumb'],
                },
                {
                    path: 'links',
                    select: ['-__v']
                },
                {
                    path: 'comments',
                    select: ['comment','parent','approved'],
                    match : {'approved' : true , 'parent': null},
                    populate : [
                        {
                            path: 'author',
                            select : ['name','family']
                        },
                        {
                            path: 'comments',
                            match : {'approved' : true},
                            select: ['comment','parent','approved'],
                            populate : [
                                {
                                    path: 'author',
                                    select : ['name','family']
                                }
                            ]
                        }
                    ]

                },
            ]
        });

        return res.json(posts);
    }

    async addPage(req, res, next) {
        if (!await this.validationData(req)) {
            if (req ?. file ?. path) { // Remove the file if it was stored
                fs.unlinkSync(req.file.path);
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors), res);
        }

        let images = {};

        if (req.file) {
            // if file was stored, transfer the image path into req.body
            // req.body.pageimage = ((req.file.path).replaceAll('\\','/')).substr(6);
            images = await this.#imageResize(req.file);
            req.body.images = images;
            req.body.thumb = images['480'];
        } else { // Set default images for new page
            let imageSize = [1080, 720, 480];
            images['original'] = CONSTS.PAGE_DEFAULT_THUBM;
            imageSize.map(size => images[size] = `/images/pageDef-${size}.jpg`);
            req.body.images = images;
            req.body.thumb = images['480'];
        }

        req.body.owner = req.user.id;
        req.body.username = String(req.body.username).toLowerCase();

        let body = helpers.normalizeData(req.body);
        let newPage = new pageModel(body);

        newPage.save().then(() => {
            return res.json({
                ...this.successPrams(),
                message: "صفحه جدید با موفقیت ساخته شد.",
                newPage: {
                    username: newPage.username,
                    pageId: newPage.id
                }
            })
        }).catch(err => { // if(err) return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد صفحه جدید.'),res);
            next(err);
        })
    }

    async editPage(req, res, next) {
        if (!await this.validationData(req)) {
            if (req ?. file ?. path) { // Remove the file if it was stored
                fs.unlinkSync(req.file.path);
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors), res);
        }

        // if(req?.params?.id) this.isMongoId(req.params.id,res);

        let pageId = req.params.page;
        let owner = req.user.id

        let page = await pageModel.findOne({_id: pageId, owner});
        // if(!page) return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر پیدا نشد.'),res);

        let images = [];

        if (req.file) { // if file was stored, transfer the image path into req.body
            images = await this.#imageResize(req.file);
            req.body.images = images;
            req.body.thumb = images['480'];
        }

        // prevent edit username
        if (req ?. body ?. username) 
            delete req.body['username'];

        let body = helpers.normalizeData(req.body);

        let result = await page.updateOne({$set: body});

        // Remove old pictures if new picture was uploaded
        if (result.acknowledged === true) {
            if (req ?. file && page.thumb !== CONSTS.PAGE_DEFAULT_THUBM) {
                this.#removeImages(page.images);
            }
        } else {
            return this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش صفحه.'), res)
        }

        return this.successResponse('صفحه مورد نظر با موفقیت ویرایش شد.', res);
    }

    async removePage(req, res, next) {
        try {
            let checkOwnershipOfPageError = undefined;
            let page = await this.checkOwnershipOfPage(req).catch(err => checkOwnershipOfPageError = err);
            if(checkOwnershipOfPageError) return this.errorResponse(checkOwnershipOfPageError,res);

            if( page?.active != true) return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر پیدا نشد.'),res)

            let owner = req?.user?.id || undefined;
            let pageId = req?.params?.page || undefined;

            page = await pageModel.findById(pageId).populate('posts').exec();
            // Remove all sub posts in page.posts

            if(page?.posts?.length > 0){
                await this.#removePagesPost(page.posts, owner);
            }

            // Remove all images
            if (page?.thumb != CONSTS.PAGE_DEFAULT_THUBM) {
                this.#removeImages(page?.images);
            }

            // Remove the page
            page.remove()
            .then( () => {
                return res.json({
                    ...this.successPrams(),
                    message: 'صفحه با موفقیت حذف شد.',
                    page: page._id
                });
            })
            .catch( err => {
                debugDB(err);
                return this.errorResponse(createHttpError.InternalServerError('خطا در حذف صفحه'),res);
            })
        } catch (error) {
            next(error);
        }
    }

    async activationPage(req, res, next) {
        try {
            let checkOwnershipOfPageError = undefined;
            let page = await this.checkOwnershipOfPage(req).catch(err => checkOwnershipOfPageError = err);
            if(checkOwnershipOfPageError) return this.errorResponse(checkOwnershipOfPageError,res);

            let owner = req?.user?.id || undefined;
            let pageId = req?.params?.page || undefined;
            let activation = req?.params?.activation || false;

            page = await pageModel.findById(pageId).populate('posts').exec();
            
            // Deactive all sub posts in page.posts
            if(page?.posts?.length > 0){
                this.#deactivePagesPost(page.posts, owner, activation);
            }

            // Remove the page
            page.activate(activation)
            .then( () => {
                return res.json({
                    ...this.successPrams(),
                    message: (activation == 'true') ? 'صفحه با موفقیت فعال شد.' : 'صفحه با موفقیت غیرفعال شد.',
                    page: page._id
                });
            })
            .catch( err => {
                debugDB(err);
                return this.errorResponse(createHttpError.InternalServerError('خطا در تغییر وضعیت صفحه'),res);
            })
        } catch (error) {
            next(error);
        }
    }

    async removePageImage(req, res, next) {
        try { 
            // Find page and check page ownership
            let checkOwnershipOfPageError = undefined;
            let page = await this.checkOwnershipOfPage(req).catch(err => checkOwnershipOfPageError = err);
            if(checkOwnershipOfPageError) return this.errorResponse(checkOwnershipOfPageError,res);

            if (page.thumb != CONSTS.PAGE_DEFAULT_THUBM) {
                this.#removeImages(page?.images);
            }

            let images = {}

            let imageSize = [1080, 720, 480];
            images['original'] = CONSTS.PAGE_DEFAULT_THUBM;
            imageSize.map(size => images[size] = `/images/pageDef-${size}.jpg`);

            let thumb = images['480'];

            let result = await page.updateOne({
                $set: {
                    thumb,
                    images
                }
            })

            return res.json({
                ...this.successPrams(),
                message: 'تصویر صفحه مورد نظر با موفقیت پاک شد.'
            });
        } catch (error) {
            next(error);
        }
    }
    
    #removePagesPostOLD(posts, owner){
        let accessToken = this.createTokne(owner);
        
        posts.forEach(async (post)=>{
            let result = await axios.delete(`http://${configs.host}:${configs.port}/v${configs.apiVersion}/admin/removePost/${post._id}`,{
                headers : {'Authorization': `bearer ${accessToken}`}
            }).catch( error => {
                debug(error);
                // return new Error('خطا در حذف پست های صفحه');
            });
            console.log(result?.data);
            // if(result?.data?.statusCode != 200) throw new Error('خطا در حذف پست های صفحه');
        });
    }

    async #removePagesPost(posts, owner){
        let accessToken = this.createTokne(owner);
        let postIds = [];
        // posts.forEach(async (post)=>{
        //     postIds.push()
        //     // if(result?.data?.statusCode != 200) throw new Error('خطا در حذف پست های صفحه');
        // });

        postIds = posts.map((post)=> post._id );

        let result = await axios.delete(
            `http://${configs.host}:${configs.port}/v${configs.apiVersion}/admin/removePost`
            ,{  //`http://${configs.host}:${configs.port}/v${configs.apiVersion}/admin/removePost/${post._id}`
                headers : {
                    'Authorization': `bearer ${accessToken}`,
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data : {
                    post : postIds
                }
            }).catch( error => {
                debug(error);
                // return new Error('خطا در حذف پست های صفحه');
            });
            console.log(result?.data);
    }
    
    #deactivePagesPost(posts, owner, activation){
        let accessToken = this.createTokne(owner);
        
        posts.forEach(async (post)=>{
            await post.activate(activation)
            .catch( error => {
                debug(error);
                // return new Error('خطا در حذف پست های صفحه');
            });
            
            // if(result?.data?.statusCode != 200) throw new Error('خطا در حذف پست های صفحه');
        });
    }

    #removeImages(images){
        Object.values(images).forEach(image => {
            try {
                fs.unlinkSync(`./public${image}`)
            } catch (error) {
                debug(error);
            }
        })
    }

    async #imageResize(image) {
        let imageInfo = path.parse(image.path);
        let imageAddress = {}
        imageAddress['original'] = this.#getImageUrl(image.destination, image.filename);

        let imageSize = [1080, 720, 480];
        let resize = async (size) => {
            let imageName = `${
                imageInfo.name
            }-${size}${
                imageInfo.ext
            }`;
            imageAddress[size] = this.#getImageUrl(image.destination, imageName);

            await sharp(image.path).resize(size).toFile(`${
                image.destination
            }/${imageName}`);
        }

        await imageSize.map(resize);
        return imageAddress;
    }

    #getImageUrl(dir, name) {
        return `${
            dir.substr(8)
        }/${name}`;
    }
}


module.exports = new pageController;
