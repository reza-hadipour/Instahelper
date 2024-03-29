var express = require('express');
var router = express.Router();
const createHttpError = require('http-errors');

let apiV1 = require('./v1');

router.use('/v1',apiV1);

/* Test GET home page. */
router.get('/home', function(req, res, next) {
  res.json({ title: 'Expressss'});
});


/**
 * Error Handler
 */

router.use((req, res, next) => {
  if(req.path == CONSTS.GRAPHQL_PATH){  // Exception for graphQL path
    next();
  }else{
    next(createHttpError.NotFound("صفحه مورد نظر یافت نشد."));
  }
});

router.use((error, req, res, next) => {
  const serverError = createHttpError.InternalServerError();
  const statusCode = error.status || serverError.status;
  const message = error.message || serverError.message;
  return res.status(statusCode).json({
      statusCode,
      errors: {message}
    });
});

module.exports = router;
