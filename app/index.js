const express = require('express');
const app = express();
const mongoose = require('mongoose');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rfs = require('rotating-file-stream');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const passport = require('passport');
const expressSession = require('express-session');
const redis = require('redis');
const cors = require('cors');


// // Set RedicClient in global
// myRedisClient = {};

// Set Debug
debug = require('debug')('instaHelper:app');
debugDB = require('debug')('instaHelper:MongoDB');
debugRedis= require('debug')('instaHelper:Redis');

// Set Consts
CONSTS = require('../helpers/consts')

const {normalizePort} = require('../helpers');
const consts = require('../helpers/consts');

const port = normalizePort(configs.port || '3000');
app.set('port',port);

class Application{

    host;
    constructor(){
        console.log('DEBUG is', process.env.DEBUG);
        this.setupExpress();
        this.setMongoConnection();
        this.setupRedis();
        this.setConfigs();
        this.setSwagger();
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
        mongoose.connect(configs.database.mongodb.url)
            .then(()=>debugDB('Connected to MongoDB Succesfully'))
            .catch(err=>debugDB(err));
    }
    
    setupRedis(){
        global.myRedisClient = redis.createClient({url: configs.database.redis.url});
        myRedisClient.connect()
            .then(()=>{
                debugRedis('Redis is ready to use.');
                myRedisClient.set('test','test123',{EX: 10000000});
            });

        myRedisClient.on('error',(err=>{
            if(err['code'] === 'ECONNREFUSED'){
                debugRedis(`Redis server is not available.\t Address: ${err['address']}\t Port: ${err['port']}`);
            }else{
                debugRedis(err['message']);
            }
            process.exit(0);
        }));
    }

    setConfigs(){
        this.setLogger();
        require('./passport/passport-jwt');
        app.use(express.static(path.join(__dirname,'..','public')));
        app.use(express.json());
        app.use(express.urlencoded({extended:true}));
        app.use(expressSession({...configs.session}));
        app.use(cookieParser());
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(cors());

    }

    setSwagger(){
        let swaggerOptions = swaggerJsDoc({
            swaggerDefinition:{
                openapi : '3.0.0',
                info:{
                    title: 'Instagram Helper API',
                    version : '1.0.0',
                    description : 'This is a practical project',
                    contact:{
                        name: "Reza Hadipour",
                        email: "Reza.hadipour2002@gmail.com",
                        url: "http:\\therahanik.ir"
                    }
                },
                servers : [{
                    url: '/v1'
                },{
                    url: `http:${configs.host}:${port}`
                }]
            },
            apis : [path.join(__dirname,'..','swagger','*.yaml')]
        });
        app.use('/api-doc',swaggerUi.serve,swaggerUi.setup(swaggerOptions,{explorer:true}));
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
        app.use(require('./routes'));
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