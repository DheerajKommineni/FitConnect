import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { store } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import './SetGoal.css';

const SetGoal = ({ communityId, onGoalSet }) => {
  const [target, setTarget] = useState('');
  const [goalType, setGoalType] = useState('steps');
  const [xToken] = useContext(store);
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [badgeType, setBadgeType] = useState('Bronze');
  const [reward, setReward] = useState('Exclusive badges');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const badgePoints = {
    Bronze: 1,
    Silver: 2,
    Gold: 3,
  };

  const badgeIcons = {
    Bronze: <FontAwesomeIcon icon={faMedal} style={{ color: 'saddlebrown' }} />,
    Silver: <FontAwesomeIcon icon={faMedal} style={{ color: 'silver' }} />,
    Gold: <FontAwesomeIcon icon={faMedal} style={{ color: 'gold' }} />,
  };

  const handleGoalSubmit = async e => {
    e.preventDefault();

    if (!target || !deadline || !startDate) {
      setError('Please fill in all fields.');
      return;
    }

    const goalData = {
      target: parseInt(target),
      goalType,
      deadline,
      startDate,
      badgeType,
      badgePoints: badgePoints[badgeType],
      reward,
    };

    try {
      await axios.post(
        `http://localhost:8000/api/community/${communityId}/set-goal`,
        goalData,
        {
          headers: {
            'x-token': xToken,
          },
        },
      );
      alert('Community Goal is set successfully');
      onGoalSet();
      navigate(`/dashboard/community-details/${communityId}`);
    } catch (err) {
      console.error(err);
      setError('Error setting the goal. Please try again.');
    }
  };

  return (
    <div className="set-goal-container">
      <h2>Set a Community Goal</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleGoalSubmit}>
        <div>
          <label>Goal Type:</label>
          <select value={goalType} onChange={e => setGoalType(e.target.value)}>
            <option value="steps">Steps</option>
            <option value="distance">Distance</option>
            <option value="calories">Calories</option>
            <option value="heartPoints">Heart Points</option>
          </select>
        </div>

        <div>
          <label>Target Amount:</label>
          <input
            type="number"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Enter the target amount (e.g., 100000 steps)"
          />
        </div>

        <div>
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label>Deadline:</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        </div>

        <div>
          <label>Badge Type:</label>
          <select
            value={badgeType}
            onChange={e => setBadgeType(e.target.value)}
          >
            <option value="Bronze">Bronze (1 point)</option>
            <option value="Silver">Silver (2 points)</option>
            <option value="Gold">Gold (3 points)</option>
          </select>
          <div className="badge-preview">
            {badgeIcons[badgeType]} {badgeType} Badge
          </div>
        </div>

        <div>
          <label>Reward:</label>
          <input
            type="text"
            value={reward}
            onChange={e => setReward(e.target.value)}
            placeholder="Enter the reward (e.g., badges)"
            disabled={true}
          />
        </div>

        <button type="submit">Set Goal</button>
      </form>
    </div>
  );
};

export default SetGoal;
