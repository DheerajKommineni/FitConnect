// WORKING CODE

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
// import './Analytics.css';

const Analytics = () => {
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [xToken, setXToken] = useContext(store);
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [dailyChartData, setDailyChartData] = useState({});
  const [monthlyChartData, setMonthlyChartData] = useState({});
  const [suggestions, setSuggestions] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [insights, setInsights] = useState('');
  const navigate = useNavigate();

  ChartJS.register(
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
  );

  const fetchAnalyticsData = async token => {
    try {
      const response = await axios.get('http://localhost:8000/api/activity', {
        headers: {
          'x-token': token,
        },
        withCredentials: true,
      });

      const {
        totalSteps,
        totalDistance,
        totalCalories,
        totalHeartRate,
        totalMoveMinutes,
        totalSleep,
        dailyData,
        monthlyData,
      } = response.data;

      setDailyData(dailyData);
      setMonthlyData(monthlyData);
      setDataFetched(true);

      prepareChartData(dailyData, monthlyData);
      generateSuggestions(
        totalSteps,
        totalDistance,
        totalCalories,
        totalHeartRate,
        totalMoveMinutes,
        totalSleep,
      );
      await fetchPredictions(monthlyData, token);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Error fetching analytics data');
    }
  };

  const prepareChartData = (dailyData, monthlyData) => {
    // Daily Data Preparation
    const dailyLabels = dailyData.map(data =>
      format(new Date(data.date), 'MMM do'),
    );
    const dailySteps = dailyData.map(data => data.steps);
    const dailyDistance = dailyData.map(data => data.distance);
    const dailyCalories = dailyData.map(data => data.caloriesExpended || 0);
    const dailyHeartRate = dailyData.map(data => data.heartRate || 0);
    const dailyMoveMinutes = dailyData.map(data => data.moveMinutes || 0);

    // Find the max values and their indices
    const maxDailyStepsIndex = dailySteps.indexOf(Math.max(...dailySteps));
    const maxDailyDistanceIndex = dailyDistance.indexOf(
      Math.max(...dailyDistance),
    );
    const maxDailyCaloriesIndex = dailyCalories.indexOf(
      Math.max(...dailyCalories),
    );
    const maxDailyHeartRateIndex = dailyHeartRate.indexOf(
      Math.max(...dailyHeartRate),
    );
    const maxDailyMoveMinutesIndex = dailyMoveMinutes.indexOf(
      Math.max(...dailyMoveMinutes),
    );

    // Monthly Data Preparation
    const monthlyLabels = monthlyData.map(data => data.month);
    const monthlySteps = monthlyData.map(data => data.steps);
    const monthlyDistance = monthlyData.map(data => data.distance);
    const monthlyCalories = monthlyData.map(data => data.caloriesExpended || 0);
    const monthlyHeartRate = monthlyData.map(data => data.heartRate || 0);
    const monthlyMoveMinutes = monthlyData.map(data => data.moveMinutes || 0);

    // Find the max values and their indices
    const maxMonthlyStepsIndex = monthlySteps.indexOf(
      Math.max(...monthlySteps),
    );
    const maxMonthlyDistanceIndex = monthlyDistance.indexOf(
      Math.max(...monthlyDistance),
    );
    const maxMonthlyCaloriesIndex = monthlyCalories.indexOf(
      Math.max(...monthlyCalories),
    );
    const maxMonthlyHeartRateIndex = monthlyHeartRate.indexOf(
      Math.max(...monthlyHeartRate),
    );
    const maxMonthlyMoveMinutesIndex = monthlyMoveMinutes.indexOf(
      Math.max(...monthlyMoveMinutes),
    );

    setDailyChartData({
      labels: dailyLabels,
      datasets: [
        {
          label: 'Daily Steps',
          data: dailySteps,
          borderColor: 'blue',
          fill: false,
          pointBackgroundColor: dailySteps.map((_, index) =>
            index === maxDailyStepsIndex ? 'red' : 'blue',
          ),
          pointRadius: dailySteps.map((_, index) =>
            index === maxDailyStepsIndex ? 8 : 3,
          ),
        },
        {
          label: 'Daily Distance',
          data: dailyDistance,
          borderColor: 'green',
          fill: false,
          pointBackgroundColor: dailyDistance.map((_, index) =>
            index === maxDailyDistanceIndex ? 'red' : 'green',
          ),
          pointRadius: dailyDistance.map((_, index) =>
            index === maxDailyDistanceIndex ? 8 : 3,
          ),
        },
        {
          label: 'Daily Calories',
          data: dailyCalories,
          borderColor: 'red',
          fill: false,
          pointBackgroundColor: dailyCalories.map((_, index) =>
            index === maxDailyCaloriesIndex ? 'red' : 'red',
          ),
          pointRadius: dailyCalories.map((_, index) =>
            index === maxDailyCaloriesIndex ? 8 : 3,
          ),
        },
        {
          label: 'Daily Heart Rate',
          data: dailyHeartRate,
          borderColor: 'purple',
          fill: false,
          pointBackgroundColor: dailyHeartRate.map((_, index) =>
            index === maxDailyHeartRateIndex ? 'red' : 'purple',
          ),
          pointRadius: dailyHeartRate.map((_, index) =>
            index === maxDailyHeartRateIndex ? 8 : 3,
          ),
        },
        {
          label: 'Daily Move Minutes',
          data: dailyMoveMinutes,
          borderColor: 'orange',
          fill: false,
          pointBackgroundColor: dailyMoveMinutes.map((_, index) =>
            index === maxDailyMoveMinutesIndex ? 'red' : 'orange',
          ),
          pointRadius: dailyMoveMinutes.map((_, index) =>
            index === maxDailyMoveMinutesIndex ? 8 : 3,
          ),
        },
      ],
      options: {
        scales: {
          x: {
            ticks: {
              callback: function (value, index, values) {
                return dailyLabels[index];
              },
            },
          },
        },
      },
    });

    setMonthlyChartData({
      labels: monthlyLabels,
      datasets: [
        {
          label: 'Monthly Steps',
          data: monthlySteps,
          borderColor: 'blue',
          fill: false,
          pointBackgroundColor: monthlySteps.map((_, index) =>
            index === maxMonthlyStepsIndex ? 'red' : 'blue',
          ),
          pointRadius: monthlySteps.map((_, index) =>
            index === maxMonthlyStepsIndex ? 8 : 3,
          ),
        },
        {
          label: 'Monthly Distance',
          data: monthlyDistance,
          borderColor: 'green',
          fill: false,
          pointBackgroundColor: monthlyDistance.map((_, index) =>
            index === maxMonthlyDistanceIndex ? 'red' : 'green',
          ),
          pointRadius: monthlyDistance.map((_, index) =>
            index === maxMonthlyDistanceIndex ? 8 : 3,
          ),
        },
        {
          label: 'Monthly Calories',
          data: monthlyCalories,
          borderColor: 'red',
          fill: false,
          pointBackgroundColor: monthlyCalories.map((_, index) =>
            index === maxMonthlyCaloriesIndex ? 'red' : 'red',
          ),
          pointRadius: monthlyCalories.map((_, index) =>
            index === maxMonthlyCaloriesIndex ? 8 : 3,
          ),
        },
        {
          label: 'Monthly Heart Rate',
          data: monthlyHeartRate,
          borderColor: 'purple',
          fill: false,
          pointBackgroundColor: monthlyHeartRate.map((_, index) =>
            index === maxMonthlyHeartRateIndex ? 'red' : 'purple',
          ),
          pointRadius: monthlyHeartRate.map((_, index) =>
            index === maxMonthlyHeartRateIndex ? 8 : 3,
          ),
        },
        {
          label: 'Monthly Move Minutes',
          data: monthlyMoveMinutes,
          borderColor: 'orange',
          fill: false,
          pointBackgroundColor: monthlyMoveMinutes.map((_, index) =>
            index === maxMonthlyMoveMinutesIndex ? 'red' : 'orange',
          ),
          pointRadius: monthlyMoveMinutes.map((_, index) =>
            index === maxMonthlyMoveMinutesIndex ? 8 : 3,
          ),
        },
      ],
    });
  };

  const generateSuggestions = (
    totalSteps,
    totalDistance,
    totalCalories,
    totalHeartRate,
    totalMoveMinutes,
    totalSleep,
  ) => {
    const averageSteps = totalSteps / dailyData.length;
    const averageDistance = totalDistance / dailyData.length;
    const averageCalories = totalCalories / dailyData.length;
    const averageHeartRate = totalHeartRate / dailyData.length;
    const averageMoveMinutes = totalMoveMinutes / dailyData.length;

    let suggestionsText =
      'Here are some suggestions to improve your fitness:\n\n';

    if (averageSteps < 5000) {
      suggestionsText +=
        'Try to increase your daily steps to at least 5000 steps. Consider taking short walks during breaks.\n';
    } else if (averageSteps < 10000) {
      suggestionsText +=
        'You are doing well! Aim to reach 10000 steps daily for optimal health benefits.\n';
    } else {
      suggestionsText +=
        'Great job! You are reaching more than 10000 steps daily. Keep up the good work!\n';
    }

    if (averageCalories < 2000) {
      suggestionsText +=
        'Your daily calorie intake might be low. Ensure you are consuming enough calories to support your activity level.\n';
    } else if (averageCalories > 2500) {
      suggestionsText +=
        'Your daily calorie intake might be high. Consider balancing your diet to avoid excess calories.\n';
    }

    if (averageHeartRate < 60) {
      suggestionsText +=
        'Consider increasing your physical activity to raise your average heart rate to a healthy level.\n';
    } else if (averageHeartRate > 100) {
      suggestionsText +=
        'Monitor your heart rate during exercise. If it remains high, consult a healthcare professional.\n';
    }

    if (totalMoveMinutes > 0) {
      suggestionsText += `You have been active for ${totalMoveMinutes} minutes this month. Keep up the consistent activity.\n`;
    } else {
      suggestionsText +=
        'You have been inactive this month. Try to incorporate some physical activity into your routine.\n';
    }

    setSuggestions(suggestionsText);
  };

  const fetchPredictions = async (monthlyData, token) => {
    try {
      const response = await axios.post(
        'http://localhost:8000/predict',
        { monthlyData },
        {
          headers: {
            'x-token': token,
          },
        },
      );

      if (response.status === 200) {
        setPredictions(response.data.predictions);
        generateInsights(response.data.predictions);
      } else {
        console.error('Error making predictions:', response);
        setError('Error making predictions');
      }
    } catch (error) {
      console.error('Error making predictions:', error);
      setError('Error making predictions');
    }
  };

  const generateInsights = predictions => {
    if (!predictions || predictions.length === 0) {
      setInsights('No predictions available to generate insights.');
      return;
    }

    let insightsText = 'Based on your predictions:\n\n';
    const predictedSteps = predictions.map(prediction => prediction.value);
    const averagePredictedSteps =
      predictedSteps.reduce((sum, steps) => sum + steps, 0) /
      predictedSteps.length;

    const trend =
      averagePredictedSteps > 10000
        ? 'increasing'
        : averagePredictedSteps < 5000
        ? 'decreasing'
        : 'stable';

    insightsText += `Your activity trend over the next 6 months is expected to be ${trend}.\n\n`;

    insightsText += 'Here are some insights and suggestions for you:\n\n';

    if (trend === 'increasing') {
      insightsText +=
        'You are on a great path! Continue your active lifestyle and try to challenge yourself with new activities.\n';
    } else if (trend === 'decreasing') {
      insightsText +=
        'It looks like your activity might decrease. Consider setting small, achievable goals to stay motivated.\n';
    } else {
      insightsText +=
        'Your activity level is stable. Maintain your routine and consider adding variety to your workouts to stay engaged.\n';
    }

    setInsights(insightsText);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!xToken) {
        const storedToken = localStorage.getItem('x-token');
        if (storedToken) {
          setXToken(storedToken);
        } else {
          console.error('No x-token found in localStorage');
          return;
        }
      }

      try {
        await fetchAnalyticsData(xToken);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };

    fetchData();
  }, [xToken, setXToken]);

  // const handleLogout = () => {
  //   localStorage.removeItem('x-token');
  //   setXToken(null);
  //   navigate('/login');
  // };

  return (
    <div>
      <h1>Analytics</h1>

      {error ? (
        <p>{error}</p>
      ) : dataFetched ? (
        <div>
          <h2 style={{ marginLeft: '30px' }}>Daily Activity Data</h2>
          <Line style={{ margin: '50px' }} data={dailyChartData} />
          <h2 style={{ marginLeft: '30px' }}>Monthly Activity Data</h2>
          <Line style={{ margin: '50px' }} data={monthlyChartData} />
          <h2 style={{ marginLeft: '30px' }}>Suggestions</h2>
          <p style={{ margin: '30px' }}>{suggestions}</p>
          <div
            style={{
              margin: '20px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
            }}
          >
            <h2>Insights</h2>
            <p>{insights}</p>
          </div>
          {predictions.length > 0 && (
            <div
              style={{
                margin: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
              }}
              className="predictions-container"
            >
              <h2>Predictions</h2>
              <h2 className="predictions-header">Predicted Activity Trends</h2>
              <ul className="predictions-list">
                {predictions.map((prediction, index) => (
                  <li
                    key={index}
                    className={`prediction-item ${
                      prediction.value > 0.7
                        ? 'high'
                        : prediction.value > 0.4
                        ? 'moderate'
                        : 'low'
                    }`}
                  >
                    <strong>Month {index + 1}:</strong>{' '}
                    {prediction.value > 0.7
                      ? 'High activity expected. Keep it up!'
                      : prediction.value > 0.4
                      ? 'Moderate activity expected. Stay consistent!'
                      : 'Low activity expected. Consider increasing your efforts.'}
                  </li>
                ))}
              </ul>
              <div className="predictions-summary">
                <h3 className="predictions-summary-header">
                  Summary of Predictions
                </h3>

                <p>
                  Over the next six months:
                  <ul>
                    <li className="summary-item">
                      <strong>High Activity Months:</strong>{' '}
                      {predictions
                        .map((pred, idx) =>
                          pred.value > 0.7 ? `Month ${idx + 1}` : null,
                        )
                        .filter(Boolean)
                        .join(', ') || 'None'}
                    </li>
                    <li className="summary-item">
                      <strong>Moderate Activity Months:</strong>{' '}
                      {predictions
                        .map((pred, idx) =>
                          pred.value > 0.4 && pred.value <= 0.7
                            ? `Month ${idx + 1}`
                            : null,
                        )
                        .filter(Boolean)
                        .join(', ') || 'None'}
                    </li>
                    <li className="summary-item">
                      <strong>Low Activity Months:</strong>{' '}
                      {predictions
                        .map((pred, idx) =>
                          pred.value <= 0.4 ? `Month ${idx + 1}` : null,
                        )
                        .filter(Boolean)
                        .join(', ') || 'None'}
                    </li>
                  </ul>
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Loading analytics data...</p>
      )}
    </div>
  );
};

export default Analytics;
