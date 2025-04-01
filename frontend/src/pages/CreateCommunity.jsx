import React, { useState, useEffect, useContext } from 'react';
import { store } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateCommunity.css'; // Import CSS for styling

const CreateCommunity = () => {
  const [xToken, setXToken] = useContext(store);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user's friends to add as participants
    axios
      .get('http://localhost:8000/friends', {
        headers: {
          'x-token': xToken,
        },
      })
      .then(res => setFriends(res.data.friends))
      .catch(err => console.error(err));
  }, [xToken]);

  const handleCreateCommunity = () => {
    axios
      .post(
        'http://localhost:8000/create-community',
        {
          name,
          description,
          participants: selectedFriends,
        },
        {
          headers: {
            'x-token': xToken,
          },
        },
      )
      .then(res => {
        console.log('Community created', res.data);
        navigate('/dashboard');
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="create-community-container">
      <div className="create-community-card">
        <h2 className="create-community-title">Create Community</h2>
        <input
          className="create-community-input"
          type="text"
          placeholder="Community Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <textarea
          className="create-community-textarea"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <h3 className="create-community-subtitle">Add Participants</h3>
        <div className="create-community-friend-list">
          {friends.map(friend => (
            <div
              key={friend.userId._id}
              className="create-community-friend-item"
            >
              <input
                type="checkbox"
                value={friend.userId._id}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedFriends([...selectedFriends, friend]);
                  } else {
                    setSelectedFriends(
                      selectedFriends.filter(
                        f => f.userId._id !== friend.userId._id,
                      ),
                    );
                  }
                }}
              />
              {friend.username}
            </div>
          ))}
        </div>
        <button
          className="create-community-button"
          onClick={handleCreateCommunity}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default CreateCommunity;
