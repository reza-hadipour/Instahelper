// API version 1 routes

let router = require('express').Router();

let privateRoutes = require('./private');   // For users
let publicRoutes = require('./public');     // For everyone
let authenticationRoutes = require('./auth');

router.use(privateRoutes);
router.use(publicRoutes);
router.use('/auth',authenticationRoutes);

module.exports = router;