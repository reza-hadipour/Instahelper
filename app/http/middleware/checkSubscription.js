const { default: isMongoId } = require('validator/lib/ismongoid');
const pageModel = require('../../models/pageModel');

const checkingSubscriptions = async function(req,res,next){
    let username = String(req?.params?.username).toLowerCase();
    let userId = req?.user?.id || 'noUser';
    let page = undefined;

    // Check page status [Public/Private]
    req.page = {};  // Check page status in req.page.isPrivatePage
    req.page.isPrivatePage = false;

    // SET req.user default FALSE
    if(req?.user){
        req.user.isFollower = false;
    }else{
        req.user = {};
        req.user.isFollower = false;            
    }

    // CHECKING PAGE STATUS
    if(await global.myRedisClient.sIsMember('InstaHelper:PrivatePages',username)){
        req.page.isPrivatePage = true;            
    }else{
        // Check in pageModel
        page = await pageModel.findOne({username, 'active': true});
        if(page && page?.status == 'private'){
            req.page.isPrivatePage = true;
            global.myRedisClient.sAdd('InstaHelper:PrivatePages',username)
             // else isPrivatePage default is FALSE
        }
    }

    // CHECKING USER STATUS
    if(await global.myRedisClient.sIsMember(`InstaHelper:Followers:${username}`,userId)){
        // step 1 check in redis InstaHelper:Follower:username
        req.user.isFollower = true;
    }else{
        // step 2 check in pageModel
        if(!page == null || !page) page = await pageModel.findOne({username, 'active': true});

        if(page){
            if(page?.followers?.includes(userId)){
                req.user.isFollower = true;            
                global.myRedisClient.sAdd(`InstaHelper:Followers:${username}`,userId);
            }
        }
    }

    next();


    // if(await global.myRedisClient.sIsMember(`InstaHelper:Followers:${username}`,userId)){
    //     // step 1 check in redis InstaHelper:Follower:username
    //     req.user.isFollower = true;
    // }else{
    //     // step 2 check in model
    //     if(username){
    //         page = await pageModel.findOne({username, 'active': true});
    //     }else if(pageId){
    //         page = await pageModel.findOne({'_id': pageId, 'active': true});
    //     }else if(postId){
    //         if(post?.page) page = post?.page;
    //     }

    //     if(page?.followers?.includes(userId)){
    //         // Add in redis InstaHelper:Follower:username
    //         global.myRedisClient.sAdd(`InstaHelper:Followers:${username}`,userId);
    //         req.user.isFollower = true;
    //     }else{
    //         req.user.isFollower = false;
    //     }
    // }

    // let x = ['Ali','Reza','hadis'];
    // myRedisClient.sAdd('X','AKU3');
    // myRedisClient.sRem('X','AKU3');
}

module.exports = {
    checkingSubscriptions
}