// PageController in Public routes
//
// //////////////////////////////// //


const Controller = require('../controller');

// Models
const pageModel = require('../../../models/pageModel');
const createHttpError = require('http-errors');

class pageController extends Controller{
    
    async showSinglePage(req,res,next){
        let username = req?.params?.username ||  undefined;
        let userId = req?.user?.id || undefined;
        
        let page;
       
        // page = await pageModel.find({username, 'active' : true, 'followers': {$in : userId} })
        page = await pageModel.findOne({username, 'active' : true },'-owner -active -createdAt -updatedAt -__v')
        .populate({
            path : 'posts',
            match : {'active' : true},
            select : '-links -likes -updatedAt',
            options  : {
                sort : {'createdAt' : -1}
            }
        }).exec();


        if(page){
            if(page.status == 'public'){
                return res.json(page);
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
                    // User follows the page
                    page.followers = [userId]; // Dont show all followers
                    return res.json(page);
                }

            }
        }else{
            return res.status(404).json(`${username} Not Found`);
        }

    }

    async followPage(req,res,next){
        let username = req?.params?.username;
        let userId = req?.user?.id;

        //Check whether page is exists
        let page = await pageModel.findOne({username, 'active' : true },'-owner -active -createdAt -updatedAt -__v')
        .populate({
            path : 'posts',
            match : {'active' : true},
            select : '-links -likes -updatedAt',
            options  : {
                sort : {'createdAt' : -1}
            }
        }).exec();

        if(page){
            if(!page?.followers?.includes(userId)){
                // let pageFollowers = page.followers;
                // pageFollowers.push(userId);
                // page.followers = pageFollowers;
                // Array(page.followers).push(userId);
                page.followers.push(userId);
                await page.inc();
                // await page.save();
                return res.json({
                    ...this.successPrams(),
                    message : `You follow ${page.title} Succesfully`
                });
            }

            return res.json({
                ...this.successPrams(),
                message : `You have followed ${username} already.`
            });

        }else{
            return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر یافت نشد.'),res);
        }

    }

    async unfollowPage(req,res,next){
        let username = req?.params?.username;
        let userId = req?.user?.id;

        //Check whether page is exists
        let page = await pageModel.findOne({username, 'active' : true },'-owner -active -createdAt -updatedAt -__v')
        .populate({
            path : 'posts',
            match : {'active' : true},
            select : '-links -likes -updatedAt',
            options  : {
                sort : {'createdAt' : -1}
            }
        }).exec();

        if(page){
            let userIdx = page.followers.indexOf(userId);
            if(userIdx > -1){
                page.followers.splice(userIdx,1);
                await page.inc(-1);
                // await page.save();
                return res.json({
                    ...this.successPrams(),
                    message : `You unfollow ${page.title} Succesfully`
                });
            }

            return res.json({
                ...this.successPrams(),
                message : `You have not followed ${username}.`
            });

        }else{
            return this.errorResponse(createHttpError.NotFound('صفحه مورد نظر یافت نشد.'),res);
        }

    }

}

module.exports = new pageController;