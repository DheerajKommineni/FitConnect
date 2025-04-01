const { userFitnessInfo, userDailyData, userMonthlyData } = require('../model'); // Ensure model path is correct

class ActivityService {
  async fetchUserFitnessInfo(userId) {
    try {
      const userFitness = await userFitnessInfo.findOne({ userId });
      if (!userFitness) {
        throw new Error('User fitness data not found');
      }
      return userFitness.toObject(); // Convert mongoose document to plain object
    } catch (err) {
      console.error('Error fetching user fitness info:', err);
      throw new Error('Internal Server Error');
    }
  }

  async fetchDailyData(userId) {
    try {
      const dailyData = await userDailyData.find({ userId }).sort({ date: 1 });
      return dailyData;
    } catch (err) {
      console.error('Error fetching daily data:', err);
      throw new Error('Internal Server Error');
    }
  }

  async fetchMonthlyData(userId) {
    try {
      const currentYear = new Date().getFullYear();
      const monthlyData = await userMonthlyData.findOne({
        userId,
        year: currentYear,
      });
      return monthlyData ? monthlyData.months : [];
    } catch (err) {
      console.error('Error fetching monthly data:', err);
      throw new Error('Internal Server Error');
    }
  }
}

module.exports = new ActivityService();
