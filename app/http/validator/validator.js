const autoBind = require('auto-bind');
const isMongoID = require('validator/lib/isMongoId');

//Helpers
const {slug} = require('../../../helpers');

class Validator{
    constructor(){
        autoBind(this);
        this.slug = slug;
    }

    hasSpecialSymbol(value){
        return value.split('').some(this.checkSpecialSymbol);
    }

    checkSpecialSymbol(element){
        let specialSymbols = [
            ' ', '!', '#', '$', '%', '&',
            "'", '(', ')', '*', '+', ',',
            '-', '/', ':', ';', '<',
            '=', '>', '?', '@', '[', '\\',
            ']', '^', '`', '{', '|',
            '}', '~', '"'
          ]
        return specialSymbols.includes(element);
    }

    checkPasswordConditions(password){
        let   upper = /[A-Z]/,
        lower = /[a-z]/,
        number = /[0-9]/,
        special = /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
        
        return (upper.test(password) && 
                lower.test(password) && 
                number.test(password) && 
                special.test(password)
            );  
    }



    isMongoId(mongoId){
        return isMongoID(mongoId);
    }
}

module.exports = Validator;