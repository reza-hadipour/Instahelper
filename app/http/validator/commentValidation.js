let {body, query, param} = require('express-validator');
const Validator = require('./validator');
const path = require('path');

// Models
const pageModel = require('../../models/pageModel');

class commentValidation extends Validator {
    
    showUnapprovedComments() {
        return [
            query('page').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه صفحه معتبر نمی باشد.');
                    }
                }
                return true;
            }),
            query('post').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه پست معتبر نمی باشد.');
                    }
                }
                return true;
            })
            ]
    }

    approveAllComment() {
        return [
            query('page').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه صفحه معتبر نمی باشد.');
                    }
                }
                return true;
            }),
            query('post').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه پست معتبر نمی باشد.');
                    }
                }
                return true;
            })
            ]
    }

    approveComment() {
        return [
            param('comment').notEmpty().withMessage('شناسه نظر را وارد کنید.')
            .custom(comment => {
                if(comment){
                    if( ! Validator.isMongoId(comment)){
                        throw new Error('شناسه نظر معتبر نمی باشد.');
                    }
                }
                return true;
            })
            ]
    }

    removeComment() {
        return [
            param('comment').notEmpty().withMessage('شناسه نظر را وارد کنید.')
            .custom(comment => {
                if(comment){
                    if( ! Validator.isMongoId(comment)){
                        throw new Error('شناسه نظر معتبر نمی باشد.');
                    }
                }
                return true;
            })
            ]
    }

    removeAllComments() {
        return [
            query('page').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه صفحه معتبر نمی باشد.');
                    }
                }
                return true;
            }),
            query('post').custom(pageId => {
                if(pageId){
                    if( ! Validator.isMongoId(pageId)){
                        throw new Error('شناسه پست معتبر نمی باشد.');
                    }
                }
                return true;
            })
            ]
    }



}

module.exports = new commentValidation;
