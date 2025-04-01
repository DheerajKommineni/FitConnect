import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import './Leaderboard.css';

const Leaderboard = ({ communityId }) => {
  const [xToken] = useContext(store);
  const [participants, setParticipants] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/community/${communityId}/leaderboard`,
          {
            headers: {
              'x-token': xToken,
            },
          },
        );

        const { participants, currentUserId, currentUsername } = response.data;

        setParticipants(participants);
        setCurrentUserId(currentUserId);
        setCurrentUsername(currentUsername);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      }
    };

    fetchLeaderboard();
  }, [xToken, communityId]);

  // Sort participants by total points
  const sortedParticipants = [...participants].sort(
    (a, b) => b.points - a.points,
  );

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-header">Leaderboard</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Badges</th>
            <th>Total Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedParticipants.map((participant, index) => (
            <tr key={participant.userId}>
              <td>{index + 1}</td>
              <td>
                {participant.username || 'Unknown User'}
                {participant.userId === currentUserId ? ' (You)' : ''}
              </td>
              <td>
                <div className="badge-count">
                  <span className="badge bronze">
                    <FontAwesomeIcon
                      icon={faMedal}
                      style={{ color: '#cd7f32' }} // Bronze color
                    />
                    {participant.bronze || 0}
                  </span>
                  <span className="badge silver">
                    <FontAwesomeIcon
                      icon={faMedal}
                      style={{ color: '#c0c0c0' }} // Silver color
                    />
                    {participant.silver || 0}
                  </span>
                  <span className="badge gold">
                    <FontAwesomeIcon
                      icon={faMedal}
                      style={{ color: '#ffd700' }} // Gold color
                    />
                    {participant.gold || 0}
                  </span>
                </div>
              </td>
              <td>{participant.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
