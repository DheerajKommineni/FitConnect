// userController.js
const userService = require('../services/userService');

const getDashboard = async (req, res) => {
  try {
    const user = await userService.findUserById(req.user.id);
    if (!user) {
      return res.status(400).send('User Not Found');
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  getDashboard,
};
