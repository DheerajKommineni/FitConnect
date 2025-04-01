import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './ViewGoals.css';

const ViewGoals = ({ communityId }) => {
  const [xToken] = useContext(store);
  const [goal, setGoal] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [error, setError] = useState(null);

  const badgeIcons = {
    Bronze: <FontAwesomeIcon icon={faMedal} style={{ color: 'saddlebrown' }} />,
    Silver: <FontAwesomeIcon icon={faMedal} style={{ color: 'silver' }} />,
    Gold: <FontAwesomeIcon icon={faMedal} style={{ color: 'gold' }} />,
  };

  // New tick icon for participants who exceed the goal
  const checkIcon = (
    <FontAwesomeIcon
      icon={faCheckCircle}
      style={{ color: 'green', marginLeft: '8px' }}
    />
  );

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/community/${communityId}/goals`,
          {
            headers: {
              'x-token': xToken,
            },
          },
        );
        const {
          goal,
          participants,
          currentParticipant,
          currentUsername,
          currentUserId,
        } = response.data;

        setGoal(goal);
        setParticipants(participants);
        setCurrentParticipant(currentParticipant);
        setCurrentUsername(currentUsername);
        setCurrentUserId(currentUserId);
      } catch (err) {
        if (err.response && err.response.status !== 404) {
          console.error(err);
        }
      }
    };

    fetchGoals();
  }, [xToken, communityId]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Check if goal is not set
  if (!goal || goal.target === 0) {
    return <div>There are no goals added yet.</div>;
  } else {
    return (
      <div className="view-goals-container">
        <h2 className="header-main">Community Goal</h2>
        <div className="goal-details">
          <h3 className="header-secondary">
            Target: {goal.target} {goal.goalType}
          </h3>
          <h4 className="header-tertiary">
            Start Date:{' '}
            {new Date(goal.startDate).toLocaleDateString(undefined, {
              timeZone: 'UTC',
            })}
          </h4>
          <h4 className="header-tertiary">
            Deadline:{' '}
            {new Date(goal.deadline).toLocaleDateString(undefined, {
              timeZone: 'UTC',
            })}
          </h4>
          <p className="text-paragraph">
            Status: {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </p>
          <h4 className="header-tertiary">Current Progress:</h4>
          <p className="text-paragraph">
            {goal.progressType === 'percentage'
              ? `${goal.progress}%`
              : currentParticipant.progress}{' '}
            / {goal.target} {goal.goalType}
          </p>
        </div>

        <h3 className="header-secondary">Participant Progress</h3>
        <ul className="participant-list">
          {participants
            .filter(participant => participant && participant.username)
            .map(participant => (
              <li
                key={participant.userId}
                className="participant-list-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }} // Ensure proper alignment
              >
                <div>
                  <strong>{participant.username || 'Unknown User'}</strong>:{' '}
                  {participant.progress} / {goal.target} {goal.goalType} (
                  {participant.points} points)
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="badge-icon">
                    {badgeIcons[participant.badgeType]}
                  </span>
                  {participant.progress >= goal.target && checkIcon}
                </div>
              </li>
            ))}
        </ul>
      </div>
    );
  }
};

export default ViewGoals;
