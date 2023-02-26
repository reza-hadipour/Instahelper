const router = require('express').Router();

// Models
const permissionsModel = require('../../../models/permissionModel');

// Middlewares
const { validation } = require('../../../http/middleware/adminValidation/validation');

// Controllers
const {showAllPermissions, createPermission, editPermission, removePermission} = require('../../../http/controller/superadmin/permissionController');
const {showAllRoles, showRoleDetails, createRole, editRole, removeRole} = require('../../../http/controller/superadmin/roleController');
const {allocateRoleToUser, deallocateRole} = require('../../../http/controller/superadmin/roleAllocationController');

// Validators
const {addPermission, editPermission : editPermissionValidator, removePermission: removePermissionValidator} = require('../../../http/validator/su/permissions');
const {addRole, editRole : editRoleValidator, removeRole :  removeRoleValidator} = require('../../../http/validator/su/roles');
const {allocationRole : allocationRoleValidator} = require('../../../http/validator/su/roleAllocation');

// Routes
router.get('/permissions',showAllPermissions);
router.post('/createPermission',addPermission(), validation ,createPermission);
router.put('/editPermission/:id', editPermissionValidator(), validation ,editPermission);
router.delete('/removePermission/:id', removePermissionValidator(), validation, removePermission);

router.get('/roles', showAllRoles);
router.get('/roles/:id', showRoleDetails);
router.post('/createRole', addRole(), validation, createRole);
router.put('/editRole/:id', editRoleValidator(), validation, editRole);
router.delete('/removeRole/:id',removeRoleValidator(), validation, removeRole);

router.put('/allocateRole/', allocationRoleValidator(), validation, allocateRoleToUser);
router.put('/deallocateRole/',deallocateRole);

module.exports = router;