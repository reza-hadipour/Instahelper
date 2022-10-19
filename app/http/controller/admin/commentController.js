const Controller = require("../controller");


//  Models
const commentModel = require('../../../models/commentModel');
const postModel = require("../../../models/postModel");
const pageModel = require("../../../models/pageModel");
const createHttpError = require("http-errors");

class CommentController extends Controller {
    
    async approveAllComments(req,res,next){
        let postId = req?.query?.post || undefined
        let pageId = req?.query?.page || undefined
        let owner = req.user.id;
        let postIds = [];


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
       
        let comments = await commentModel.find({'approved': false, 'visible' : true ,'post' : {$in : postIds}});
        

        if(comments?.length > 0){
            let countOfApproved = 0;
            comments.forEach(async (comment) => {
                comment.approve();
                countOfApproved += 1;
            });
            console.log('Total',countOfApproved);
            
            return res.json({
                ...this.successPrams(),
                message: `${countOfApproved} نظر تایید شد.`
            });

        }else{
            return this.errorResponse(createHttpError.NotFound('نظری یافت نشد.'),res);
        }
  
    }

    async approveComment(req,res,next){
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

    async removeAllComments(req,res,next){
        let postId = req?.query?.post || undefined
        let pageId = req?.query?.page || undefined
        let commentIds = req?.body?.comments || undefined
        let owner = req.user.id;
        let postIds = [];

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
       
        let comment = await commentModel.find({'visible' : true, 'parent' : null ,'post' : {$in : postIds}})
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

        // return res.json(comment);

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
                
                let modifiedNumber = parentComment?.comments?.length || 0;
                if( typeof postsChanged[parentComment.post._id] != 'number' ) {
                    postsChanged[parentComment.post._id] = modifiedNumber + 1;
                }else{
                    postsChanged[parentComment.post._id] += modifiedNumber + 1;
                }
                
                await parentComment.hide();
            })
            
            console.log(postsChanged);
            Object.keys(postsChanged).forEach(async (key)=>{
                console.log(key,postsChanged[key]);
                let updatePosts = await postModel.findOneAndUpdate({"_id" : key},{$inc : {"commentCount" : (-1 * postsChanged[key])}});
                console.log(updatePosts);
            })


            return res.json({
                ...this.successPrams(),
                message: 'پیام مورد نظر حذف شد.'
            })

        }else{
            return this.errorResponse(createHttpError.NotFound('نظری پیدا نشد.'),res);
        }
  
    }

    async removeComment(req,res,next){
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

    async showUnapprovedComments(req,res,next){
        let postId = req?.query?.post || undefined
        let pageId = req?.query?.page || undefined;
        let owner = req.user.id;
        let postIds = [];


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

       
        let comments = await commentModel.find({'approved': false, 'visible': true, 'post' : {$in : postIds}},{},{sort: {'createdAt': 1}})
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
                message: 'نظر تایید نشده ای پیدا نشد.'})
        }
    }

}

module.exports = new CommentController;