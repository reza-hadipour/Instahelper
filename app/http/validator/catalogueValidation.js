let {body,check, param} = require('express-validator');
const Validator = require('./validator');

const {catalogueModel} = require('../../models/pageModel');

class catalogueValidation extends Validator{
    addCatalogue(){
        return[
            body('title')
                .notEmpty()
                    .withMessage('عنوان صفحه را وارد نمایید.')
        ]
    }

    
}

module.exports = new catalogueValidation;