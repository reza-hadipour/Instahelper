let router = require('express').Router();

// Admin Controllers

// Public Controllers
const pageController = require('../../../http/controller/public/pageController');
const postController = require('../../../http/controller/public/postController');

// Midllewares
const { validation } = require('../../../http/middleware/adminValidation/validation');
const authenticateApi = require('../../../http/middleware/authenticateApi');

// Validators
const {singlePage} = require('../../../http/validator/public/pages');



// router.get('/',(req,res,next)=>{
//     res.json({
//         "API Verison" : "1.0.0"
//     });
// })

// Show All Page

// Show Latest Post of any Page

// Show Following Pages
router.get('/',authenticateApi.handle , pageController.exploreSubscribedPages);

// Show Single Page Information and its posts
router.get('/:username',authenticateApi.handleNoResponse, singlePage() ,validation , pageController.showSinglePage);

// Show single Post
router.get('/:page/:post',authenticateApi.handleNoResponse, postController.showSinglePost)    // Page status checking
router.get('/:page/:post/comments',authenticateApi.handleNoResponse, postController.showSinglePostComments)
router.get('/:page/:post/likes',authenticateApi.handleNoResponse, postController.showSinglePostLikes)

// Follow and Unfollow Single Page
router.post('/follow/:username',authenticateApi.handle, singlePage() ,validation , pageController.followPage);
router.post('/unfollow/:username',authenticateApi.handle, singlePage() ,validation , pageController.unfollowPage );


// Comment
router.post('/addComment/:post',authenticateApi.handle ,postController.addComment);
router.post('/addComment/:post/:comment',authenticateApi.handle ,postController.addSubComment)

// /:username/addComment
// /:username/:slug/addComment
// /addSubcomment/:comment


module.exports = router;