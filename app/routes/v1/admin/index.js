let router = require('express').Router();
const multer = require('multer');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');
const postController = require('../../../http/controller/admin/postController');

// Midllewares
const authenticateApi = require('../../../http/middleware/authenticateApi');
const {uploadPage, uploadPost} = require('../../../http/middleware/uploadImage');

// Validation
const {addPage,editPage} = require('../../../http/validator/pageValidation');
const {addPost, editPost, removePost, addPostImage} = require('../../../http/validator/postValidation');


router.get('/',(req,res,next)=>{
    res.json('Private Routes');
});


// Page routes
router.post('/addPage', uploadPage.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage/:id',uploadPage.single('pageimage'), editPage(), pageController.editPage)
router.delete('/removePage/:id', pageController.removePage)
router.delete('/removePageImage/:id', pageController.removePageImage)

// Post Routes
router.post('/addPost/:page', uploadPost.array('postimage'), addPost(), postController.addPost);
router.put('/editPost/:page/:id', editPost(), postController.editPost);
router.delete('/removePost/:page/:id', removePost(), postController.removePost);
router.post('/addPostImage/:page/:id',uploadPost.array('postimage'), addPostImage(), postController.addPostImage);

module.exports = router;