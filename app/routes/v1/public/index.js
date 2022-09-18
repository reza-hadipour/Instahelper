let router = require('express').Router();

router.get('/',(req,res,next)=>{
    res.json({
        "API Verison" : "1.0.0"
    });
})

module.exports = router;