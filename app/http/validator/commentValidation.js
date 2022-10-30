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

    approveComment() {
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

    approveCommentOLD() {
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

    removeCommentOLD() {
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

    removeComments() {
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
