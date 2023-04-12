const controller = require('../controller');
const createHttpError = require('http-errors');

// Models
const roleModel = require('../../../models/roleModel');

class rollController extends controller {

    async showAllRoles(req,res,next){
        let roles = await roleModel.find({},'name label').populate('permissions','name label').exec();
        res.json({
            ...this.successPrams(),
            roles
        });
    } 

    async showRoleDetails(req,res,next){
        let roleId = req?.params?.id;
        let role = await roleModel.findById(roleId,'name label').populate('permissions', 'name label').exec();
        if(role){
            return res.json({
                ...this.successPrams(),
                role
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
                'new role' : {
                    name: result.name,
                    label: result.label,
                    permissions: result.permissions
                }
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
        let bodyPerms = req?.body?.permissions;
        if(bodyPerms){
            let multiPermissions = [];
    
            if( typeof bodyPerms === 'string'){
                multiPermissions.push(...bodyPerms.split(','));
            }else{
                multiPermissions = bodyPerms;
            }
            
            req.body.permissions = multiPermissions;
        }

        roleModel.findByIdAndUpdate(roleId,req.body,{new : true})
        .populate('permissions','name label')
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
                'role': {
                    id: result.id,
                    name: result.name,
                    label: result.label,
                    permissions : result.permissions
                }
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
                'deleted role' : {
                    id : deleteResult._id,
                    name : deleteResult.name,
                    label: deleteResult.label
                }
            });
        }else{
            this.errorResponse(createHttpError.NotFound('نقشی با این شناسه یافت نشد.'),res);
        }
    }
}

module.exports = new rollController;