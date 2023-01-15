// API version 1 routes
let router = require('express').Router();

// Routes
let adminRoutes = require('./admin');   // For users
let publicRoutes = require('./public');     // For everyone
let authenticationRoutes = require('./auth');
let superadminRoutes = require('./superadmin');

// Midlleware
const authenticateApi = require('../../http/middleware/authenticateApi');


// router.use('/admin' ,adminRoutes);
router.use('/admin',authenticateApi.handle ,adminRoutes);
router.use('/auth', authenticationRoutes);
router.use('/su', authenticateApi.handle ,superadminRoutes); // Using this routes as Adminstrator
router.use('/public', publicRoutes);

module.exports = router;