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
const userModel = require('../../../models/userModel');

// Helper
const helpers = require('../../../../helpers');
const e = require('express');

'use strict';
class postController extends Controller {

    async likeSinglePost(req,res,next){
        let username = String(req?.params?.page).toLowerCase() || undefined;
        let slug = req?.params?.post || undefined;
        let userId = req?.user?.id;

        let page = await pageModel.findOne({username, 'active': true}).populate({
            path : 'posts',
            match : {slug , 'active': true},
            sort : {'createdAt' : -1},
            select : ['title','slug','likeCount','likes'],
            perDocumentLimit : 1,
        }).exec();

        this.#checkPageSubscribtion(page,userId)
            .then ( async ()=> {
                if(page?.posts?.length > 0){
                    let post = page.posts[0];
                    let likeIdx = post.likes.indexOf(userId);
                    let operation;
                    if(likeIdx > -1){
                        // Unlike
                        post.likes.splice(likeIdx,1);
                        await post.dec('like');
                        operation = 'unlike';
                    }else{
                        // Big Like
                        post.likes.push(userId);
                        await post.inc('like');
                        operation = 'like';
                    }

                    return res.json({
                        ...this.successPrams(),
                        'pageUsername' : page.username,
                        'postTitle' : post.title,
                        'postSlug' : post.slug,
                        'message' : `${post.title} با موفقیت ${operation} شد.`
                    })

                }else{
                    next();
                }
            })
            .catch ( async (err) => {
                return this.errorResponse(err,res)
            });
    }

    async showSinglePostLikes(req,res,next){
        let username = String(req?.params?.page).toLowerCase() || undefined;
        let slug = req?.params?.post || undefined;
        let userId = req?.user?.id;

        let pageNum = req?.query?.page || 1;
        let limit = req?.query?.limit || 20;

        let page = await pageModel.findOne({username, 'active': true}).populate({
            path : 'posts',
            match : {slug , 'active': true},
            sort : {'createdAt' : -1},
            select : ['title','slug','likeCount','likes'],
            perDocumentLimit : 1,
        }).exec();

        this.#checkPageSubscribtion(page,userId)
        .then( async () => {
            if(page?.posts?.length > 0){
                // Get users
                let post = page.posts[0];
                if(post?.likeCount > 0){
                    let users = await userModel.paginate({'_id' : {$in : post?.likes}},{
                        select : ['name', 'family','fullname'],
                        sort : {'createdAt' : -1},
                        'page' : pageNum,
                        'limit' : limit,
                    });
    
                    let data = {
                        pageUsername : page.username,
                        postTitle : post.title,
                        postSlug : post.slug,
                        likes : (users?.docs?.length > 0 ) ? users.docs : [],
                        'page' : pageNum,
                        'pages' : users?.pages,
                        'total' : users?.total,
                        'limit' : users?.limit,
                    }
                    return res.json(data);
                }else{
                    let data = {
                        'pageUsername' : page.username,
                        'postTitle' : post.title,
                        'postSlug' : post.slug,
                        'likes' : [],
                        'page' : 1,
                        'pages' : 1,
                        'total' : 0,
                        'limit' : 1,
                    }
                    return res.json(data);
                }
                
            }else{
                next();
            }
        })
        .catch( err => this.errorResponse(err,res));
    }

    async showSinglePostComments(req,res,next){
        let username = String(req?.params?.page).toLowerCase() || undefined;
        let slug = req?.params?.post || undefined;
        let userId = req?.user?.id;

        let pageNum = req?.query?.page || 1;
        let limit = req?.query?.limit || 10;
        let subLimit = req?.query?.sublimit || 3;

        let page = await pageModel.findOne({username, 'active': true}).populate({
            path : 'posts',
            match : {slug , 'active': true},
            sort : {'createdAt' : -1},
            select : ['title','slug','commentCount',],
            perDocumentLimit : 1,
        }).exec();

        this.#checkPageSubscribtion(page,userId)
            .then ( async ()=> {
                if(page?.posts?.length > 0){
                    // Get Comments
                    let post = page.posts[0];
                    if(post?.commentCount > 0){
                        let comments = await commentModel.paginate({'post' : post?._id, 'approved': true, 'visible' : true , 'parent' : null},{
                            select : ['-approved','-visible','-parent','-createdAt','-updatedAt','-__v'],
                            sort : {'createdAt' : -1},
                            'page' : pageNum,
                            'limit' : limit,
                            populate : [
                                {
                                    path : 'author',
                                    select : ['name','family','fullname']
                                },
                                {
                                    path : 'comments',
                                    match : {'approved': true, 'visible' : true},
                                    select : ['-visible', '-approved','-createdAt','-updatedAt','-__v'],
                                    options : {
                                        sort : {'createdAt' : -1}
                                    },
                                    populate : {
                                        path : 'author',
                                        select : ['name','family','fullname']
                                    },
                                    perDocumentLimit : subLimit
                                }
                            ]
                        });
        
                        let data = {
                            ...this.successPrams(),
                            pageUsername : page.username,
                            postTitle : post.title,
                            postSlug : post.slug,
                            comments : (comments?.docs?.length > 0 ) ? comments.docs : [],
                            'page' : pageNum,
                            'pages' : comments?.pages,
                            'total' : comments?.total,
                            'limit' : comments?.limit,
                        }
                        return res.json(data);
        
                    }else{
                        let data = {
                            ...this.successPrams(),
                            'pageUsername' : page.username,
                            'postTitle' : post.title,
                            'postSlug' : post.slug,
                            'comments' : [],
                            'page' : 1,
                            'pages' : 1,
                            'total' : 0,
                            'limit' : 1,
                        }
                        return res.json(data);
                    }
                }else{
                    next();
                }
            })
            .catch (err => {
                return this.errorResponse(err,res);
            })
    }

    async showSinglePost(req,res,next){
        let username = String(req?.params?.page).toLowerCase() || undefined;
        let slug = req?.params?.post || undefined;
        let userId = req?.user?.id || undefined;

        let page = await pageModel.findOne({username, 'active': true}).populate({
            path : 'posts',
            match : {slug , 'active': true},
            sort : {'createdAt' : -1},
            select : ['title','images','links','likes','likeCount','viewCount','commentCount','comments'],
            perDocumentLimit : 1,
            populate : [
                {
                    path : 'comments',
                    match : {'approved': true , 'visible': true , 'parent' : null},
                    sort : {'createdAt' : -1},
                    perDocumentLimit : 3,
                    populate : 
                    [
                        {
                            path : 'author',
                            select: ['id','name','family','fullname']
                        },
                        {
                            path : 'comments',
                            match : {'approved': true , 'visible': true},
                            sort : {'createdAt' : 1},
                            perDocumentLimit : 1,
                            populate : 
                            {
                                path : 'author',
                                select: ['id','name','family','fullname']
                            }
                        }
                    ]
                },
                {
                    path : 'links',
                    sort : {'createdAt' : 1}
                },
                {
                    path : 'likes',
                    select: ['id','name','family','fullname'],
                    perDocumentLimit : 5
                }
                
            ]
        }).exec();

        this.#checkPageSubscribtion(page,userId)
        .then( async () => {
            if(page?.posts?.length > 0){
                let data = {
                    pageUsername : page.username,
                    pageTitle : page.title,
                    pageStatus : page.status,
                    post : page.posts[0]
                }
    
                // Inc postView
                await page.posts[0].inc('view');
                return res.json(data);
    
            }else{
                next();
            }
        })
        .catch( err => this.errorResponse(err,res));
        
    }

    async addComment(req,res,next){
        let postId = req?.params?.post;
        let userId = req?.user?.id;

        let post = await postModel.findOne({'_id' : postId, 'active' : true})
        .populate({
            path : 'page',
            select : ['followers', 'followersNum', 'status' , 'active', 'username'],
            match : {'active' : true}
        }).exec();

        if(post?.page){
            let page = post.page;
            this.#checkPageSubscribtion(page,userId)
            .then(async ()=>{
                // return res.json(post);
                let comment = new commentModel({
                    author : req.user.id,
                    post: postId,
                    comment : req.body.comment
                });
                await comment.save();
                return res.json({
                    ...this.successPrams(),
                    'comentId' : comment.id,
                    'commentPost' : comment.post,
                    'comment': comment.comment,
                    message : 'نظر شما با موفقیت ثبت شد و پس از تایید شدن نمایش داده میشود.'
                });
            })
            .catch( err => {
                return this.errorResponse(err,res);
            })

        }else{
            return this.errorResponse(createHttpError.BadRequest('امکان ثبت نظر وجود ندارد.'),res);
        }
    }

    async addSubComment(req,res,next){
        let parentComment = req?.params?.comment;
        let userId = req?.user?.id;

        let parent = await commentModel.findOne({'_id': parentComment, 'approved' : true , 'visible' : true});

        let post = await postModel.findOne({'_id' : parent?.post, 'active' : true})
        .populate({
            path : 'page',
            select : ['followers', 'followersNum', 'status' , 'active', 'username'],
            match : {'active' : true}
        }).exec();

        if(post?.page){
            let page = post.page;
            this.#checkPageSubscribtion(page,userId)
            .then(async ()=>{
                // return res.json(post);
                let comment = new commentModel({
                    author : req?.user?.id,
                    post: parent?.post,
                    comment : req.body.comment,
                    parent: parentComment
                });
                await comment.save();
                return res.json({
                    ...this.successPrams(),
                    'parent' : comment.parent,
                    'comentId' : comment.id,
                    'commentPost' : comment.post,
                    'comment': comment.comment,
                    message : 'نظر شما با موفقیت ثبت شد و پس از تایید شدن نمایش داده میشود.'
                });
            })
            .catch( err => {
                return this.errorResponse(err,res);
            });
        }else{
            return this.errorResponse(createHttpError.BadRequest('امکان ثبت نظر وجود ندارد.'),res);
        }
    }
    
    async #checkPageSubscribtion(page,userId){
        return new Promise((resolve,reject)=>{
            if(page.status == 'private'){
                // if (!page?.followers.includes(userId)){
                if (req?.user?.isFollower){
                    resolve(true);
                }else{
                    reject(createHttpError.Unauthorized('محتویات این صحفه خصوصی است.'));
                }
            }else{
                resolve(true);
            }
        })
        
    }
}


module.exports = new postController;
