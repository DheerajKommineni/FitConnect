// userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const middleware = require('../middleware');

router.get('/dashboard', middleware, userController.getDashboard);

module.exports = router;
