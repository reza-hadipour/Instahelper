class helper {

  normalizePort(val) {
      var port = parseInt(val, 10);
    
      if (isNaN(port)) {
        // named pipe
        return val;
      }
    
      if (port >= 0) {
        // port number
        return port;
      }
    
      return false;
    }

    randomNumberGenerator(min = 100000,max = 999999){
      return Math.round(Math.random() * (max - min)) + min;
    }

    normalizeData(dataObject = {}){
      Object.keys(dataObject).forEach(key=>{
          if([""," ",0,null, undefined,"0",NaN].includes(dataObject[key])) delete dataObject[key];
      });
      return dataObject;
  }

  slug(title){
    return String(title).replace(/([^a-zA-Z0-9آ-ی0-9]|-)+/g,'-');
  }
  
}


module.exports = new helper;

  // module.exports = {
  //   normalizePort,
  //   randomNumberGenerator,
  //   normalizeData
  // }