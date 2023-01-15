const controller = require('../controller');
const createHttpError = require('http-errors');

// Models
const roleModel = require('../../../models/roleModel');

class rollController extends controller {

    async showAllRoles(req,res,next){
        let roles = await roleModel.find().populate('permissions','name label').exec();
        res.json({
            ...this.successPrams(),
            'Rolls' : roles
        });
    } 

    async showRoleDetails(req,res,next){
        let roleId = req?.params?.id;
        let role = await roleModel.findById(roleId).populate('permissions', 'name label').exec();
        if(role){
            return res.json({
                ...this.successPrams(),
                'Role' : role
            });
        }else{
            return this.errorResponse(createHttpError.NotFound('نقش مورد نظر یافت نشد.'),res);
        }
    }

    async createRole(req,res,next){
        let {name ,label, permissions} = req?.body;
        let multiPermissions = [];

        // Check permissionIds in validator
        if( typeof permissions === 'string'){
            multiPermissions.push(...permissions.split(','));
        }else{
            multiPermissions = permissions;
        }
        
        let newRole = new roleModel({name,label,'permissions' : multiPermissions});
        newRole.save()
        .then( result =>{
            res.json({
                ...this.successPrams(),
                'Role' : result
            });
        })
        .catch(err => {
            debugDB(err);
            if(err?.code === 11000){
                this.errorResponse(createHttpError.BadRequest('نام نقش تکراری است.'),res);
            }else{
                this.errorResponse(createHttpError.InternalServerError('خطا در ذخیره سازی'),res);
            }
        });

    }

    async editRole(req,res,next){
        let roleId = req?.params?.id;
        // VALIDATION check permissionIds
        roleModel.findByIdAndUpdate(roleId,req.body,{new : true})
        .populate('permissions')
        .exec((err,result)=>{
            if(err){
                debugDB(err);
                if(err?.code === 11000){
                    this.errorResponse(createHttpError.BadRequest('نام نقش تکراری است.'),res);
                }else{
                    this.errorResponse(createHttpError.InternalServerError('خطا در ویرایش نقش'),res);
                }
            }

            res.json({
                ...this.successPrams(),
                'Role': result
            })
        });
    }

    async removeRole(req,res,next){
        let roleId = req?.params?.id;
        let deleteResult = await roleModel.findByIdAndRemove(roleId,{new : true})
        .catch(err => {
            debugDB(err);
            this.errorResponse(createHttpError.InternalServerError('خطا در حذف نقش'),res);
        });

        // console.log(deleteResult);
        if (deleteResult){
            res.json({
                ...this.successPrams(),
                deleteResult
            });
        }else{
            this.errorResponse(createHttpError.NotFound('نقشی با این شناسه یافت نشد.'),res);
        }
    }
}

module.exports = new rollController;