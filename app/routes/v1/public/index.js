
// Controllers
const postController = require('../../../http/controller/public/postController');

let router = require('express').Router();

router.get('/',(req,res,next)=>{
    res.json({
        "API Verison" : "1.0.0"
    });
})

// Post
router.post('/addComment/:post',postController.addComment);
router.post('/addComment/:post/:comment',postController.addSubComment)

module.exports = router;