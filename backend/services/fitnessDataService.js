const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
} = require('../model');

async function saveFitnessData(data) {
  try {
    const {
      userId,
      age = 0,
      weight = 0,
      height = 0,
      gender = '',
      dailySteps = [],
      monthlySteps = [],
      sixMonthsSteps = 0,
      dailyDistance = [],
      monthlyDistance = [],
      dailyCalories = [],
      monthlyCalories = [],
      dailyMoveMinutes = [],
      monthlyMoveMinutes = [],
      dailyHeartPoints = [],
      monthlyHeartPoints = [],
      dailyHeartRate = [],
      monthlyHeartRate = [],
      sixMonthsDistance = 0,
      dailyStepsArray = [],
      dailyDistanceArray = [],
      calories = 0,
      heartRate = 0,
      sleep = 0,
      totalCalories = 0,
      totalSteps = 0,
      totalDistance = 0,
      totalHeartRate = 0,
      totalMoveMinutes = 0,
      totalHeartPoints = 0,
      activityDuration = 0,
    } = req.body;

    console.log('Received data:', {
      userId,
      age,
      weight,
      height,
      gender,
      dailySteps,
      monthlySteps,
      dailyDistance,
      monthlyDistance,
      dailyCalories,
      monthlyCalories,
      calories,
      heartRate,
      dailyHeartRate,
      monthlyHeartRate,
      dailyMoveMinutes,
      monthlyMoveMinutes,
      dailyHeartPoints,
      monthlyHeartPoints,
      sleep,
      activityDuration,
      sixMonthsSteps,
      sixMonthsDistance,
      totalCalories,
      totalSteps,
      totalDistance,
      totalHeartRate,
      totalMoveMinutes,
      dailyStepsArray,
      dailyDistanceArray,
      totalHeartPoints,
    });

    // Parse and validate incoming data
    const validSixMonthsSteps = !isNaN(parseFloat(sixMonthsSteps))
      ? parseFloat(sixMonthsSteps)
      : 0;
    const validSixMonthsDistance = !isNaN(parseFloat(sixMonthsDistance))
      ? parseFloat(sixMonthsDistance)
      : 0;

    // Find or create the fitness data record
    let fitnessData = await userFitnessInfo.findOne({ userId });
    if (!fitnessData) {
      console.log('Creating new fitness data record...');
      fitnessData = new userFitnessInfo({
        userId,
        age,
        weight,
        height,
        gender,
        totalSteps,
        totalDistance,
        totalCalories,
        totalHeartRate,
        totalMoveMinutes,
        totalHeartPoints,
        sleep,
        activityDuration,
      });
    } else {
      console.log('Updating existing fitness data record...');
      fitnessData.age = age;
      fitnessData.weight = weight;
      fitnessData.height = height;
      fitnessData.gender = gender;
      fitnessData.totalSteps = totalSteps;
      fitnessData.totalDistance = totalDistance;
      fitnessData.totalCalories = totalCalories;
      fitnessData.totalHeartRate = totalHeartRate;
      fitnessData.totalMoveMinutes = totalMoveMinutes;
      fitnessData.totalHeartPoints = totalHeartPoints;
      fitnessData.sleep = sleep;
      fitnessData.activityDuration = activityDuration;
    }

    await fitnessData.save();

    // Save daily data for each day in the current month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based month

    // Save daily steps data
    for (const stepEntry of dailySteps) {
      const formattedDate = new Date(parseInt(stepEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const steps = parseInt(stepEntry.value) || 0;

      console.log('Formatted Date Steps', formattedDate);
      console.log('Steps', steps);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({ userId, date: formattedDate, steps });
      } else {
        dailyData.steps = steps;
      }
      console.log('Daily Data steps', dailyData);
      await dailyData.save();
    }

    // Save daily distance data
    for (const distanceEntry of dailyDistance) {
      const formattedDate = new Date(parseInt(distanceEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const distance = parseFloat(distanceEntry.value) || 0;

      console.log('Formatted Date Distance', formattedDate);
      console.log('Distance', distance);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          distance,
        });
      } else {
        dailyData.distance = distance;
      }
      console.log('Daily Data distance', dailyData);
      await dailyData.save();
    }

    // Save daily calories data
    for (const caloriesEntry of dailyCalories) {
      const formattedDate = new Date(parseInt(caloriesEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const calories = parseFloat(caloriesEntry.value) || 0;

      console.log('Formatted Date Calories', formattedDate);
      console.log('Calories', calories);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          caloriesExpended: calories,
        });
      } else {
        dailyData.caloriesExpended = calories;
      }
      console.log('Daily Data calories', dailyData);
      await dailyData.save();
    }

    // Save daily Heart Points
    for (const heartpointsEntry of dailyHeartPoints) {
      const formattedDate = new Date(parseInt(heartpointsEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const heartpoints = parseInt(heartpointsEntry.value) || 0;

      console.log('Formatted Date HeartPoints', formattedDate);
      console.log('Heaart Points', heartpoints);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          heartpoints,
        });
      } else {
        dailyData.heartPoints = heartpoints;
      }
      console.log('Daily Data steps', dailyData);
      await dailyData.save();
    }

    // Save daily heart rate data
    for (const heartRateEntry of dailyHeartRate) {
      const formattedDate = new Date(parseInt(heartRateEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const heartRate = parseFloat(heartRateEntry.value) || 0;

      console.log('Formatted Date Heart Rate', formattedDate);
      console.log('Heart Rate', heartRate);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          heartRate,
        });
      } else {
        dailyData.heartRate = heartRate;
      }
      console.log('Daily Data heart rate', dailyData);
      await dailyData.save();
    }

    // Save daily move minutes data
    for (const moveMinutesEntry of dailyMoveMinutes) {
      const formattedDate = new Date(parseInt(moveMinutesEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const moveMinutes = parseFloat(moveMinutesEntry.moveMinutes) || 0;

      console.log('Formatted Date Move Minutes', formattedDate);
      console.log('Move Minutes', moveMinutes);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          moveMinutes,
        });
      } else {
        dailyData.moveMinutes = moveMinutes;
      }
      console.log('Daily Data move minutes', dailyData);
      await dailyData.save();
    }

    let monthlyData = await userMonthlyData.findOne({
      userId,
      year: currentYear,
    });

    if (!monthlyData) {
      console.log('Creating new monthly data record...');
      monthlyData = new userMonthlyData({
        userId,
        year: currentYear,
        months: [],
      });
    }

    // Prepare new monthly data
    const numberOfMonths = 6; // Number of months to process
    const currentMonthIndex = new Date().getMonth(); // 0-based index for the current month

    // Adjusted month index calculation
    const getCorrectMonth = (currentMonthIndex, offset) => {
      let monthIndex = (currentMonthIndex - offset + 12) % 12; // Ensure index is non-negative
      return monthIndex + 1; // Convert to 1-based index
    };

    // Create new monthly data
    const newMonthlyData = [];

    for (let i = 0; i < numberOfMonths; i++) {
      const month = getCorrectMonth(currentMonthIndex, i); // Ensure this returns the correct month format (e.g., YYYYMM)

      const steps = parseFloat(monthlySteps[numberOfMonths - 1 - i]) || 0;
      const distance = parseFloat(monthlyDistance[numberOfMonths - 1 - i]) || 0;
      const caloriesExpended =
        parseFloat(monthlyCalories[numberOfMonths - 1 - i]) || 0;
      const heartRate =
        parseFloat(monthlyHeartRate[numberOfMonths - 1 - i]) || 0;
      const moveMinutes =
        parseFloat(monthlyMoveMinutes[numberOfMonths - 1 - i]) || 0;
      const heartPoints =
        parseFloat(monthlyHeartPoints[numberOfMonths - 1 - i]) || 0;
      // const sleep = parseFloat(monthlySleep[i]) || 0;

      newMonthlyData.push({
        month,
        steps,
        distance,
        caloriesExpended,
        heartRate,
        moveMinutes,
        heartPoints,
        sleep,
      });
    }

    // Merge new monthly data with existing data
    const existingMonthsMap = new Map(
      (monthlyData.months || []).map(m => [m.month, m]),
    );

    newMonthlyData.forEach(m => {
      existingMonthsMap.set(m.month, m);
    });

    // Update the months array
    monthlyData.months = Array.from(existingMonthsMap.values())
      .sort((a, b) => b.month - a.month) // Sort in descending order
      .slice(0, 6); // Keep the latest 6 months

    console.log('Updated monthly data:', monthlyData.months);

    try {
      await monthlyData.save();
      console.log('Monthly data saved successfully.');
    } catch (error) {
      console.error('Error saving monthly data:', error); // Error handling
    } // Adjust this according to your saving logic

    res.send('User fitness data saved successfully');
  } catch (error) {
    console.error('Error saving user fitness data:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { saveFitnessData };
