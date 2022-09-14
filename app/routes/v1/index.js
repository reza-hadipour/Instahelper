// API version 1 routes

let router = require('express').Router();

let privateRoutes = require('./private');   // For users
let publicRoutes = require('./public');     // For everyone


router.use(privateRoutes);
router.use(publicRoutes);

module.exports = router;