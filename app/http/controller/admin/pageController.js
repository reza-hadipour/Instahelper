const createHttpError = require('http-errors');
const fs = require('fs');

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

        if(req.file) { // if file was stored, transfer the image path into req.body
            req.body.pageimage = ((req.file.path).replaceAll('\\','/')).substr(6);
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
}


module.exports = new pageController;