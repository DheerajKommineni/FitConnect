const express = require('express');
const ActivityController = require('../controllers/activityController');
const middleware = require('../middleware');

const router = express.Router();

router.get('/activity', middleware, ActivityController.getActivity);

module.exports = router;
