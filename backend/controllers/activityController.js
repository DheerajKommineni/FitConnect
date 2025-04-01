const ActivityService = require('../services/activityService');

class ActivityController {
  async getActivity(req, res) {
    try {
      const userId = req.user.id;

      // Fetch all necessary data
      const userFitnessInfo = await ActivityService.fetchUserFitnessInfo(
        userId,
      );
      const dailyData = await ActivityService.fetchDailyData(userId);
      const monthlyData = await ActivityService.fetchMonthlyData(userId);

      res.json({
        ...userFitnessInfo,
        dailyData,
        monthlyData,
      });
    } catch (err) {
      console.error('Error in getActivity:', err);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new ActivityController();
