const controller = require('../controller');

// Models
const roleModel = require('../../../models/roleModel');
const userModel = require('../../../models/userModel');
const permissionModel = require('../../../models/permissionModel');
const createHttpError = require('http-errors');

class roleAllocationController extends controller{

    async allocateRoleToUser(req,res,next){
        let usersBody = req?.body?.users;
        let roleBody = req?.body?.roles;

        let usersId = [];
        let rolesId = [];

        let roleNames = [];

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
                roleNames.push(role.name.toUpperCase());
            })
        }

        let users = await userModel.find({'_id' : {$in : usersId}});
        let countOfAllocatedRole = users.length;

        usersId.forEach(async (userId) => {
            let user = await userModel.findById(userId);
            if(user){
                let userRoles = new Set([...user.roles,...roleNames]);
                user.roles = [...userRoles];
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

    async deallocateRole(req,res,next){
        res.json(`Deallocating Role from User.`);
    }
    
}



module.exports = new roleAllocationController;

