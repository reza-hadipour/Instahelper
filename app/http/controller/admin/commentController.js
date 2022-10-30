const Controller = require("../controller");

const isMongoID = require('validator/lib/isMongoId');


//  Models
const commentModel = require('../../../models/commentModel');
const postModel = require("../../../models/postModel");
const pageModel = require("../../../models/pageModel");
const createHttpError = require("http-errors");

class CommentController extends Controller {
    
    async approveComments(req,res,next){
        let postId = req?.query?.post || undefined
        let pageId = req?.query?.page || undefined
        let commentIds = req?.body?.comments || undefined
        let owner = req.user.id;
        let postIds = [];
        let multiCommentIds = [];

        if(postId){
            // Check post ownership
            let checkOwnerShipOfPostError = undefined;
            await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            })

            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError,res);

            postIds.push(postId);
        }else if(pageId){
            // check page ownership
            let checkOwnerShipOfPageError = undefined;
            await this.checkOwnershipOfPage(req).catch(err => {
                checkOwnerShipOfPageError = err;
            })

            if(checkOwnerShipOfPageError) return this.errorResponse(checkOwnerShipOfPageError,res);

            let pages = await pageModel.findById(pageId).populate({path : 'posts'}).exec();
                if(pages?.posts?.length > 0){
                    pages.posts.forEach((post)=>{
                        postIds.push(post.id);
                    })
                }
        }else if(commentIds){
            // Approve a group of comments
            // console.log(typeof commentIds);

            if (typeof commentIds == 'string'){
                multiCommentIds.push(...commentIds.split(','))   // for multiple ids
            }else{
                multiCommentIds = commentIds;   // for single id
            }

            // console.log(multiCommentIds);
            if(!multiCommentIds.every(isMongoID)) {
                return this.errorResponse(createHttpError.BadRequest('شناسه نظرهای ارسالی صحیح نمی باشد.'),res);
            }
        }else{
            // All comment of user

            // Dont let approve all comments
            return this.errorResponse(createHttpError.BadRequest('کامنت های مورد نظر خود را وارد کنید.'),res);

            // let pages = await pageModel.find({owner}).populate({path : 'posts'}).exec();
            // pages.forEach(page => {
            //     if(page?.posts?.length > 0){
            //         page.posts.forEach((post)=>{
            //             postIds.push(post.id);
            //         })
            //     }
            // });
        }

        let comments;

        // for muliple comments
        if(commentIds != undefined){
            comments = await commentModel.find({'approved': false, 'visible' : true, '_id' : {$in : multiCommentIds}})
            .populate({
                path: 'post',
                populate : {
                    path : 'page',
                    select : 'owner'
                }
            }).exec();
        }else{
            comments = await commentModel.find({'approved': false, 'visible' : true, 'post' : {$in : postIds}})
            .populate({
                path: 'post',
                populate : {
                    path : 'page',
                    select : 'owner'
                }
            }).exec();
        }
       
        if(comments?.length > 0){
            let countOfApproved = 0;
            let postsChanged = {};
            comments.forEach(async (comment) => {
                if(comment?.post?.page?.owner == owner){    // Check comment ownership
                    countOfApproved += 1
                    if( typeof postsChanged[comment.post._id] != 'number' ) {
                        postsChanged[comment.post._id] = 1;
                    }else{
                        postsChanged[comment.post._id] += 1;
                    }
                    comment.approve();
                }
            });
            // console.log('Total',countOfApproved);

            // Update Post commentCount number
            // console.log(postsChanged);
            Object.keys(postsChanged).forEach(async (key)=>{
                // console.log(key,postsChanged[key]);
                let updatePosts = await postModel.findOneAndUpdate({"_id" : key},{$inc : {"commentCount" : postsChanged[key]}});
                // console.log(updatePosts);
            })
            
            
            return res.json({
                ...this.successPrams(),
                message: (countOfApproved>0 )? `${countOfApproved} نظر تایید شد.` : 'هیچ نظری تایید نشد.'
            });

        }else{
            return this.errorResponse(createHttpError.NotFound('نظری یافت نشد.'),res);
        }
  
    }

    async approveCommentOLD(req,res,next){
        let commentId = req?.params?.comment || undefined
        let owner = req.user.id;
       
        let comment = await commentModel.find({'_id' : commentId, 'visible' : true})
        .populate([
            {
                path: 'post',
                select : ['title'],
                populate : {
                    path : 'page',
                    select : ['owner']
                }
            }
        ]);

        if(comment?.length > 0){
            if(comment?.post?.page?.owner != owner) return this.errorResponse(createHttpError.Unauthorized('این نظر به شما تعلق ندارد.'),res);

            await comment.approve();
            await comment.save();
            return res.json({
                ...this.successPrams(),
                message: 'پیام مورد نظر تایید شد.'
            })

        }else{
            return this.errorResponse(createHttpError.NotFound('نظر مورد نظر پیدا نشد.'),res);
        }
  
    }

    async removeComments(req,res,next){
        let postId = req?.query?.post || undefined
        let pageId = req?.query?.page || undefined
        let commentIds = req?.body?.comments || undefined
        let owner = req.user.id;
        let postIds = [];
        let multiCommentIds = [];

        if(postId){
            // Check post ownership
            let checkOwnerShipOfPostError = undefined;
            await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            })

            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError,res);

            postIds.push(postId);
        }else if(pageId){
            // check page ownership
            let checkOwnerShipOfPageError = undefined;
            await this.checkOwnershipOfPage(req).catch(err => {
                checkOwnerShipOfPageError = err;
            })

            if(checkOwnerShipOfPageError) return this.errorResponse(checkOwnerShipOfPageError,res);

            let pages = await pageModel.findById(pageId).populate({path : 'posts'}).exec();
                if(pages?.posts?.length > 0){
                    pages.posts.forEach((post)=>{
                        postIds.push(post.id);
                    })
                }
        }else if(commentIds){
            // Delete a group of comment IDs
            // console.log(typeof commentIds);
            if (typeof commentIds == 'string'){
                multiCommentIds.push(...commentIds.split(','));   // for multiple ids
            }else{
                multiCommentIds = commentIds;   // for single id
            }

            // console.log(multiCommentIds);
            if(!multiCommentIds.every(isMongoID)) {
                return this.errorResponse(createHttpError.BadRequest('شناسه نظرهای ارسالی صحیح نمی باشد.'),res);
            }
        }else{
            // Remove All Comments
            // Dont let approve all comments
            return this.errorResponse(createHttpError.BadRequest('کامنت های مورد نظر خود را وارد کنید.'),res);

            // let pages = await pageModel.find({owner}).populate({path : 'posts'}).exec();
            // pages.forEach(page => {
            //     if(page?.posts?.length > 0){
            //         page.posts.forEach((post)=>{
            //             postIds.push(post.id);
            //         })
            //     }
            // });
        }

        let comment;

        // for muliple comments
        if(commentIds != undefined){
            // Find comments based on ID
            comment = await commentModel.find({'visible' : true, '_id' : {$in : multiCommentIds}})
            .populate([
                {
                    path: 'comments',
                    populate : {
                        path: 'post'
                    }
                },
                {
                    path: 'post',
                    populate : [{
                        path : 'page',
                        select : ['owner']
                    }]
                }
            ]);
        }else{
            // Find comments based on POST ID
            comment = await commentModel.find({'visible' : true, 'parent' : null ,'post' : {$in : postIds}})
            .populate([
                {
                    path: 'comments',
                    populate : {
                        path: 'post'
                    }
                },
                {
                    path: 'post',
                    populate : [{
                        path : 'page',
                        select : ['owner']
                    }]
                }
            ]);
        }
       
        if(comment.length > 0){
            let postsChanged = {};
            comment.forEach(async (parentComment) => {

                // Delete SubComments
                if(parentComment?.comments?.length > 0){
                    parentComment.comments.forEach(async currentComment => {
                        await currentComment.hide();
                    });
                }
    
                // Hide comments
                // parentComment.visible = false;
                // parentComment.save()
                
                let modifiedNumber = parentComment?.comments?.length ?? 0;
                await parentComment.hide();

                if( typeof postsChanged[parentComment.post._id] != 'number' ) {
                    postsChanged[parentComment.post._id] = modifiedNumber + 1;
                }else{
                    postsChanged[parentComment.post._id] += modifiedNumber + 1;
                }
                
            })
            
            // console.log(postsChanged);
            Object.keys(postsChanged).forEach(async (key)=>{
                // console.log(key,postsChanged[key]);
                let updatePosts = await postModel.findOneAndUpdate({"_id" : key},{$inc : {"commentCount" : (-1 * postsChanged[key])}});
                // console.log(updatePosts);
            })


            return res.json({
                ...this.successPrams(),
                message: 'پیام مورد نظر حذف شد.'
            })

        }else{
            return this.errorResponse(createHttpError.NotFound('نظری پیدا نشد.'),res);
        }
  
    }

    async removeCommentOLD(req,res,next){
        let commentId = req?.params?.comment || undefined
        let owner = req.user.id;
       
        let comment = await commentModel.find({'_id' : commentId, 'visible' : true})
        .populate([
            {
                path: 'comments',
                populate : {
                    path: 'post'
                }
            },
            {
                path: 'post',
                populate : [{
                    path : 'page',
                    select : ['owner']
                }]
            }
        ]);

        if(comment.length > 0){
            if(comment?.post?.page?.owner != owner) return this.errorResponse(createHttpError.Unauthorized('این نظر به شما تعلق ندارد.'),res);
            
            // Delete SubComments
            if(comment?.comments?.length > 0){
                comment.comments.forEach(async currentComment => {
                    await currentComment.hide();
                });
            }

            // Hide comments
            await comment.hide();
            let modifiedNumber = comment?.comments?.length || 0;
            await comment.post.dec('comment',modifiedNumber + 1);
            return res.json({
                ...this.successPrams(),
                message: 'پیام مورد نظر حذف شد.'
            })

        }else{
            return this.errorResponse(createHttpError.NotFound('نظر مورد نظر پیدا نشد.'),res);
        }
  
    }

    async showComments(req,res,next){
        let postId = req?.query?.post || undefined
        let pageId = req?.query?.page || undefined;
        let approvedQuery = req?.query?.approved || 'all';
        let approveCondition =  {};
        let owner = req.user.id;
        let postIds = [];

        if(approvedQuery){
            switch (approvedQuery) {
                case 'true':
                    approveCondition =  {'approved' : true};
                    break;
                case 'false':
                    approveCondition =  {'approved' : false};
                    break;
                default:
                    approveCondition =  {};
                    break;
            }
        }

        if(postId){
            // Check post ownership
            let checkOwnerShipOfPostError = undefined;
            await this.checkOwnerShipOfPost(req).catch(err => {
                checkOwnerShipOfPostError = err;
            })

            if(checkOwnerShipOfPostError) return this.errorResponse(checkOwnerShipOfPostError,res);

            postIds.push(postId);
        }else if(pageId){
            // check page ownership
            let checkOwnerShipOfPageError = undefined;
            await this.checkOwnershipOfPage(req).catch(err => {
                checkOwnerShipOfPageError = err;
            })

            if(checkOwnerShipOfPageError) return this.errorResponse(checkOwnerShipOfPageError,res);

            let pages = await pageModel.findById(pageId).populate({path : 'posts'}).exec();
                if(pages?.posts?.length > 0){
                    pages.posts.forEach((post)=>{
                        postIds.push(post.id);
                    })
                }
        }else{
            let pages = await pageModel.find({owner}).populate({path : 'posts'}).exec();
            pages.forEach(page => {
                if(page?.posts?.length > 0){
                    page.posts.forEach((post)=>{
                        postIds.push(post.id);
                    })
                }
            });
        }

       
        let comments = await commentModel.find({'visible': true, 'post' : {$in : postIds}, ...approveCondition},{},{sort: {'createdAt': 1}})
        .populate([
            {
                path: 'author',
                select : ['name','family','email']
            },{
                path: 'post',
                select : ['title'],
                populate : {
                    path : 'page',
                    select : ['owner','username','title']
                }
            }
        ]);
  
        
        if(comments?.length > 0){
            res.json({
                ...this.successPrams(),
                'totalComments' : comments.length,
                comments: comments})
        }else{
            res.json({
                ...this.successPrams(),
                'totalComments' : 0,
                comments: []
            })
        }
    }

}

module.exports = new CommentController;