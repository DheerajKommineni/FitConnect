import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { Line } from 'react-chartjs-2';
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
      const response = await axios.get('http://localhost:8000/activity', {
        headers: {
          'x-token': token,
        },
        withCredentials: true,
      });

      const { dailyData, monthlyData } = response.data;
      setDailyData(dailyData);
      setMonthlyData(monthlyData);
      setDataFetched(true);

      prepareChartData(dailyData, monthlyData);
      generateSuggestions(dailyData, monthlyData);
      await fetchPredictions(monthlyData, token); // Make predictions based on the monthly data
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Error fetching analytics data');
    }
  };

  const prepareChartData = (dailyData, monthlyData) => {
    const dailyLabels = dailyData.map(data => data.date);
    const dailySteps = dailyData.map(data => data.steps);
    const dailyDistance = dailyData.map(data => data.distance);

    const monthlyLabels = monthlyData.map(data => data.month);
    const monthlySteps = monthlyData.map(data => data.steps);
    const monthlyDistance = monthlyData.map(data => data.distance);

    setDailyChartData({
      labels: dailyLabels,
      datasets: [
        {
          label: 'Daily Steps',
          data: dailySteps,
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Daily Distance',
          data: dailyDistance,
          borderColor: 'green',
          fill: false,
        },
      ],
    });

    setMonthlyChartData({
      labels: monthlyLabels,
      datasets: [
        {
          label: 'Monthly Steps',
          data: monthlySteps,
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Monthly Distance',
          data: monthlyDistance,
          borderColor: 'green',
          fill: false,
        },
      ],
    });
  };

  const generateSuggestions = (dailyData, monthlyData) => {
    let totalSteps = 0;
    let totalDistance = 0;
    let activeDays = 0;

    dailyData.forEach(data => {
      totalSteps += data.steps;
      totalDistance += data.distance;
      if (data.steps > 0) {
        activeDays++;
      }
    });

    const averageSteps = totalSteps / dailyData.length;
    const averageDistance = totalDistance / dailyData.length;

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

    suggestionsText += `\nYou have been active on ${activeDays} days this month. Try to maintain a consistent activity level.\n`;

    setSuggestions(suggestionsText);
  };

  const fetchPredictions = async (monthlyData, token) => {
    try {
      console.log('Token in fetchPredictions function:', token); // Logging the token
      const response = await axios.post(
        'http://localhost:8000/predict',
        { monthlyData }, // Data payload
        {
          headers: {
            'x-token': token, // Correctly place headers here
          },
        },
      );

      if (response.status === 200) {
        console.log('Predictions received:', response.data); // Log predictions data
        setPredictions(response.data.predictions);
        generateInsights(response.data.predictions); // Generate insights based on predictions
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
        setXToken(storedToken);
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
        setError('Error fetching analytics data');
      }
    };

    fetchData();
  }, [xToken]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Activity Analytics</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {dataFetched && (
        <>
          <h3>Daily Activity Data</h3>
          <Line data={dailyChartData} style={{ marginBottom: '20px' }} />

          <h3>Monthly Activity Data</h3>
          <Line data={monthlyChartData} style={{ marginBottom: '20px' }} />

          <h3>Suggestions and Goals</h3>
          <p style={{ marginBottom: '20px' }}>{suggestions}</p>

          {insights && (
            <div
              style={{
                marginTop: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
              }}
            >
              <h3>Predictions and Insights</h3>
              <p>{insights}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
