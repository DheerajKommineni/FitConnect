const express = require('express');
const router = express.Router();
const fitnessController = require('../controllers/fitnessController');

router.post('/save-fitness-data', fitnessController.saveFitnessData);

module.exports = router;
