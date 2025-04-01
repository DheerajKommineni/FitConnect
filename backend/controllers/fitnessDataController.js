const fitnessService = require('../services/fitnessService');

exports.saveFitnessData = async (req, res) => {
  try {
    const response = await fitnessService.saveFitnessData(req.body);
    res.send(response);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};
