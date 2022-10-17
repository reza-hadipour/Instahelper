let router = require('express').Router();
const multer = require('multer');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');
const postController = require('../../../http/controller/admin/postController');
const commentController = require('../../../http/controller/admin/commentController');

// Midllewares
const {uploadPage, uploadPost} = require('../../../http/middleware/uploadImage');
const { validation } = require('../../../http/middleware/adminValidation/validation');

// Validation
const {addPage, editPage, showPosts, removePageImage} = require('../../../http/validator/pageValidation');
const {addPost, editPost, removePost, addPostImage, removePostImage, removePostLink, removeAllPostLink} = require('../../../http/validator/postValidation');
const {showUnapprovedComments, approveAllComment , approveComment} = require('../../../http/validator/commentValidation');


router.get('/', (req, res, next) => {
    res.json('Private Routes');
});


// Page routes
router.get('/showPosts/:page',showPosts(), validation, pageController.showPosts);
router.post('/addpage', uploadPage.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage/:page', uploadPage.single('pageimage'), editPage(), pageController.editPage)
router.delete('/removePage/:page', pageController.removePage)   // Unfinished
router.delete('/removePageImage/:page', removePageImage(), validation, pageController.removePageImage)

// Post Routes
router.post('/addPost/:page', uploadPost.array('postimage'), addPost(), postController.addPost);
router.put('/editPost/:post', editPost(), validation, postController.editPost);
router.delete('/removePost/:post', removePost(), validation, postController.removePost);    // Unfinished
router.post('/addPostImage/:post', uploadPost.array('postimage'), addPostImage(), postController.addPostImage);
router.delete('/removePostImages/:post', removePost(), validation, postController.removeAllPostImages);
router.delete('/removePostImage/:post', removePostImage(), validation, postController.removeOnePostImage);
router.delete('/removePostLink/:post', removePostLink(), validation, postController.removePostLink);
router.delete('/removePostLinks/:post', removeAllPostLink(), validation, postController.removeAllPostLink);


// Comment Routes
router.get('/unapprovedComments/',showUnapprovedComments(), validation,commentController.showUnapprovedComments)
router.patch('/approveComment/:comment',approveComment(), validation, commentController.approveComment)
router.patch('/approveAllComments',approveAllComment(), validation, commentController.approveAllComments)

module.exports = router;
