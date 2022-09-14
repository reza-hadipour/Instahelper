const express = require('express');
const app = express();
const { default: mongoose } = require('mongoose');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rfs = require('rotating-file-stream');

// Set Debug
const debug = require('debug')('instaHelper:app');
const debugDB = require('debug')('instaHelper:database');

const {normalizePort} = require('../helpers');

// Routes
const allRoutes = require('./routes');

const port = normalizePort(configs.port || '3000');
app.set('port',port);

class Application{

    host;

    constructor(){
        console.log('DEBUG is', process.env.DEBUG);
        this.setupExpress();
        this.setMongoConnection();
        this.setConfigs();
        this.setRoutes();
    }

    setupExpress(){

        let server = app.listen(port,()=>{
            console.log(`Server is running on port ${port}`);
            this.host = server.address().address;
        })//.on('error',this.onError);

        server.on('error',this.onError);
        server.on('listening',this.onListening);
    }

    setMongoConnection(){
        mongoose.connect(configs.database.url)
            .then(()=>debugDB('Connected to MongoDB Succesfully'))
            .catch(err=>debugDB(err));
    }

    setConfigs(){
        this.setLogger();
        app.use(express.json());
        app.use(express.urlencoded({extended:true}));
        app.use(cookieParser());
        app.use(express.static(path.join(__dirname,'public')));

    }

    setLogger(){
        let accessLogStream = rfs.createStream('access.log',{
            interval: '1d',
            compress: 'gzip',
            path: path.join(__dirname,'log')
        });

        app.use(logger('combined',{stream: accessLogStream}));
        app.use(logger('dev'));
    }

    setRoutes(){
        app.use(allRoutes);
    }

    onListening() {
        var addr = this.host;
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + port;
        debug('Listening on ' + bind);
    }


    onError(error) {
        if (error.syscall !== 'listen') {
          throw error;
        }
      
        var bind = typeof port === 'string'
          ? 'Pipe ' + port
          : 'Port ' + port;
      
        // handle specific listen errors with friendly messages
        switch (error.code) {
          case 'EACCES':
            debug(bind + ' requires elevated privileges');
            process.exit(1);
            break;
          case 'EADDRINUSE':
            debug(bind + ' is already in use');
            process.exit(1);
            break;
          default:
            throw error;
        }
      }


}

module.exports = Application;