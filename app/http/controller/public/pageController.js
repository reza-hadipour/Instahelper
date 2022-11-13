// PageController in Public routes
//
// //////////////////////////////// //


const Controller = require('../controller');

// Models
const pageModel = require('../../../models/pageModel');
const createHttpError = require('http-errors');
const postModel = require('../../../models/postModel');
const requestsModel = require('../../../models/requestsModel');

class pageController extends Controller{
    
    async exploreSubscribedPages(req,res,next){
        let userId = req?.user?.id || undefined;
        
        let pages = await pageModel.find({'active' : true , 'followers' : {$in : userId}},'username title posts' , {limit : 5})
        .populate({
            path : 'posts',
            match : {'active' : true},
            select : '-links -likes -updatedAt',
            options  : {
                sort : {'createdAt' : -1},
                perDocumentLimit : 1
            }
        }).exec();

        if(pages?.length > 0){
            let data = [];
            pages.forEach(page => {
                let tempData = {};
                if(page?.posts?.length > 0){
                    let post = page.posts[0];
                    tempData = {
                        pageId : page._id,
                        pageUsername : page.username,
                        pageTitle: page.title,
                        post
                    }
                    data.push(tempData);
                }
            });

            if(data?.length > 0 ) {
                data.sort((a,b)=> b.post.createdAt - a.post.createdAt); // Sort posts according createdAt
                return res.json(data);
            }
            
            return res.status(404).json(`There is Nothing to show`);

        }else{
            // Show Explorer, Top Public Page`a post
            let pages = await pageModel.find({'active' : true , 'status' : 'public',},'username title posts',{limit : 5})
            .populate({
                path : 'posts',
                match : {'active' : true},
                select : '-links -likes -updatedAt',
                options  : {
                    sort : {'createdAt' : -1},
                    perDocumentLimit : 1 
                }
            }).exec();

            if(pages?.length > 0){
                let data = [];
                pages.forEach(page => {
                    let tempData = {};
                    if(page?.posts?.length > 0){
                        let post = page.posts[0];
                        tempData = {
                            pageId : page._id,
                            pageUsername : page.username,
                            pageTitle: page.title,
                            post
                        }
                        data.push(tempData);
                    }
                });

                if(data?.length > 0 ) {
                    data.sort((a,b)=> b.post.createdAt - a.post.createdAt); // Sort posts according createdAt
                    return res.json(data);
                }
            }
            return res.status(404).json(`There is Nothing to show`);
        }
    }

    async showSinglePage(req,res,next){
        let username = String(req?.params?.username).toLowerCase() ||  undefined;
        let userId = req?.user?.id || undefined;

        let postLimit = req?.query?.limit || 3;
        let pageNum = req?.query?.page || 1;
        
        // page = await pageModel.find({username, 'active' : true, 'followers': {$in : userId} })
        let page = await pageModel.findOne({username, 'active' : true },'-owner -active -createdAt -updatedAt -__v');
        // .populate({
        //     path : 'posts',
        //     match : {'active' : true},
        //     select : '-links -likes -updatedAt',
        //     options  : {
        //         sort : {'createdAt' : -1}
        //     }
        // }).exec();

        if(page){
            if(page.status == 'public'){
                // Find its lates posts
                let data = await this.#getLtestPosts(page,pageNum,postLimit);
                return res.json(data);
            }else{
                if( !page?.followers?.includes(userId)){
                    // Show only general information of the page
                    return res.json({
                        status : page.status,
                        username : page.username,
                        title : page.title,
                        thumb : page.thumb,
                        images : page.images,
                        followersNum : page.followersNum
                    });
                }else{
                    // once user follows the page
                    page.followers = [userId]; // Dont show other followers
                    // find its latest posts
                    let data = await this.#getLtestPosts(page,pageNum,postLimit);
                    return res.json(data);
                }
            }
        }else{
            return next();
            return res.status(404).json(`${username} Not Found`);
        }
    }

    async followPage(req,res,next){
        let username = String(req?.params?.username).toLowerCase();
        let userId = req?.user?.id;

        //Check whether page is exists
        let page = await pageModel.findOne({username, 'active' : true },'-owner -active -createdAt -updatedAt -__v');

        if(page){
            let followerIdx = page.followers.indexOf(userId);
            if(followerIdx == -1){
                if(page.status == 'public'){
                    page.followers.push(userId);
                    await page.inc();
                    return res.json({
                        ...this.successPrams(),
                        message : `Your are following ${page.title} succesfully`
                    });
                }else{
                    // Send request to Follow the page
                    let reqHistory = await requestsModel.findOne({'requester' : userId});
                    if(!reqHistory){
                        // create new request
                        const newReq = new requestsModel({
                            page : page._id,
                            requester : userId
                        });
                        await newReq.save();
                        return res.json({
                            ...this.successPrams(),
                            message : `Your following request sent to ${page.title} succesfully`
                        });
                    }else{
                        // Remove the old request
                        await reqHistory.remove();
                        return res.json({
                            ...this.successPrams(),
                            message : `Your following request removed from ${page.title} list succesfully`
                        });
                    }
                }
            }else{
                // Unfollow the page
                page.followers.splice(followerIdx,1);
                await page.inc(-1);
                
                // Remove username from Redis in InstaHelper:Follower:username
                global.myRedisClient.sRem(`InstaHelper:Followers:${page.username}`,userId);

                return res.json({
                    ...this.successPrams(),
                    message : `You Unfollow ${page.title} Succesfully`
                });
            }
        }else{
            return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر یافت نشد.'),res);
        }
    }

    async #getLtestPosts(page,pageNum,limit){
        let posts = await postModel.paginate({'page' : page.id, 'active' : true},
        {
            'page': pageNum ,
            limit ,
            sort: {'createdAt' : -1},
            select : ['title','slug','images','likeCount','commentCount']
        });

        let data = {
            'page' : page,
            posts : (posts?.docs?.length > 0) ? posts.docs : '[]',
            'pageNumber' : posts.page,
            pages : posts.pages,
            total : posts.total,
            limit : posts.limit
        }

        return data;
    }

}

module.exports = new pageController;