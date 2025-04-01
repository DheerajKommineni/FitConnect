import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import './IncomingChallenge.css';
import { useChallenges } from './ChallengesContext';

const IncomingChallenge = () => {
  const [xtoken] = useContext(store);
  const {
    incomingChallenges,
    setIncomingChallenges,
    fetchIncomingChallenges,
    fetchOngoingChallenges,
  } = useChallenges();

  useEffect(() => {
    if (xtoken) {
      fetchIncomingChallenges(xtoken);
    }
  }, [xtoken, fetchIncomingChallenges]);

  const handleResponse = async (challengedBy, action) => {
    try {
      await axios.post(
        'http://localhost:8000/respond-challenge',
        {
          challengedBy,
          action,
        },
        {
          headers: { 'x-token': xtoken },
        },
      );

      alert(`Challenge ${action}ed successfully!`);

      // Update incoming challenges after response
      const updatedChallenges = incomingChallenges.filter(
        c => c.challengedBy.userId !== challengedBy,
      );
      setIncomingChallenges(updatedChallenges);

      // Fetch ongoing challenges only if the challenge is accepted
      if (action === 'accept') {
        await fetchOngoingChallenges(xtoken);
      }
    } catch (error) {
      console.error(`Error ${action}ing challenge:`, error);
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      timeZone: 'UTC',
    });
  };

  return (
    <div className="incoming-challenges-container">
      <h2 className="incoming-challenges-title">Incoming Challenges</h2>
      {incomingChallenges.length === 0 ? (
        <p className="no-incoming-challenges">No incoming challenges</p>
      ) : (
        <div className="incoming-challenges-list">
          {incomingChallenges.map(challenge => (
            <div key={challenge._id} className="challenge-card">
              <p className="challenge-header">
                <strong>{challenge.challengedBy.username}</strong> has
                challenged you.
              </p>
              <p>
                <strong>Target Steps:</strong> {challenge.targetSteps}
              </p>
              <p>
                <strong>Target Distance:</strong> {challenge.targetDistance}{' '}
                meters
              </p>
              <p>
                <strong>Target Calories:</strong> {challenge.targetCalories}
              </p>
              <p>
                <strong>Deadline:</strong> {formatDate(challenge.deadline)}
              </p>
              <div className="challenge-actions">
                <button
                  className="accept-button"
                  onClick={() =>
                    handleResponse(challenge.challengedBy.userId, 'accept')
                  }
                >
                  Accept
                </button>
                <button
                  className="reject-button"
                  onClick={() =>
                    handleResponse(challenge.challengedBy.userId, 'reject')
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomingChallenge;
