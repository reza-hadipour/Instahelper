const pageModel = require('../../models/pageModel');

const checkingSubscriptions = async function(req,res,next){
    let username = String(req?.params?.username).toLowerCase() || undefined;
    let userId = req?.user?.id || undefined;

    if(await global.myRedisClient.sIsMember(`InstaHelper:Followers:${username}`,userId)){
        // step 1 check in redis InstaHelper:Follower:username
        req.user.isFollower = true;
    }else{
        // step 2 check in model
        let page = await pageModel.findOne({username, 'active': true});
        if(page?.followers?.includes(userId)){
            // Add in redis InstaHelper:Follower:username
            global.myRedisClient.sAdd(`InstaHelper:Followers:${username}`,userId);
            req.user.isFollower = true;
        }else{
            req.user.isFollower = false;
        }
    }

    next();

    // let x = ['Ali','Reza','hadis'];
    // myRedisClient.sAdd('X','AKU3');
    // myRedisClient.sRem('X','AKU3');
}

module.exports = {
    checkingSubscriptions
}