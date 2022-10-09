const createHttpError = require('http-errors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

//controller
const Controller = require('../controller');

// Models
const pageModel = require('../../../models/pageModel');

// Helper
const helpers = require('../../../../helpers');

'use strict';
class pageController extends Controller{
    
    async addPage(req,res,next){
        if(!await this.validationData(req)){
            if(req?.file?.path){    // Remove the file if it was stored
                fs.unlinkSync(req.file.path);
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        let images = {};

        if(req.file) { // if file was stored, transfer the image path into req.body
            // req.body.pageimage = ((req.file.path).replaceAll('\\','/')).substr(6);
            images = this.#imageResize(req.file);
            req.body.images = images;
            req.body.thumb = images['480'];
        }else{
            // Set default images for new page
            let imageSize = [1080,720,480];
            images['original'] = CONSTS.PAGE_DEFAULT_THUBM;
            imageSize.map(size => images[size] = `/images/pageDef-${size}.jpg`);
            req.body.images = images;
            req.body.thumb = images['480'];
        }
        
        req.body.owner = req.user.id;

        let body = helpers.normalizeData(req.body);
        let newPage = new pageModel(body);
        
        newPage.save()
        .then(()=>{
            return res.json({
                ...this.successPrams(),
                message: "صفحه جدید با موفقیت ساخته شد.",
                newPage: {
                    username: newPage.username,
                    pageId: newPage.id
                }
            })
        })
        .catch(err =>{
            // if(err) return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد صفحه جدید.'),res);
            next(err);
        })
    }

    async editPage(req,res,next){
        if(!await this.validationData(req)){
            if(req?.file?.path){    // Remove the file if it was stored
                fs.unlinkSync(req.file.path);
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        // if(req?.params?.id) this.isMongoId(req.params.id,res);

        let pageId = req.params.id;
        let owner = req.user.id

        let page = await pageModel.findOne({_id:pageId, owner});
        // if(!page) return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر پیدا نشد.'),res);
        
        let images = [];
        
        if(req.file) { // if file was stored, transfer the image path into req.body
            images = this.#imageResize(req.file);
            req.body.images = images;
            req.body.thumb = images['480'];
        }
        
        // prevent edit username
        if(req?.body?.username) delete req.body['username'];

        let body = helpers.normalizeData(req.body);
        
        let result = await page.updateOne({$set : body});

        // Remove old pictures if new picture was uploaded
        if(result.acknowledged === true){
            if(req?.file && page.thumb !== CONSTS.PAGE_DEFAULT_THUBM){
                Object.values(page.images).forEach(img=>{
                    try{
                        fs.unlinkSync(`./public${img}`);
                    }catch(err){
    
                    }
                });
            }
        }else{
            return this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش صفحه.'),res)
        }

        return this.successResponse('صفحه مورد نظر با موفقیت ویرایش شد.',res);
    }

    async removePage(req,res,next){
        try {
            // Check ID
            this.isMongoId(req?.params?.id);
    
            //Find page
            let page = await pageModel.findOne({owner: req.user.id, _id: req.params.id});//.populate('owner').exec();
            if(!page) return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر پیدا نشد.'),res);
            
            // Remove all sub posts in page.posts
            // page.posts.forEach(async (post)=>{
                //removePost function
                //await post.remove();
                // console.log(`Remove ${post}`);
            // });
    
            // Remove all images
            if(page.thumb != CONSTS.PAGE_DEFAULT_THUBM){
                Object.values(page.images).forEach(image=>{
                    fs.unlinkSync(`./public${image}`)
                })
            }
    
            // Remove the page
            let result = await page.remove();
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async removePageImage(req,res,next){
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
        let imageAddress = {}
        imageAddress['original'] = this.#getImageUrl(image.destination,image.filename);

        let imageSize = [1080,720,480];
        let resize = async (size)=>{
            let imageName = `${imageInfo.name}-${size}${imageInfo.ext}`;
            imageAddress[size] = this.#getImageUrl(image.destination,imageName);

            await sharp(image.path)
                .resize(size)
                .toFile(`${image.destination}/${imageName}`);
        }

        await imageSize.map(resize);
        return imageAddress;
    }

    #getImageUrl(dir,name){
        return `${dir.substr(8)}/${name}`;
    }
}


module.exports = new pageController;