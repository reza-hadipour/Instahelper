const createHttpError = require('http-errors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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

    async addComment(req,res,next){

        if (!await this.validationData(req)) {
            return this.errorResponse(createHttpError.BadRequest(req.errors), res);
        }

        let postId = req?.params?.post;

        let checkOwnerShipOfPostError = undefined;
        let post = await this.checkOwnerShipOfPost(req).catch(err => {
            checkOwnerShipOfPostError = err;
        });
        if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError, res);

        let comment = new commentModel({
            author : req.user.id,
            post: postId,
            comment : req.body.comment
        });

        await comment.save();
        // await post.inc('comment');
        return res.json(comment);
    }

    async addSubComment(req,res,next){
        let postId = req?.params?.post;
        let parentComment = req?.params?.comment;

        let post = await this.checkOwnerShipOfPost(req).catch(err => {
            return this.errorResponse(err, res);
        });

        let comment = new commentModel({
            author : req.user.id,
            post: postId,
            comment : req.body.comment,
            parent: parentComment
        });

        await comment.save();
        // await post.inc('comment');
        return res.json(comment);
    }

}


module.exports = new postController;
