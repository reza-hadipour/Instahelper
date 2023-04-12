const router = require('express').Router();

// Models
const permissionsModel = require('../../../models/permissionModel');

// Middlewares
const { validation } = require('../../../http/middleware/adminValidation/validation');
const gate = require('../../../../helpers/gate');

// Controllers
const {showAllPermissions, createPermission, editPermission, removePermission} = require('../../../http/controller/superadmin/permissionController');
const {showAllRoles, showRoleDetails, createRole, editRole, removeRole} = require('../../../http/controller/superadmin/roleController');
const {allocateRoleToUser, updateUserRole, showUserRoles} = require('../../../http/controller/superadmin/roleAllocationController');

// Validators
const {addPermission, editPermission : editPermissionValidator, removePermission: removePermissionValidator} = require('../../../http/validator/su/permissions');
const {addRole, editRole : editRoleValidator, removeRole :  removeRoleValidator} = require('../../../http/validator/su/roles');
const {allocationRole : allocationRoleValidator, getUserRoles : getUserRolesValidator, updateUserRole :  updateUuserRoleValidator} = require('../../../http/validator/su/roleAllocation');

// Routes
router.get('/permissions', gate.can(CONSTS.PERM_SA_VIEW_PERMISSIONS) ,showAllPermissions);
router.post('/createPermission', gate.can(CONSTS.PERM_SA_MANAGE_PERMISSIONS) ,addPermission(), validation ,createPermission);
router.put('/editPermission/:id', gate.can(CONSTS.PERM_SA_MANAGE_PERMISSIONS) , editPermissionValidator(), validation ,editPermission);
router.delete('/removePermission/:id', gate.can(CONSTS.PERM_SA_MANAGE_PERMISSIONS) , removePermissionValidator(), validation, removePermission);

router.get('/roles', gate.can(CONSTS.PERM_SA_VIEW_ROLES) ,showAllRoles);
router.get('/roles/:id', gate.can(CONSTS.PERM_SA_VIEW_ROLES) ,showRoleDetails);
router.post('/createRole', gate.can(CONSTS.PERM_SA_MANAGE_ROLES) ,addRole(), validation, createRole);
router.put('/editRole/:id', gate.can(CONSTS.PERM_SA_MANAGE_ROLES) ,editRoleValidator(), validation, editRole);
router.delete('/removeRole/:id', gate.can(CONSTS.PERM_SA_MANAGE_ROLES) ,removeRoleValidator(), validation, removeRole);

router.get('/userRoles/:id' ,gate.can(CONSTS.PERM_SA_VIEW_USER_ROLE) ,getUserRolesValidator(), validation,showUserRoles);
router.put('/allocateRole/' ,gate.can(CONSTS.PERM_SA_MANAGE_USER_ROLE) , allocationRoleValidator(), validation, allocateRoleToUser);
router.put('/updateUserRole/:id' ,gate.can(CONSTS.PERM_SA_MANAGE_USER_ROLE) ,updateUuserRoleValidator(), validation, updateUserRole);

module.exports = router;