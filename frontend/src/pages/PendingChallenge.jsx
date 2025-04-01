import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import moment from 'moment-timezone';

const PendingChallenge = () => {
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [xtoken] = useContext(store);

  useEffect(() => {
    const fetchPendingChallenges = async () => {
      try {
        const response = await axios.get(
          'http://localhost:8000/pending-challenges',
          {
            headers: { 'x-token': xtoken },
          },
        );
        setPendingChallenges(response.data || []);
      } catch (error) {
        console.error('Error fetching pending challenges:', error);
        setPendingChallenges([]);
      }
    };

    fetchPendingChallenges();
  }, [xtoken]);

  const formatDate = dateString => {
    return dateString.substring(0, 10);
  };

  return (
    <div>
      <h2>Pending Challenges</h2>
      {pendingChallenges && pendingChallenges.length === 0 && (
        <p>No pending challenges</p>
      )}
      {pendingChallenges &&
        pendingChallenges.length > 0 &&
        pendingChallenges.map(challenge => (
          <div key={challenge._id}>
            <p>
              You have challenged{' '}
              <strong>{challenge.challenging.username}</strong>.
            </p>
            <p>Target Steps: {challenge.targetSteps}</p>
            <p>Target Distance: {challenge.targetDistance} meters</p>
            <p>Target Calories: {challenge.targetCalories}</p>
            <p>Deadline: {formatDate(challenge.deadline)}</p>
          </div>
        ))}
    </div>
  );
};

export default PendingChallenge;
