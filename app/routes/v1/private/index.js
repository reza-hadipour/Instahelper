let router = require('express').Router();

router.get('/',(req,res,next)=>{
    res.json('Private Routes');
})

module.exports = router;