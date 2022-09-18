const autoBind = require('auto-bind');

class Validator{
    constructor(){
        autoBind(this);
    }

    hasSpecialSymbol(element){
        let specialSymbols = [
            ' ', '!', '#', '$', '%', '&',
            "'", '(', ')', '*', '+', ',',
            '-', '.', '/', ':', ';', '<',
            '=', '>', '?', '@', '[', '\\',
            ']', '^', '_', '`', '{', '|',
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
    
}

module.exports = Validator;