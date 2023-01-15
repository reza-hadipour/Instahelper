const router = require('express').Router();

// Models
const permissionsModel = require('../../../models/permissionModel');

// Middlewares
const { validation } = require('../../../http/middleware/adminValidation/validation');

// Controllers
const {showAllPermissions, createPermission, editPermission, removePermission} = require('../../../http/controller/superadmin/permissionController');

// Validators
const {addPermission, editPermission : editPermissionValidator, removePermission: removePermissionValidator} = require('../../../http/validator/su/permissions');


// Routes
router.get('/permissions',showAllPermissions);
router.post('/createPermission',addPermission(), validation ,createPermission);
router.put('/editPermission/:id', editPermissionValidator(), validation ,editPermission);
router.delete('/removePermission/:id', removePermissionValidator(), validation, removePermission);
module.exports = router;