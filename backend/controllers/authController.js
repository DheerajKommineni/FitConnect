// src/controllers/authController.js

const express = require('express');
const AuthService = require('../services/authService');
const session = require('express-session');
const crypto = require('crypto');
const router = express.Router();

const sessionSecret = crypto.randomBytes(64).toString('hex');

router.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

class AuthController {
  async register(req, res) {
    try {
      const user = await AuthService.register(req.body);
      return res.status(201).json({ message: 'Registered Successfully', user });
    } catch (error) {
      console.error(error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { token, userId } = await AuthService.login(email, password);

      if (!req.session) {
        return res.status(500).json({ message: 'Session not initialized' });
      }

      req.session.userId = userId; // Store user ID in session
      return res.json({ token });
    } catch (error) {
      console.error(error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();
