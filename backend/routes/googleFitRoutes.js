const express = require('express');
const GoogleFitController = require('../controllers/googleFitController');
const middleware = require('../middleware');
const router = express.Router();

// Google Auth endpoints
router.get('/google-auth', middleware, GoogleFitController.googleAuth);
router.get('/google-auth/callback', GoogleFitController.googleAuthCallback);

module.exports = router;
