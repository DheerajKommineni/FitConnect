const Big = require('big.js');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

class GoogleFitService {
  async fetchGoogleFitData(accessToken) {
    // Calculate time ranges dynamically
    const now = new Date();

    // Current month start and end times
    const dailyStartTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const dailyEndTime = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getTime();

    // Six months start and end times
    const sixMonthsStartTime = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
    ).getTime(); // 6 months ago from now
    const sixMonthsEndTime = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getTime(); // End of current month

    // Extract steps, distance, and other data from the responses
    const extractData = (response, dataType) => {
      if (!response || !response.bucket) {
        console.log('Invalid response structure.');
        return new Big(0);
      }
      console.log(
        'Response for extraction:',
        JSON.stringify(response, null, 2),
      );

      return response.bucket.reduce((total, bucket) => {
        if (!bucket.dataset) {
          console.log('No dataset in bucket.');
          return total;
        }

        return bucket.dataset.reduce((bucketTotal, dataset) => {
          if (!dataset.point) {
            console.log('No points in dataset.');
            return bucketTotal;
          }

          return dataset.point.reduce((pointTotal, point) => {
            const rawValue = point.value[0] ? point.value[0][dataType] : 0;
            console.log(`Extracted rawValue for ${dataType}:`, rawValue);
            const value =
              isNaN(rawValue) || rawValue === null || rawValue === undefined
                ? 0
                : rawValue;

            try {
              return pointTotal.plus(new Big(value));
            } catch (error) {
              console.error('Error creating Big instance with value:', value);
              throw error; // Re-throw the error after logging
            }
          }, bucketTotal);
        }, total);
      }, new Big(0));
    };
    const fetchData = async (start, end, durationMillis, dataType) => {
      console.log(
        `Fetching data from ${new Date(start).toISOString()} to ${new Date(
          end,
        ).toISOString()} for ${dataType}`,
      );
      try {
        const response = await fetch(
          `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              aggregateBy: [{ dataTypeName: dataType }],
              bucketByTime: { durationMillis },
              startTimeMillis: start,
              endTimeMillis: end,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error Response Text:', errorText);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log(
          `Response Data for ${dataType}:`,
          JSON.stringify(responseData, null, 2),
        );
        // console.log('Response Data:', responseData);
        return responseData;
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
    };

    try {
      // Fetch data for the current month
      const dailyStepsData = await fetchData(
        dailyStartTime,
        dailyEndTime,
        86400000, // 1 day in milliseconds
        'com.google.step_count.delta',
      );

      const dailyDistanceData = await fetchData(
        dailyStartTime,
        dailyEndTime,
        86400000, // 1 day in milliseconds
        'com.google.distance.delta',
      );

      const dailyCaloriesData = await fetchData(
        dailyStartTime,
        dailyEndTime,
        86400000, // 1 day in milliseconds
        'com.google.calories.expended',
      );

      const dailyHeartRateData = await fetchData(
        dailyStartTime,
        dailyEndTime,
        86400000, // 1 day in milliseconds
        'com.google.heart_rate.bpm',
      );

      const dailyMoveMinutesData = await fetchData(
        dailyStartTime,
        dailyEndTime,
        86400000, // 1 day in milliseconds
        'com.google.active_minutes',
      );

      const dailyHeartPointsData = await fetchData(
        dailyStartTime,
        dailyEndTime,
        86400000, // 1 day in milliseconds
        'com.google.heart_minutes',
      );

      // Extract daily data for additional data types
      const extractDailyData = (response, dataType) => {
        const dailyData = [];
        if (response && response.bucket) {
          response.bucket.forEach(bucket => {
            if (bucket.dataset) {
              bucket.dataset.forEach(dataset => {
                if (dataset.point) {
                  dataset.point.forEach(point => {
                    const timestamp = bucket.startTimeMillis;
                    const rawValue = point.value[0]
                      ? point.value[0][dataType]
                      : 0;
                    const value =
                      isNaN(rawValue) ||
                      rawValue === null ||
                      rawValue === undefined
                        ? 0
                        : rawValue;
                    dailyData.push({ timestamp, value: new Big(value) });
                  });
                }
              });
            }
          });
        }
        return dailyData;
      };

      const dailyStepsArray = extractDailyData(dailyStepsData, 'intVal');
      const dailyDistanceArray = extractDailyData(dailyDistanceData, 'fpVal');
      const dailyCaloriesArray = extractDailyData(dailyCaloriesData, 'fpVal');
      const dailyHeartRateArray = extractDailyData(dailyHeartRateData, 'fpVal');
      const dailyMoveMinutesArray = extractDailyData(
        dailyMoveMinutesData,
        'intVal',
      );
      const dailyHeartPointsArray = extractDailyData(
        dailyHeartPointsData,
        'fpVal',
      );

      // Fetch 6 months data in smaller intervals
      const sixMonthsSteps = [];
      const sixMonthsDistance = [];
      const sixMonthsCalories = [];
      // Commenting out heart rate data fetch
      const sixMonthsHeartRate = [];
      const sixMonthsMoveMinutes = [];
      const sixMonthsHeartPoints = [];
      let totalSteps = new Big(0);
      let totalDistance = new Big(0);
      let totalCalories = new Big(0);
      let totalHeartRate = new Big(0);
      let heartRateCount = 0;
      let totalMoveMinutes = new Big(0);
      let totalHeartPoints = new Big(0);
      const interval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      let start = sixMonthsStartTime;
      const end = sixMonthsEndTime;

      while (start < end) {
        const intervalEnd = Math.min(start + interval, end);
        const intervalStepsData = await fetchData(
          start,
          intervalEnd,
          interval,
          'com.google.step_count.delta',
        );
        sixMonthsSteps.push(intervalStepsData);

        const intervalDistanceData = await fetchData(
          start,
          intervalEnd,
          interval,
          'com.google.distance.delta',
        );
        sixMonthsDistance.push(intervalDistanceData);

        const intervalCaloriesData = await fetchData(
          start,
          intervalEnd,
          interval,
          'com.google.calories.expended',
        );
        sixMonthsCalories.push(intervalCaloriesData);

        // Commenting out heart rate data fetch
        const intervalHeartRateData = await fetchData(
          start,
          intervalEnd,
          interval,
          'com.google.heart_rate.bpm',
        );
        sixMonthsHeartRate.push(intervalHeartRateData);

        const intervalMoveMinutesData = await fetchData(
          start,
          intervalEnd,
          interval,
          'com.google.active_minutes',
        );
        sixMonthsMoveMinutes.push(intervalMoveMinutesData);

        const intervalHeartPointsData = await fetchData(
          start,
          intervalEnd,
          interval,
          'com.google.heart_minutes',
        );
        sixMonthsHeartPoints.push(intervalHeartPointsData);

        totalSteps = totalSteps.plus(extractData(intervalStepsData, 'intVal'));
        totalDistance = totalDistance.plus(
          extractData(intervalDistanceData, 'fpVal'),
        );
        totalCalories = totalCalories.plus(
          extractData(intervalCaloriesData, 'fpVal'),
        );
        totalHeartRate = totalHeartRate.plus(
          extractData(intervalHeartRateData, 'fpVal').toString(),
        );

        totalMoveMinutes = totalMoveMinutes.plus(
          extractData(intervalMoveMinutesData, 'intVal'),
        );

        totalHeartPoints = totalHeartPoints.plus(
          extractData(intervalHeartPointsData, 'fpVal'),
        );

        start = intervalEnd; // Move start to the end of the current interval
      }

      // Prepare monthly data array for last 6 months
      const monthlyStepsArray = [];
      const monthlyDistanceArray = [];
      const monthlyCaloriesArray = [];
      const monthlyHeartRateArray = [];
      const monthlyMoveMinutesArray = [];
      const monthlyHeartPointsArray = [];

      for (let i = 0; i < 6; i++) {
        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1,
        ).getTime();
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
        ).getTime();

        console.log(
          `Fetching month data from ${new Date(
            monthStart,
          ).toISOString()} to ${new Date(monthEnd).toISOString()}`,
        );

        const monthStepsData = await fetchData(
          monthStart,
          monthEnd,
          2592000000, // 1 month in milliseconds
          'com.google.step_count.delta',
        );

        const monthDistanceData = await fetchData(
          monthStart,
          monthEnd,
          2592000000, // 1 month in milliseconds
          'com.google.distance.delta',
        );

        const monthCaloriesData = await fetchData(
          monthStart,
          monthEnd,
          2592000000, // 1 month in milliseconds
          'com.google.calories.expended',
        );

        const monthHeartRateData = await fetchData(
          monthStart,
          monthEnd,
          2592000000, // 1 month in milliseconds
          'com.google.heart_rate.bpm',
        );

        const monthMoveMinutesData = await fetchData(
          monthStart,
          monthEnd,
          2592000000, // 1 month in milliseconds
          'com.google.active_minutes',
        );

        const monthHeartPointsData = await fetchData(
          monthStart,
          monthEnd,
          2592000000, // 1 month in milliseconds,
          'com.google.heart_minutes',
        );

        console.log(
          `Monthly data for steps (month ${i}):`,
          extractData(monthStepsData, 'intVal').toString(),
        );
        console.log(
          `Monthly data for distance (month ${i}):`,
          extractData(monthDistanceData, 'fpVal').toString(),
        );
        console.log(
          `Monthly data for calories (month ${i}):`,
          extractData(monthCaloriesData, 'fpVal').toString(),
        );

        monthlyStepsArray.unshift(
          extractData(monthStepsData, 'intVal').toString(),
        );
        monthlyDistanceArray.unshift(
          extractData(monthDistanceData, 'fpVal').toString(),
        );
        monthlyCaloriesArray.unshift(
          extractData(monthCaloriesData, 'fpVal').toString(),
        );
        monthlyHeartRateArray.unshift(
          extractData(monthHeartRateData, 'fpVal').toString(),
        );
        monthlyMoveMinutesArray.unshift(
          extractData(monthMoveMinutesData, 'intVal').toString(),
        );
        monthlyHeartPointsArray.unshift(
          extractData(monthHeartPointsData, 'fpVal').toString(),
        );
      }

      console.log('Daily Heart Rate Array:', dailyHeartRateArray);
      console.log('Monthly Heart Rate Array:', monthlyHeartRateArray);

      const sum = dailyHeartRateArray.reduce((sum, entry) => {
        const value = parseFloat(entry.value || 0); // Default to 0 if value is invalid
        return isNaN(value) ? sum : sum + value; // Add only valid numbers
      }, 0);

      const len = dailyHeartRateArray.length || 1; // Avoid division by zero

      const averageHeartRate = isNaN(sum / len) ? 0 : sum / len; // Validate final result

      console.log('Monthly Steps Array:', monthlyStepsArray);
      console.log('Monthly Distance Array:', monthlyDistanceArray);
      console.log('Monthly Calories Array:', monthlyCaloriesArray);

      const sanitizeOutput = value => {
        if (isNaN(value) || value === null || value === undefined) {
          return 0; // Default to 0 for invalid values
        }
        return value.toString ? value.toString() : value;
      };

      return {
        dailySteps: dailyStepsArray,
        dailyDistance: dailyDistanceArray,
        dailyCalories: dailyCaloriesArray,
        dailyHeartRate: dailyHeartRateArray,
        dailyMoveMinutes: dailyMoveMinutesArray,
        dailyHeartPoints: dailyHeartPointsArray,
        monthlySteps: monthlyStepsArray,
        monthlyDistance: monthlyDistanceArray,
        monthlyCalories: monthlyCaloriesArray,
        monthlyHeartRate: monthlyHeartRateArray,
        monthlyMoveMinutes: monthlyMoveMinutesArray,
        monthlyHeartPoints: monthlyHeartPointsArray,
        totalSteps: sanitizeOutput(totalSteps.toString()),
        totalDistance: sanitizeOutput(totalDistance.toString()),
        totalCalories: sanitizeOutput(totalCalories.toString()),
        totalHeartRate: sanitizeOutput(averageHeartRate),
        totalMoveMinutes: sanitizeOutput(totalMoveMinutes.toString()),
        totalHeartPoints: sanitizeOutput(totalHeartPoints.toString()),
      };
    } catch (error) {
      console.error('Error in fetchGoogleFitData:', error);
      throw error;
    }
  }
}

module.exports = new GoogleFitService();
