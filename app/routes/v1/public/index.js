let router = require('express').Router();

// Admin Controllers

// Public Controllers
const pageController = require('../../../http/controller/public/pageController');
const postController = require('../../../http/controller/public/postController');

// Midllewares
const { validation } = require('../../../http/middleware/adminValidation/validation');
const authenticateApi = require('../../../http/middleware/authenticateApi');
const { checkingSubscriptions } = require('../../../http/middleware/checkSubscription');

// Validators
const {addSubComment , addComment} = require('../../../http/validator/private/pages');



// router.get('/',(req,res,next)=>{
//     res.json({
//         "API Verison" : "1.0.0"
//     });
// })

// Show All Page

// Show Latest Post of any Page

// Show ONLY Following Pages
router.get('/',authenticateApi.handle , pageController.exploreSubscribedPages);

// Show Single Page Information and its posts
router.get('/:username',authenticateApi.handleNoResponse, pageController.showSinglePage);

// Show single Post
// [:username > page , :slug > post]
router.get('/:username/:slug',authenticateApi.handleNoResponse, checkingSubscriptions, postController.showSinglePost);
// Show Comments of single Post. Options: Query -> [page,limit,sublimit]
router.get('/:username/:slug/comments',authenticateApi.handle, checkingSubscriptions, postController.showSinglePostComments);
// Show Who Like single Post. Options: Query -> [page,limit]
router.get('/:username/:slug/likes',authenticateApi.handle, checkingSubscriptions, postController.showSinglePostLikes);

// Like and Dislike
router.put('/:username/:slug/like',authenticateApi.handle, checkingSubscriptions ,postController.likeSinglePost);

// Follow/Unfollow Single Page
router.post('/:username/follow',authenticateApi.handle, pageController.followPage);
// before accept this request, it must be stored in another table then admin accept it to add in page's follower list

// Comment
// :post > postId
router.post('/addComment/:post',authenticateApi.handle ,addComment() ,validation ,postController.addComment);
// :comment > commentId
router.post('/addSubComment/:comment',authenticateApi.handle, addSubComment(),validation ,postController.addSubComment)

// /:username/addComment
// /:username/:slug/addComment
// /addSubcomment/:comment


module.exports = router;