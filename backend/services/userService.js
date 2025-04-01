const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
} = require('../model');

const findUserById = async userId => {
  try {
    return await registerUser.findById(userId);
  } catch (err) {
    throw new Error('Error fetching user');
  }
};

module.exports = {
  findUserById,
};
