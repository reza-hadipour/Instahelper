let router = require('express').Router();

// Controllers
const catalogueController = require('../../../http/controller/admin/catalogueController');

// Midllewares
const authenticateApi = require('../../../http/middleware/authenticateApi');

// Validation
const {addCatalogue} = require('../../../http/validator/catalogueValidation');

router.get('/',(req,res,next)=>{
    res.json('Private Routes');
})

router.post('/addCatalogue',authenticateApi.handle(),addCatalogue(),)

module.exports = router;