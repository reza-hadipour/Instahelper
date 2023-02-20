const controller = require('../controller');
const createHttpError = require('http-errors');

// Models
const permissionModel = require('../../../models/permissionModel');

class permissionController extends controller {

    async showAllPermissions(req,res,next){
        let permisions = await permissionModel.find();
        res.json({
            ...this.successPrams(),
            'Permissions' : permisions
        });
    }

    async createPermission(req,res,next){
        let {name ,label} = req?.body;
        
        let newPermission = new permissionModel({name,label});
        newPermission.save()
        .then( result =>{
            res.json({
                ...this.successPrams(),
                'new permission' : {
                    id : result._id,
                    name : result.name,
                    label : result.label
                }
            });
        })
        .catch(err => {
            debugDB(err);
            if(err?.code === 11000){
                this.errorResponse(createHttpError.BadRequest('نام مجوز تکراری است.'),res);
            }else{
                this.errorResponse(createHttpError.InternalServerError('خطا در ذخیره سازی'),res);
            }
        });

    }

    async editPermission(req,res,next){
        let permissionId = req?.params?.id;
        permissionModel.findByIdAndUpdate(permissionId,req.body,{new : true})
        .then( result =>{
            res.json({
                ...this.successPrams(),
                'permission': {
                    id : result._id,
                    name : result.name,
                    label : result.label
                }
            });
        })
        .catch(err => {
            debugDB(err);
            if(err?.code === 11000){
                this.errorResponse(createHttpError.BadRequest('نام مجوز تکراری است.'),res);
            }else{
                this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش مجوز'),res);
            }
        });
    }

    async removePermission(req,res,next){
        let permissionId = req?.params?.id;
        let deleteResult = await permissionModel.findByIdAndRemove(permissionId,{new : true})
        .catch(err => {
            debugDB(err);
            this.errorResponse(createHttpError.InternalServerError('خطا در حذف مجوز'),res);
        });

        // console.log(deleteResult);
        if (deleteResult){
            res.json({
                ...this.successPrams(),
                'deleted permission' : {
                    'id' : deleteResult._id,
                    'name' : deleteResult.name,
                    'label' : deleteResult.label
                }});
        }else{
            this.errorResponse(createHttpError.NotFound('مجوزی با این شناسه یافت نشد.'),res);
        }
    }
}

module.exports = new permissionController;