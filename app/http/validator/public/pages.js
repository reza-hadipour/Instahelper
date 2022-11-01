const {param} = require('express-validator');
const Validator = require('../validator');

class pages extends Validator{
    singlePage(){
        return [
            param('username').notEmpty().withMessage('نام صفحه مورد نظر را حتما وارد کنید.')
        ]
    }
}


module.exports = new pages;