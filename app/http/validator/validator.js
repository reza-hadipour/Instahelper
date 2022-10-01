const autoBind = require('auto-bind');

class Validator{
    constructor(){
        autoBind(this);
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

    slug(title){
        return String(title).replace(/([^a-zA-Z0-9آ-ی0-9]|-)+/g,'-');
    }
}

module.exports = Validator;