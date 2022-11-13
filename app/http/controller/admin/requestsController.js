const createHttpError = require('http-errors');
const { default: isMongoId } = require('validator/lib/ismongoid');
const Controller = require('../controller');

// Models
const requestsModel = require('../../../models/requestsModel');
const pageModel = require('../../../models/pageModel');
const { RedisSearchLanguages } = require('@redis/search/dist/commands');

class requestsController extends Controller{
    async acceptRequest(req,res,next){
        // accept requests in Request Collection acording pageId, one or many reqId or all reqs of user;
        let pageId = req?.query?.page || undefined
        let reqIds = req?.body?.requests || undefined
        let owner = req.user.id;
        let pageIds = [];
        let multireqIds = [];

        if(pageId){
            // check page ownership
            let checkOwnerShipOfPageError = undefined;
            await this.checkOwnershipOfPage(req).catch(err => {
                checkOwnerShipOfPageError = err;
            })
            if(checkOwnerShipOfPageError) return this.errorResponse(checkOwnerShipOfPageError,res);

            let page = await pageModel.findById(pageId);
                if(page){
                    pageIds.push(page.id);
                }
        }else if(reqIds){
            // Approve a group of requests
            if (typeof reqIds == 'string'){
                multireqIds.push(...reqIds.split(','));   // for multiple ids
            }else{
                multireqIds = reqIds;   // for single id
            }

            // console.log(multireqIds);
            // if(!multireqIds.every(isMongoId)) {
            //     return this.errorResponse(createHttpError.BadRequest('شناسه درخواست های ارسالی صحیح نمی باشد.'),res);
            // }
        }else{
            // All requests of user

            // Dont let approve all requests
            // return this.errorResponse(createHttpError.BadRequest('درخواست های مورد نظر خود را وارد کنید.'),res);

            let pages = await pageModel.find({owner});
            pages.forEach(page => {
                pageIds.push(page.id);
            });
        }

        let requests;

        // for muliple requests
        if(multireqIds?.length > 0){
            // Finding by request Id
            requests = await requestsModel.find({'_id' : {$in : multireqIds}})
            .populate({
                path: 'page',
                select : ['owner','username']
            }).exec();
        }else{
            // Finding by page
            requests = await requestsModel.find({'page' : {$in : pageIds}})
            .populate({
                path: 'page',
                select : ['owner','username']
            }).exec();
        }
       
        if(requests?.length > 0){
            let countOfAccepted = 0;
            let pagesChanged = {};
            let pageNewFollowers = {};
            requests.forEach(async (request) => {
                if(request?.page?.owner == owner){    // Check request ownership
                    countOfAccepted += 1
                    if( typeof pagesChanged[request.page._id] != 'number' ) {
                        pagesChanged[request.page._id] = 1;
                    }else{
                        pagesChanged[request.page._id] += 1;
                    }

                    if( typeof pageNewFollowers[request.page._id]?.list != 'object' ) {
                        pageNewFollowers[request.page._id] = {'username' : request.page.username , 'list' : Array(String(request.requester))};
                    }else{
                        (pageNewFollowers[request.page._id]?.list).push(String(request.requester));
                    }
                    
                    // console.log('Remove Request');
                    request.remove();
                }
            });

            let resultData = [];
            for (const key in pagesChanged) {
                let updatePage = await pageModel.findById(key);
                    if(updatePage){
                        // let pageFollowers = updatePage.followers;
                        // let pageNewFollowerIds = pageNewFollowers[key].list;
                        
                        // pageFollowers.push(...pageNewFollowerIds);
                        
                        // updatePage.followersNum += pagesChanged[key]; //updatePage.followersNum + pagesChanged[key];
                        updatePage.followers.push(...pageNewFollowers[key].list); //pageFollowers;
                        await updatePage.inc(pagesChanged[key]);

                        // Add new followers into redis InstaHelper:Followers:username
                        let followers = [];
                        updatePage.followers.forEach(user => {
                            followers.push(String(user));
                        });

                        await global.myRedisClient.sAdd(`InstaHelper:Followers:${updatePage.username}`, followers);
                        // global.myRedisClient.sAdd(`InstaHelper:Followers:${updatePage.username}`,pageNewFollowers[key].list);
                        
                        resultData.push({
                            username : pageNewFollowers[key].username,
                            followers : pageNewFollowers[key].list,
                            total: pagesChanged[key]
                        });
                        // updatePage.save();
                    }
            }
            
            return res.json({
                ...this.successPrams(),
                message: (countOfAccepted>0 )? `${countOfAccepted} درخواست تایید شد.` : 'هیچ درخواستی تایید نشد.',
                "result" : resultData
            });
            

        }else{
            return this.errorResponse(createHttpError.NotFound('درخواستی یافت نشد.'),res);
        }
  
    }

    async rejectRequest(req,res,next){
        // accept requests in Request Collection acording pageId, one or many reqId or all reqs of user;
        let pageId = req?.query?.page || undefined
        let reqIds = req?.body?.requests || undefined
        let owner = req.user.id;
        let pageIds = [];
        let multireqIds = [];

        if(pageId){
            // check page ownership
            let checkOwnerShipOfPageError = undefined;
            await this.checkOwnershipOfPage(req).catch(err => {
                checkOwnerShipOfPageError = err;
            })
            if(checkOwnerShipOfPageError) return this.errorResponse(checkOwnerShipOfPageError,res);

            let page = await pageModel.findById(pageId);
                if(page){
                    pageIds.push(page.id);
                }
        }else if(reqIds){
            // Approve a group of requests
            if (typeof reqIds == 'string'){
                multireqIds.push(...reqIds.split(','));   // for multiple ids
            }else{
                multireqIds = reqIds;   // for single id
            }

            // console.log(multireqIds);
            // if(!multireqIds.every(isMongoId)) {
            //     return this.errorResponse(createHttpError.BadRequest('شناسه درخواست های ارسالی صحیح نمی باشد.'),res);
            // }
        }else{
            // All requests of user

            // Dont let approve all requests
            // return this.errorResponse(createHttpError.BadRequest('درخواست های مورد نظر خود را وارد کنید.'),res);

            let pages = await pageModel.find({owner});
            pages.forEach(page => {
                pageIds.push(page.id);
            });
        }

        let requests;

        // for muliple requests
        if(multireqIds?.length > 0){
            // Finding by request Id
            requests = await requestsModel.find({'_id' : {$in : multireqIds}})
            .populate({
                path: 'page',
                select : ['owner','username']
            }).exec();
        }else{
            // Finding by page
            requests = await requestsModel.find({'page' : {$in : pageIds}})
            .populate({
                path: 'page',
                select : ['owner','username']
            }).exec();
        }
       
        if(requests?.length > 0){
            let countOfRejected = 0;

            requests.forEach(async (request) => {
                if(request?.page?.owner == owner){    // Check request ownership
                    countOfRejected += 1
                    // console.log('Remove Request');
                    request.remove();
                }
            });

            return res.json({
                ...this.successPrams(),
                message: (countOfRejected>0 )? `${countOfRejected} درخواست حذف شد.` : 'هیچ درخواستی حذف نشد.'
            });
            
        }else{
            return this.errorResponse(createHttpError.NotFound('درخواستی یافت نشد.'),res);
        }
  
    }


    async showRequests(req,res,next){
        let pageId = req?.query?.page || undefined;
        let owner = req.user.id;

        let pageIds = [];

        if(pageId){
            // Requests of specific page

            // check page ownership
            let checkOwnerShipOfPageError = undefined;
            await this.checkOwnershipOfPage(req).catch(err => {
                checkOwnerShipOfPageError = err;
            })
            if(checkOwnerShipOfPageError) return this.errorResponse(checkOwnerShipOfPageError,res);

            let page = await pageModel.findById(pageId);
            if(page) pageIds.push(pageId);

        }else{
            // Requests of all page
            let pages = await pageModel.find({owner});
            pages.forEach(page => {
                pageIds.push(page.id);
            });
        }

       
        let requests = await requestsModel.find({'page' : {$in : pageIds}},{},{sort: {'createdAt': -1}})
        .populate([
            {
                path: 'requester',
                select : ['name','family','fullname']
            },{
                path: 'page',
                select : ['title','username'],
            }
        ]);
  
        
        if(requests?.length > 0){
            res.json({
                ...this.successPrams(),
                'totalRequests' : requests.length,
                requests: requests})
        }else{
            res.json({
                ...this.successPrams(),
                'totalRequests' : 0,
                requests: []
            })
        }
    }

}

module.exports = new requestsController;