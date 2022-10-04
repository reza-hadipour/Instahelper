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
            images = this.imageResize(req.file);
            req.body.images = images;
            req.body.thumb = images['480'];
        }else{
            // Set default images for new page
            let imageSize = [1080,720,480];
            images['original'] = CONSTS.PAGE_DEFAULT_THUBM;
            imageSize.map(size => images[size] = `/public/images/pageDef-${size}.jpg`);
            req.body.images = images;
            req.body.thumb = images['480'];
        }
        
        req.body.owner = req.user.id;

        let body = helpers.normalizeData(req.body);
        let newPage = new pageModel(body);
        
        newPage.save()
        .then(()=>{
            return res.json({
                status: 'success',
                statusCode : 200,
                newPage
            })
        })
        .catch(err =>{
            console.log(err);
            if(err) return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد صفحه جدید.'),res);
        })
    }

    async editPage(req,res,next){
        if(!await this.validationData(req)){
            if(req?.file?.path){    // Remove the file if it was stored
                fs.unlinkSync(req.file.path);
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        if(req?.params?.id) this.isMongoId(req.params.id,res);

        let pageId = req.params.id;
        let owner = req.user.id

        let page = await pageModel.findOne({_id:pageId, owner});
        if(!page) return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر پیدا نشد.'),res);
        
        let images = [];
        
        if(req.file) { // if file was stored, transfer the image path into req.body
            images = this.imageResize(req.file);
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
        
        return res.json({
            status: 'success',
            statusCode : 200,
            message: 'صفحه مورد نظر با موفقیت ویرایش شد.'
        });
    }


    imageResize(image){
        let imageInfo = path.parse(image.path);
        let imageAddress = {}
        imageAddress['original'] = this.getImageUrl(image.destination,image.filename);

        let imageSize = [1080,720,480];
        let resize = size=>{
            let imageName = `${imageInfo.name}-${size}${imageInfo.ext}`;
            imageAddress[size] = this.getImageUrl(image.destination,imageName);

            sharp(image.path)
                .resize(size)
                .toFile(`${image.destination}/${imageName}`);
        }

        imageSize.map(resize);
        return imageAddress;
    }

    getImageUrl(dir,name){
        return `${dir.substr(8)}/${name}`;
    }
}


module.exports = new pageController;