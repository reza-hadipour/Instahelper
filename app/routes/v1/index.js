// API version 1 routes
let router = require('express').Router();

// Routes
let adminRoutes = require('./admin');   // For users
let publicRoutes = require('./public');     // For everyone
let authenticationRoutes = require('./auth');

// Midlleware
const authenticateApi = require('../../http/middleware/authenticateApi');


// router.use('/admin',authenticateApi.handle,adminRoutes);
router.use('/admin',authenticateApi.handle ,adminRoutes);
router.use('/auth', authenticationRoutes);
router.use('/', publicRoutes);

module.exports = router;