let router = require('express').Router();
const multer = require('multer');
// const upload = multer().single('pageimage');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');

// Midllewares
const authenticateApi = require('../../../http/middleware/authenticateApi');
const upload = require('../../../http/middleware/uploadImage');

// Validation
const {addPage} = require('../../../http/validator/pageValidation');


router.get('/',(req,res,next)=>{
    res.json('Private Routes');
});


// Page routes
router.post('/addPage', upload.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage', pageController.editPage)

module.exports = router;