let router = require('express').Router();
const multer = require('multer');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');
const postController = require('../../../http/controller/admin/postController');

// Midllewares
const {uploadPage, uploadPost} = require('../../../http/middleware/uploadImage');

// Validation
const {addPage, editPage} = require('../../../http/validator/pageValidation');
const {addPost, editPost, removePost, addPostImage, removePostImage, showPosts, removePostLink} = require('../../../http/validator/postValidation');


router.get('/', (req, res, next) => {
    res.json('Private Routes');
});


// Page routes
router.post('/addpage', uploadPage.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage/:id', uploadPage.single('pageimage'), editPage(), pageController.editPage)
router.delete('/removePage/:id', pageController.removePage)
router.delete('/removePageImage/:id', pageController.removePageImage)

// Post Routes
router.get('/posts/:page',showPosts(), postController.showPosts);
router.post('/addPost/:page', uploadPost.array('postimage'), addPost(), postController.addPost);
router.put('/editPost/:id', editPost(), postController.editPost);
router.delete('/removePost/:id', removePost(), postController.removePost);
router.post('/addPostImage/:id', uploadPost.array('postimage'), addPostImage(), postController.addPostImage);
router.delete('/removePostImages/:id', removePost(), postController.removeAllPostImages);
router.delete('/removePostImage/:id', removePostImage(), postController.removeOnePostImage);
router.delete('/removePostLink/:id', removePostLink(), postController.removePostLink);

module.exports = router;
