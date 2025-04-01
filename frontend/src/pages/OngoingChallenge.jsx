import React, { useState, useEffect, useContext } from 'react';
import { useChallenges } from './ChallengesContext';
import { store } from '../App';
import './OngoingChallenge.css'; // Ensure this file contains CSS for time indicators

const OngoingChallenge = () => {
  const { ongoingChallenges, fetchOngoingChallenges } = useChallenges();
  const [xtoken] = useContext(store);

  useEffect(() => {
    if (xtoken) {
      fetchOngoingChallenges(xtoken);
      console.log('on going challenges', ongoingChallenges);
    }
  }, [xtoken, fetchOngoingChallenges]);

  const getChallengeStatus = status => {
    if (status === 'completed') return 'completed';
    return 'ongoing';
  };

  const calculateProgress = progress => {
    const stepProgress = progress.steps || 0;
    const calorieProgress = progress.calories || 0;
    const distanceProgress = progress.distance || 0;

    return Math.max(stepProgress, calorieProgress, distanceProgress);
  };

  // Get the current date in a comparable format
  const today = new Date();

  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  const formatDateUTC = dateString => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      timeZone: 'UTC',
    });
  };

  return (
    <div className="challenges-container">
      <h2
        style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '1.5rem',
        }}
      >
        Challenges
      </h2>
      {ongoingChallenges.length === 0 ? (
        <p className="no-challenges">No challenges</p>
      ) : (
        <div className="challenges-list">
          {ongoingChallenges
            .filter(challengeData => {
              const challenge = challengeData.challenge;
              const deadlineUTC = new Date(challenge.deadline)
                .toISOString()
                .slice(0, 10);
              const todayUTCString = todayUTC.toISOString().slice(0, 10);
              console.log('today UTC String', todayUTCString);
              console.log('Deadline', deadlineUTC);

              console.log('date comparison', deadlineUTC >= todayUTCString);

              return deadlineUTC >= todayUTCString;
            })

            .map((challengeData, index) => {
              const challenge = challengeData.challenge;
              console.log('challenge data', challengeData);
              console.log('challenge', challenge);
              if (!challenge) return null;
              const progressPercentage = calculateProgress(
                challenge.progress.percentage,
              );
              const status = getChallengeStatus(challenge.progress.status);

              return (
                <div
                  key={`${challengeData._id?.toString() || index}`}
                  className={`challenge-card ${status}`}
                >
                  <p>
                    <strong>Status:</strong>{' '}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </p>
                  <p>
                    <strong>Challenged By:</strong>{' '}
                    {challenge.challengedBy.username}
                  </p>
                  <p>
                    <strong>Challenging:</strong>{' '}
                    {challenge.challenging.username}
                  </p>
                  <p>
                    <strong>Steps Target:</strong>{' '}
                    {challenge.targetSteps || 'N/A'}
                  </p>
                  <p>
                    <strong>Calories Target:</strong>{' '}
                    {challenge.targetCalories || 'N/A'}
                  </p>
                  <p>
                    <strong>Distance Target:</strong>{' '}
                    {challenge.targetDistance || 'N/A'}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{' '}
                    {formatDateUTC(challenge.deadline)}
                  </p>
                  <p>
                    <strong>Start Date:</strong>{' '}
                    {formatDateUTC(challenge.startDate)}
                  </p>
                  <div
                    className={`progress-bar ${
                      status === 'completed' ? 'completed' : ''
                    }`}
                    style={{
                      width:
                        progressPercentage === 0
                          ? '5%'
                          : `${Math.min(progressPercentage, 100)}%`,
                    }}
                  >
                    <span className="progress-text">
                      {status === 'completed'
                        ? '100%'
                        : `${Math.round(progressPercentage)}%`}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default OngoingChallenge;
