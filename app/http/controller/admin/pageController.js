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

class pageController extends Controller{
    async addPage(req,res,next){
        if(!await this.validationData(req)){
            if(req?.file?.path){    // Remove the file if it was stored
                fs.unlinkSync(req.file.path);
            }
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }

        let images = [];

        if(req.file) { // if file was stored, transfer the image path into req.body
            // req.body.pageimage = ((req.file.path).replaceAll('\\','/')).substr(6);
            images = this.imageResize(req.file);
            req.body.images = images;
            req.body.thumb = images['480'];
        }

        let body = helpers.normalizeData(req.body);
        let newPage = new pageModel(body);
        

        newPage.save()
        .then(()=>{
            return res.json({
                status: 'success',
                newPage
            })
        })
        .catch(err =>{
            console.log(err);
            if(err) return this.errorResponse(createHttpError.InternalServerError('خطا در ایجاد صفحه جدید.'),res);
        })
    }

    async editPage(req,res,next){
        if(req?.body?.username) delete req.body['username'];

        let body = helpers.normalizeData(req.body);
        console.log(req);
        console.log(req?.file);
        res.json(body);
    }

    imageResize(image){
        let imageInfo = path.parse(image.path);
        // console.log(imageInfo);
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