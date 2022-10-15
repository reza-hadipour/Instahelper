const autoBind = require('auto-bind');
const {validationResult} = require('express-validator');

const { randomNumberGenerator } = require('../../../helpers');

const isMongoID = require('validator/lib/isMongoId');
const createHttpError = require('http-errors');

// Models
const pageModel = require('../../models/pageModel');
const postModel = require('../../models/postModel');

class Controller {
    constructor(){
        autoBind(this);
    }

    createOtp(){
        return {
            code : randomNumberGenerator() , // xxx-xxx
            expiresIn : new Date().getTime() + 10*60000   // 10 Min
        }
    }

    async storeOtp(user,otp){
        user.otp = otp;
        await user.save();
    }

    errorResponse(error,res){
        let err = {
            status : 'failed',
            statusCode: error.statusCode,
            Error: {
                message: error.message
            }
        }

        res.status(error.statusCode).json(err);
    }

    successPrams(){
        return {
            status: "success",
            statusCode: 200
        }
    }

    successResponse(message,res){
        let response = {
            status : 'success',
            statusCode: 200,
            message
        }

        res.status(200).json(response);
    }

    validationData(req){
        return new Promise((resolve)=>{
            let result = validationResult(req);
            if(!result.isEmpty()){
                let errors=[];
                result.array().forEach(err =>{
                    errors.push(`${err.param}: ${err.msg}`);
                });
                req.errors = errors;
                resolve(false);
            }
            resolve(true);
        });
    }

    isMongoId(mongoId,res){
        if(!isMongoID(mongoId)){
            req.errors = "آی دی صفحه معتبر نمی باشد."
            this.errorResponse(createHttpError.BadRequest(req.errors),res);
        }
    }

    checkOwnerShipOfPost(req) {
        return new Promise(async (resolve, reject) => {
            // let pageId = req.params.page;
            let postId = req.params.id;
            let owner = req.user.id;

            // Find Post
            let post = await postModel.findById(postId).populate({path: 'page', select: ['owner', '_id']}).exec();

            // Check ownership of post
            if (! post) 
                return reject(createHttpError.NotFound('پست مورد نظر پیدا نشد.'));
                
            if (post?.page?.owner != owner) 
                return reject(createHttpError.NotAcceptable('این پست متعلق به شما نیست.'));

            resolve(post);
        })
    }

    checkOwnershipOfPage(req){
        return new Promise(async (resolve,reject)=>{
                let owner = req.user.id;
                let pageId = req.params.page;

                let page = await pageModel.findOne({owner, _id: pageId});
                if (! page) 
                    reject(createHttpError.NotAcceptable('این پست متعلق به شما نیست.'))
                resolve(page);
            })
        }
    
}

module.exports = Controller;