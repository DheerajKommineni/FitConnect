// WORKING CODE

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import googleFitIcon from '../assets/Google-Fit.webp';
import { store } from '../App';
import axios from 'axios';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  toDate,
} from 'date-fns';
import Chart from 'chart.js/auto'; // Import Chart.js
import './Activity.css';

const Activity = () => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: '',
    steps: '',
    distance: '',
    caloriesExpended: '',
    heartRate: '',
    moveMinutes: '',
    sleep: '',
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
  const [isFullCalendar, setIsFullCalendar] = useState(false);
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const fetchFitData = async token => {
    try {
      const response = await axios.get('http://localhost:8000/api/activity', {
        headers: {
          'x-token': token,
        },
        withCredentials: true,
      });

      const {
        userId,
        dailyData,
        monthlyData,
        totalSteps,
        totalDistance,
        totalCalories,
        totalHeartRate,
        totalMoveMinutes,
        totalHeartPoints,
        ...fitnessData
      } = response.data;

      setFormData(prevData => ({
        ...prevData,
        ...fitnessData,
        steps: totalSteps,
        distance: totalDistance,
        caloriesExpended: totalCalories,
        heartRate: totalHeartRate,
        moveMinutes: totalMoveMinutes,
        heartPoints: totalHeartPoints,
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
      const { age, weight, height, gender } = formData;

      const dataToSend = {
        userId,
        age,
        weight,
        height,
        gender,
      };

      await axios.post(
        'http://localhost:8000/update-fitness-info',
        dataToSend,
        {
          headers: {
            'x-token': xToken,
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      alert('Fitness info updated successfully');
      fetchFitData(xToken); // Refresh data if needed
      setEditing(false);
    } catch (error) {
      console.error('Error saving fitness info:', error);
      setError('Error saving fitness info');
    }
  };

  const renderField = (name, label, type = 'text') => {
    const value = formData[name] || '';
    const isInputVisible = editing;

    return (
      <div key={name} style={{ marginBottom: '10px' }}>
        <label
          style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}
        >
          {label}:
        </label>
        {isInputVisible ? (
          name === 'gender' ? (
            <select
              name={name}
              value={value}
              onChange={handleChange}
              style={{
                width: '200px',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Select Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={`Enter ${label}`}
              style={{
                width: '200px',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
          )
        ) : (
          <div
            style={{
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              backgroundColor: '#f8f9fa',
            }}
          >
            {value}
          </div>
        )}
      </div>
    );
  };

  const renderData = () => {
    return (
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-wrapper">
          <div className="form-grid-2x4">
            <div className="form-grid-item">
              {renderField('age', 'Age', 'number')}
            </div>
            <div className="form-grid-item">
              {renderField('weight', 'Weight (kg)', 'number')}
            </div>
            <div className="form-grid-item">
              {renderField('height', 'Height (ft)', 'number')}
            </div>
            <div className="form-grid-item">
              {renderField('gender', 'Gender')}
            </div>

            {/* Conditional Rendering for Fitness Data */}
            {formData.steps && (
              <div className="form-grid-item">
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Total Steps till date
                </label>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {formData.steps}
                </div>
              </div>
            )}

            {formData.distance && (
              <div className="form-grid-item">
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Total Distance till date
                </label>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {formData.distance}
                </div>
              </div>
            )}

            {formData.heartRate && (
              <div className="form-grid-item">
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Average Heart Rate
                </label>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {formData.heartRate}
                </div>
              </div>
            )}

            {formData.heartPoints && (
              <div className="form-grid-item">
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '5px',
                  }}
                >
                  Total Heart Points
                </label>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {formData.heartPoints}
                </div>
              </div>
            )}
          </div>

          {/* Buttons for Save, Cancel, and Edit */}
          {editing ? (
            <div className="button-group">
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginLeft: '10px',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}
        </div>
      </form>
    );
  };
  const renderCalendarView = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });

    const adjustToLocalDate = isoString => {
      const date = new Date(isoString);
      const localDate = new Date(
        date.getTime() + date.getTimezoneOffset() * 60000,
      );
      return localDate;
    };

    return (
      <div className="calendar-container">
        <h2>Daily Activity</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '5px',
            textAlign: 'center',
          }}
        >
          {days.map(day => {
            const formattedDate = format(day, 'd'); // Format day number
            const dailyRecord = dailyData.find(
              record =>
                format(adjustToLocalDate(record.date), 'd-M-yyyy') ===
                format(day, 'd-M-yyyy'),
            );

            return (
              <div
                key={day}
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  backgroundColor: dailyRecord ? '#e3f2fd' : '#fff',
                }}
              >
                <strong>{formattedDate}</strong>
                <div>
                  {dailyRecord ? (
                    <>
                      <div>Steps: {dailyRecord.steps}</div>
                      <div>Distance: {dailyRecord.distance} m</div>
                    </>
                  ) : (
                    <div>No Data</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Monthly Data Chart
  const renderMonthlyDataChart = () => {
    if (!monthlyData || !monthlyData.length) {
      return null;
    }

    const ctx = chartRef.current?.getContext('2d');

    if (ctx) {
      // Destroy existing chart instance if it exists
      if (ctx.chart) {
        ctx.chart.destroy();
      }

      ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthlyData.map(data => data.month), // Update based on your data structure
          datasets: [
            {
              label: 'Monthly Steps',
              data: monthlyData.map(data => data.steps),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
            {
              label: 'Monthly Distance',
              data: monthlyData.map(data => data.distance),
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += `${context.parsed.y}`;
                  }
                  return label;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  };

  useEffect(() => {
    if (dataFetched) {
      renderMonthlyDataChart();
    }
  }, [dataFetched, monthlyData]);

  // const handleLogout = () => {
  //   localStorage.removeItem('x-token');
  //   setXToken(null);
  //   navigate('/login');
  // };

  return (
    <div>
      <h1>My Activity</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* <button
        onClick={handleSyncWithWearable}
        style={{
          display: 'block',
          margin: '0 auto',
          padding: '10px 20px',
          fontSize: '16px',
          color: '#fff',
          backgroundColor: '#2d98da',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.3s ease',
        }}
      >
        Sync with Google Fit
      </button> */}
      <div className="activity-container">
        <div
          onClick={handleSyncWithWearable}
          className="sync-button-large"
          role="button"
          tabIndex="0"
          onKeyDown={e => e.key === 'Enter' && handleSyncWithWearable()}
        >
          <img
            src={googleFitIcon}
            alt="Google Fit"
            className="google-fit-image"
          />
          <span className="sync-text-large">Sync with Wearable</span>
        </div>

        <div className="full-width" style={{ marginTop: '40px' }}>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {renderData()}

          {dailyData.length > 0 && (
            <div className="calendar-container full-width">
              {renderCalendarView()}
            </div>
          )}

          {monthlyData.length > 0 && (
            <div className="monthly-chart-container full-width">
              <h2>Monthly Activity</h2>
              <canvas
                ref={chartRef}
                id="monthlyDataChart"
                width="400"
                height="200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity;
