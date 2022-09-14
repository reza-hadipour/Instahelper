let router = require('express').Router();

router.get('/login',(req,res,next)=>{
    res.json('LOGIN');
})

module.exports = router;