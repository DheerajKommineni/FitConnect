import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { store } from '../App';
import './DisplayCommunities.css'; // Import CSS for styling

const DisplayCommunities = () => {
  const [communities, setCommunities] = useState([]); // Initialize as an empty array
  const [xToken] = useContext(store);
  const [currentUserId, setCurrentUserId] = useState(null); // Add state for userId
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:8000/communities', {
        headers: {
          'x-token': xToken,
        },
      })
      .then(res => {
        if (res.data.communities) {
          setCommunities(res.data.communities);
        } else {
          setCommunities([]); // Ensure it's always an array
        }
        setCurrentUserId(res.data.userId);
      })
      .catch(err => console.log(err));
  }, [xToken]);

  const handleJoinCommunity = async communityId => {
    const confirmation = window.confirm(
      'Are you sure you want to join this community?',
    );
    if (confirmation) {
      try {
        await axios.post(
          `http://localhost:8000/join-community/${communityId}`,
          {},
          {
            headers: {
              'x-token': xToken,
            },
          },
        );
        // Redirect to community details page after joining
        navigate(`/dashboard/community-details/${communityId}`);
      } catch (error) {
        console.error('Error joining community', error);
      }
    }
  };

  return (
    <div className="communities-container">
      <h3>Communities</h3>
      {communities.length > 0 ? (
        communities.map(community => (
          <div
            key={community._id}
            className="community-card"
            onClick={() =>
              navigate(`/dashboard/community-details/${community._id}`)
            }
          >
            <div className="community-info">
              <h4>{community.name}</h4>
              <p>{community.description}</p>
            </div>
            {community.participants.some(
              participant => participant.userId === currentUserId,
            ) || community.creatorId._id === currentUserId ? (
              <p className="member-indication">Member</p>
            ) : (
              <button
                className="join-btn"
                onClick={e => {
                  e.stopPropagation(); // Prevent the click event from bubbling up to the card
                  handleJoinCommunity(community._id);
                }}
              >
                Join
              </button>
            )}
          </div>
        ))
      ) : (
        <p>No communities available.</p>
      )}
    </div>
  );
};

export default DisplayCommunities;
