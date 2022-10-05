let router = require('express').Router();
const multer = require('multer');
// const upload = multer().single('pageimage');

// Controllers
const pageController = require('../../../http/controller/admin/pageController');

// Midllewares
const authenticateApi = require('../../../http/middleware/authenticateApi');
const upload = require('../../../http/middleware/uploadImage');

// Validation
const {addPage,editPage} = require('../../../http/validator/pageValidation');


router.get('/',(req,res,next)=>{
    res.json('Private Routes');
});


// Page routes
router.post('/addPage', upload.single('pageimage'), addPage(), pageController.addPage);
router.put('/editPage/:id',upload.single('pageimage'), editPage(), pageController.editPage)
router.delete('/removePage/:id', pageController.removePage)
router.delete('/removePageImage/:id', pageController.removePageImage)

module.exports = router;