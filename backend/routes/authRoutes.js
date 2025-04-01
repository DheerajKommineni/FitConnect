// src/routes/authRoutes.js

const express = require('express');
const AuthController = require('../controllers/authController');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto');

const sessionSecret = crypto.randomBytes(64).toString('hex');

// Session configuration (if needed here, otherwise leave it in server.js)
// router.use(
//   session({
//     secret: sessionSecret,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false },
//   }),
// );

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

module.exports = router;
