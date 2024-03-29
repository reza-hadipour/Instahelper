let router = require('express').Router();
const multer = require('multer');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');
const postController = require('../../../http/controller/admin/postController');
const commentController = require('../../../http/controller/admin/commentController');
const requestsController = require('../../../http/controller/admin/requestsController');
const userController = require('../../../http/controller/admin/userController');

// Midllewares
const {uploadPage, uploadPost} = require('../../../http/middleware/uploadImage');
const { validation } = require('../../../http/middleware/adminValidation/validation');
const gate = require('../../../../helpers/gate');   //RBAC

// Validation
const {addPage, editPage, removePage, showPosts, removePageImage, activationPage} = require('../../../http/validator/pageValidation');
const {addPost, editPost, removePost, addPostImage, removePostImage, removePostLink, removeAllPostLink} = require('../../../http/validator/postValidation');
const {showUnapprovedComments, approveComment , removeComments} = require('../../../http/validator/commentValidation');
const {showRequests, acceptOrRejectRequests} = require('../../../http/validator/private/requests');
const {checkEditProfile} = require('../../../http/validator/userValidation');

router.get('/', gate.is('show-admin-routes') ,(req, res, next) => {
    res.json('Private Routes');
});

// Profile routes
router.get('/profile',userController.showProfile);

// Edit Profile
router.put('/editProfile', checkEditProfile(), validation, userController.editProfile);

// Page routes
router.get('/showPosts/:page',showPosts(), validation, pageController.showPosts);
router.post('/addpage', uploadPage.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage/:page', uploadPage.single('pageimage'), editPage(), pageController.editPage);
router.delete('/removePage/:page',removePage(),validation, pageController.removePage);   // Unfinished
router.patch('/activationPage/:page/:activation',activationPage(),validation, pageController.activationPage);   // Unfinished
router.delete('/removePageImage/:page', removePageImage(), validation, pageController.removePageImage);

// Requests routes
router.get('/requests/show', showRequests(), validation, requestsController.showRequests);
router.post('/requests/accept', acceptOrRejectRequests(), validation, requestsController.acceptRequest);
router.post('/requests/reject', acceptOrRejectRequests(), validation, requestsController.rejectRequest);

// Post Routes
router.post('/addPost/:page', uploadPost.array('postimage'), addPost(), postController.addPost);
router.put('/editPost/:post', editPost(), validation, postController.editPost);
// router.delete('/removePost/:post', removePost(), validation, postController.removePost);    // Unfinished
router.delete('/removePost', removePost(), validation, postController.removePost);    // Unfinished
router.post('/addPostImage/:post', uploadPost.array('postimage'), addPostImage(), postController.addPostImage);
router.delete('/removePostImages/:post', removePost(), validation, postController.removeAllPostImages);
router.delete('/removePostImage/:post', removePostImage(), validation, postController.removeOnePostImage);
router.delete('/removePostLink/:post', removePostLink(), validation, postController.removePostLink);
router.delete('/removePostLinks/:post', removeAllPostLink(), validation, postController.removeAllPostLink);

// Comment Routes
router.get('/showComments/',showUnapprovedComments(), validation, commentController.showComments)
// router.patch('/approveComment/:comment',approveComment(), validation, commentController.approveComment)
router.patch('/approveComments',gate.can(CONSTS.PERM_COMMENTS) ,approveComment(), validation, commentController.approveComments)
// router.delete('/removeComment/:comment', removeComment(), validation, commentController.removeComment)
router.delete('/removeComments',gate.can(CONSTS.PERM_COMMENTS), removeComments(), validation, commentController.removeComments)

module.exports = router;
