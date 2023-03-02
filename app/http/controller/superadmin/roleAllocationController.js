const controller = require('../controller');

// Models
const roleModel = require('../../../models/roleModel');
const userModel = require('../../../models/userModel');
const createHttpError = require('http-errors');

class roleAllocationController extends controller{

    async allocateRoleToUser(req,res,next){
        let usersBody = req?.body?.users;
        let roleBody = req?.body?.roles;

        let usersId = [];
        let rolesId = [];

        // let roleNames = [];
        let roleIds = [];

        if(typeof usersBody == 'string'){
            usersId.push(...usersBody.split(','));
        }else{
            usersId = usersBody;
        }
        
        if(typeof roleBody == 'string'){
            rolesId.push(...roleBody.split(','));
        }else{
            rolesId = roleBody;
        }
        
        let roles = await roleModel.find({'_id' : {$in: rolesId}})
        if(roles){
            roles.forEach(role => {
                // roleNames.push(role.name.toUpperCase());
                roleIds.push(role.id);
            })
        }

        let users = await userModel.find({'_id' : {$in : usersId}});
        let countOfAllocatedRole = users.length;

        usersId.forEach(async (userId) => {
            let user = await userModel.findById(userId);
            if(user){
                let tempUserRoles = [];
                user?.roles.forEach(userRoleId => {
                    tempUserRoles.push(userRoleId.toString())
                })
                let userNewRoles = new Set([...tempUserRoles,...roleIds]);
                user.roles = [...userNewRoles];
                await user.save()
            }
        });

        if(countOfAllocatedRole > 0){
            return res.json({
                ...this.successPrams(),
                message: `نقش ${countOfAllocatedRole} کاربر به روز رسانی شد.`
            })
        }else{
            return this.errorResponse(createHttpError.BadRequest('اعمال نقش انجام نشد.'),res);
        }

    }

    async showUserRoles(req,res,next){
        let userId = req?.params?.id;
        let user = await userModel.findById(userId,'name family email roles')
        .populate({
            path: 'roles',
            select: 'name label'
        })
        .exec();

        if(user){
            return res.json({
                ...this.successPrams(),
                user : {
                    name : user.name,
                    family: user.family,
                    email : user.email,
                    roles : user.roles.map(role =>  {
                        return{
                            id : role.id,
                            name : role.name,
                            label : role.label
                        }
                    })
                }
            })
        }else{
            return this.errorResponse(createHttpError[404]('کاربر مورد نظر پیدا نشد.'),res)
        }
    }

    async updateUserRole(req,res,next){

        let userId = req?.params?.id;
        let userRolesBody = req?.body?.role;

        let userRole = [];
        let roleIds = new Set();

        if( typeof userRolesBody == 'string'){
            userRole.push(...userRolesBody.split(','));
        }else{
            userRole = userRolesBody;
        }

        let user = await userModel.findById(userId).populate('roles').exec();
        if(user){
            let isSuperAdmin = user?.roles?.filter(role => {
                return role.name == CONSTS.SUPERADMIN_ROLE_NAME; //role.id.toString();
            })

            // console.log('isSuperAdmin: ' , isSuperAdmin);

            let roles = await roleModel.find({'_id' : {$in : userRole}});

            if(userRole && roles){
                roles.map(role => {
                    roleIds.add(role.id);
                })
            }

            if(req.user.id == user.id){ 
                // console.log('userRole: ',!!userRole);

                if(!userRole){  // Empty role list
                    roleIds.add(isSuperAdmin[0]._id.toString());
                    // return res.json('You can`t clear all your roles.')
                }else if(!!isSuperAdmin.length){
                    // check userRoleInput for superAdmin
                    // Filter 'SuperAdmin' from input role list
                    if(roles){
                        roleIds.add(isSuperAdmin[0]._id.toString());
                    }else{
                        return this.errorResponse(createHttpError.BadRequest('نقشی پیدا نشد.'),res);
                    }
                }
            }else{ // For Other User
                if(!userRole){  // Empty role list
                    //add USER role for user
                    let roleUser = await roleModel.findOne({'name' : 'USER'});
                    if(roleUser){
                        roleIds.add(roleUser.id);
                    }else{
                        return res.json('You can`t clear all user`s roles.')
                    }
                }else if(!roles.length){
                    return this.errorResponse(createHttpError.BadRequest('نقشی پیدا نشد.'),res);
                }
            }

            // Update user role
            user.roles = [...roleIds];
            await user.save();
            return res.json({
                ...this.successPrams(),
                message : 'User role updated successfully.',
                user
            });
            
        }else{
            return this.errorResponse(createHttpError[404]('کاربر مورد نظر پیدا نشد.'),res);
        }

        // res.json(`Update User\` Role.`);
    }
    
}



module.exports = new roleAllocationController;

