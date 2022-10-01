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
            fs.unlinkSync(req?.file?.path);
            return this.errorResponse(createHttpError.BadRequest(req.errors),res);
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