
// Admin Controllers
const postController = require('../../../http/controller/public/postController');

// Public Controllers
const pageController = require('../../../http/controller/public/pageController');

// Midllewares
const { validation } = require('../../../http/middleware/adminValidation/validation');
const authenticateApi = require('../../../http/middleware/authenticateApi');

// Validators
const {singlePage} = require('../../../http/validator/public/pages');



let router = require('express').Router();

router.get('/',(req,res,next)=>{
    res.json({
        "API Verison" : "1.0.0"
    });
})

// Show All Page

// Show Latest Post of any Page

// Show Following Pages

// Show Single Page

router.get('/:username',authenticateApi.handleNoResponse, singlePage() ,validation , pageController.showSinglePage);
router.post('/follow/:username',authenticateApi.handle, singlePage() ,validation , pageController.followPage);
router.post('/unfollow/:username',authenticateApi.handle, singlePage() ,validation , pageController.unfollowPage);

// Follow Single Page

// Comment
router.post('/addComment/:post',authenticateApi.handle ,postController.addComment);
router.post('/addComment/:post/:comment',authenticateApi.handle ,postController.addSubComment)

module.exports = router;