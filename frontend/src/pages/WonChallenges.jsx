import React, { useEffect, useContext } from 'react';
import { useChallenges } from './ChallengesContext';
import { store } from '../App';
import './Challenges.css'; // Assuming you have a CSS file for styling

const WonChallenges = () => {
  const { wonChallenges, fetchWonChallenges } = useChallenges();
  const [xtoken] = useContext(store);

  useEffect(() => {
    if (xtoken) {
      fetchWonChallenges(xtoken); // Fetch won challenges on component mount
    }
  }, [xtoken, fetchWonChallenges]);

  return (
    <div className="challenges-container">
      <h2
        style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '1.5rem',
        }}
      >
        Won Challenges
      </h2>
      {wonChallenges.length === 0 ? (
        <p className="no-challenges">You haven't won any challenges yet.</p>
      ) : (
        <div className="challenges-list">
          {wonChallenges.map((challenge, index) => (
            <div key={index} className="challenge-card won">
              <div className="challenge-info">
                <h3>Challenge Details</h3>
                <p>
                  <strong>Challenged By:</strong>{' '}
                  {challenge.challengedByUsername}
                </p>
                <p>
                  <strong>Challenging:</strong> {challenge.challengingUsername}
                </p>
                <p>
                  <strong>Won On:</strong>{' '}
                  {new Date(challenge.deadline).toLocaleDateString()}
                </p>
                <p>
                  <strong>Steps Target:</strong> {challenge.targetSteps}
                </p>
                <p>
                  <strong>Calories Target:</strong> {challenge.targetCalories}
                </p>
                <p>
                  <strong>Distance Target:</strong> {challenge.targetDistance}{' '}
                  meters
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WonChallenges;
