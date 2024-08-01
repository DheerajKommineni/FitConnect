import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../App';
import axios from 'axios';

const Activity = () => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: '',
    steps: '',
    distance: '',
  });
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [xToken, setXToken] = useContext(store);
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const fetchFitData = async token => {
    try {
      const response = await axios.get('http://localhost:8000/activity', {
        headers: {
          'x-token': token,
        },
        withCredentials: true,
      });

      const { userId, dailyData, monthlyData, ...fitnessData } = response.data;
      setFormData(prevData => ({
        ...prevData,
        ...fitnessData,
      }));
      setDailyData(dailyData);
      setMonthlyData(monthlyData);
      setDataFetched(true);
      setUserId(userId);

      // Check if all fields have valid data
      const allValid = Object.values(fitnessData).every(
        value => value !== undefined && value !== '' && value !== null,
      );
      setIsFormComplete(allValid);
    } catch (error) {
      console.error('Error fetching fitness data:', error);
      setError('Error fetching fitness data');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const receivedAccessToken = urlParams.get('access_token');

      if (!xToken) {
        const storedToken = localStorage.getItem('x-token');
        if (storedToken) {
          setXToken(storedToken);
        } else {
          console.error('No x-token found in localStorage');
          return;
        }
      }

      if (receivedAccessToken) {
        setAccessToken(receivedAccessToken);
      }

      if (code) {
        try {
          await axios.get(
            `http://localhost:8000/google-auth/callback?x-token=${encodeURIComponent(
              xToken,
            )}&code=${encodeURIComponent(code)}`,
          );
        } catch (error) {
          console.error('Error during OAuth callback:', error);
          setError('Error during OAuth callback');
          return;
        }
      }

      if (xToken) {
        try {
          await fetchFitData(xToken);
        } catch (error) {
          console.error('Error fetching fitness data:', error);
          setError('Error fetching fitness data');
        }
      }
    };

    fetchData();
  }, [xToken]);

  const handleSyncWithWearable = async () => {
    try {
      const { data } = await axios.get('http://localhost:8000/google-auth', {
        headers: {
          'x-token': xToken,
        },
      });
      localStorage.setItem('x-token', xToken);
      window.open(data.authUrl, '_self');
    } catch (error) {
      console.error('Error initiating sync with wearable:', error);
      setError('Error initiating sync with wearable');
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    setIsFormComplete(
      Object.values({ ...formData, [name]: value }).every(
        value => value !== '' && value !== null,
      ),
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { age, weight, height, gender, steps, distance } = formData;

      await axios.post(
        'http://localhost:8000/save-fitness-data',
        {
          userId,
          age,
          weight,
          height,
          gender,
          sixMonthsSteps: steps,
          sixMonthsDistance: distance,
        },
        {
          headers: {
            'x-token': xToken,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      alert('Fitness data saved successfully');
      fetchFitData(xToken);
      setEditing(false);
    } catch (error) {
      console.error('Error saving fitness data:', error);
      setError('Error saving fitness data');
    }
  };

  const getCurrentMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (July is 6)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      dates.push(dateString);
    }
    return dates;
  };

  const fillMissingDailyData = dailyData => {
    const fullDailyData = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 0-indexed (July is 6, +1 to get correct month)
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month}-${day.toString().padStart(2, '0')}`;
      const existingData = dailyData.find(data => data.date === date);
      // console.log('Date', date);
      // console.log('Existing Data', existingData);

      if (existingData) {
        fullDailyData.push(existingData);
      } else {
        fullDailyData.push({ date, steps: 0, distance: 0 });
      }
    }
    // console.log(fullDailyData);
    return fullDailyData;
  };

  const renderField = (name, label, type = 'text') => {
    const value = formData[name] || '';
    const isInputVisible = editing;

    return (
      <div key={name}>
        <label>
          {label}:
          {isInputVisible ? (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={`Enter ${label}`}
            />
          ) : (
            <span>{value}</span>
          )}
        </label>
      </div>
    );
  };

  const filledDailyData = fillMissingDailyData(dailyData);
  console.log('Filled Daily Data', filledDailyData);

  return (
    <div>
      <h2>My Activity</h2>
      <button onClick={handleSyncWithWearable}>Sync with Wearable</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {renderField('age', 'Age', 'number')}
        {renderField('weight', 'Weight', 'number')}
        {renderField('height', 'Height', 'number')}
        {renderField('gender', 'Gender')}
        {renderField('steps', 'Steps', 'number')}
        {renderField('distance', 'Distance', 'number')}

        <h3>Daily Data</h3>
        {filledDailyData.map((data, index) => (
          <div key={index}>
            <p>Date: {data.date}</p>
            <p>Steps: {data.steps}</p>
            <p>Distance: {data.distance} m</p>
          </div>
        ))}

        <h3>Monthly Data</h3>
        {monthlyData.map((monthData, index) => (
          <div key={index}>
            <p>
              Month: {monthData.month} - Steps: {monthData.steps}, Distance:{' '}
              {monthData.distance} m
            </p>
          </div>
        ))}

        {editing && (
          <button type="submit" disabled={!isFormComplete}>
            Save
          </button>
        )}
      </form>
      {!editing && dataFetched && !isFormComplete && (
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
      )}

      <button onClick={() => navigate('/analytics')}>Go to Analytics</button>
    </div>
  );
};

export default Activity;
