let router = require('express').Router();
const multer = require('multer');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');
const postController = require('../../../http/controller/admin/postController');

// Midllewares
const {uploadPage, uploadPost} = require('../../../http/middleware/uploadImage');
const { validation } = require('../../../http/middleware/adminValidation/validation');

// Validation
const {addPage, editPage, showPosts} = require('../../../http/validator/pageValidation');
const {addPost, editPost, removePost, addPostImage, removePostImage, removePostLink} = require('../../../http/validator/postValidation');


router.get('/', (req, res, next) => {
    res.json('Private Routes');
});


// Page routes
router.get('/showPosts/:page',showPosts(), validation, pageController.showPosts);
router.post('/addpage', uploadPage.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage/:id', uploadPage.single('pageimage'), editPage(), pageController.editPage)
router.delete('/removePage/:id', pageController.removePage)
router.delete('/removePageImage/:id', pageController.removePageImage)

// Post Routes
router.post('/addPost/:page', uploadPost.array('postimage'), addPost(), postController.addPost);
router.put('/editPost/:id', editPost(), validation, postController.editPost);
router.delete('/removePost/:id', removePost(), validation, postController.removePost);
router.post('/addPostImage/:id', uploadPost.array('postimage'), addPostImage(), validation, postController.addPostImage);
router.delete('/removePostImages/:id', removePost(), validation, postController.removeAllPostImages);
router.delete('/removePostImage/:id', removePostImage(), validation, postController.removeOnePostImage);
router.delete('/removePostLink/:id', removePostLink(), validation, postController.removePostLink);

module.exports = router;
