let ConnectRoles = require('connect-roles');
const createHttpError = require('http-errors');
const permissionModel = require('../app/models/permissionModel');
 
let gate = new ConnectRoles({
  failureHandler: function (req, res, action) {
    // let accept = req.headers.accept || '';
    // if (~accept.indexOf('html')) {
    //   res.render('access-denied', {action: action});
    // } else {
    //   res.status(403).json(createHttpError[403]('Access Denied - You don\'t have permission to: ' + action));
    //   let err = createHttpError[403]('Access Denied - You don\'t have permission to: ' + action);
    //   console.log(err?.message , err?.statusCode ,  err?.status);
    // }
    
    res.status(403).json({
        status : 'failed',
        statusCode: 403,
        Error: {
            message: 'Access Denied - You don\'t have permission to: ' + action
        }
    });

  }
});

const permissions = async ()=>{
    return await permissionModel.find().populate('roles').exec();
}

permissions().then(permissions=>{
    // console.log(permissions.roles);
    permissions.forEach(permission => {
        let roles = permission.roles.map(item => item.id); //.toUpperCase());

        gate.use(permission.name , (req) => {
            return req.user.hasRole(roles);
        });

    });
})

// gate.use('show-admin-routes',(req)=>{
//     return false;
// });


module.exports = gate;