import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import './Challenge.css'; // Import the CSS file

const Challenge = () => {
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [challengeForm, setChallengeForm] = useState({
    targetSteps: '',
    targetCalories: '',
    targetDistance: '',
    deadline: '',
  });
  const [checkboxes, setCheckboxes] = useState({
    targetSteps: false,
    targetCalories: false,
    targetDistance: false,
  });
  const [xtoken, setXToken] = useContext(store);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get('http://localhost:8000/friends', {
          headers: {
            'x-token': xtoken,
          },
        });
        setCurrentUser(response.data.currentUser);
        setFriends(response.data.friends);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, [xtoken]);

  const handleChallengeClick = friendId => {
    setSelectedFriend(friendId);
  };

  const handleCheckboxChange = e => {
    const { name, checked } = e.target;
    setCheckboxes(prevCheckboxes => ({
      ...prevCheckboxes,
      [name]: checked,
    }));
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setChallengeForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmitChallenge = async () => {
    if (
      !challengeForm.deadline ||
      (!challengeForm.targetSteps &&
        !challengeForm.targetCalories &&
        !challengeForm.targetDistance)
    ) {
      alert('Please fill out the form correctly.');
      return;
    }

    try {
      await axios.post(
        'http://localhost:8000/challenge',
        {
          challenging: selectedFriend,
          ...challengeForm,
        },
        {
          headers: {
            'x-token': xtoken,
          },
        },
      );
      alert('Challenge sent successfully!');
      closeChallengeModal();
    } catch (error) {
      console.error('Error sending challenge:', error);
    }
  };

  const closeChallengeModal = () => {
    setSelectedFriend(null);
    setChallengeForm({
      targetSteps: '',
      targetCalories: '',
      targetDistance: '',
      deadline: '',
    });
    setCheckboxes({
      targetSteps: false,
      targetCalories: false,
      targetDistance: false,
    });
  };

  const handleOutsideClick = e => {
    // If the clicked element is the background modal, close the modal
    if (e.target.classList.contains('challenge-modal')) {
      closeChallengeModal();
    }
  };

  return (
    <div className="challenge-container">
      <h1>Challenge Your Friends</h1>
      {/* <p className="ranking-description">
        <strong>Ranking based on Heart Points:</strong>
      </p> */}
      <ul className="friends-list">
        {currentUser && (
          <li className="friend-item">
            <span className="friend-name">{currentUser.username} (You)</span>
            <span className="heart-points">
              Heart Points: {currentUser.heartPoints}
            </span>
          </li>
        )}

        {friends
          .sort((a, b) => b.totalHeartPoints - a.totalHeartPoints)
          .map((friend, index) => (
            <li className="friend-item" key={`${friend.userId}-${index}`}>
              <span className="friend-name">{friend.username}</span>
              <span className="heart-points">{friend.totalHeartPoints}</span>
              {friend.username !== currentUser.username && (
                <button
                  className="challenge-button"
                  onClick={() => handleChallengeClick(friend.userId)}
                >
                  Challenge
                </button>
              )}
            </li>
          ))}
      </ul>

      {selectedFriend && (
        <div className="challenge-modal" onClick={handleOutsideClick}>
          <div className="challenge-form">
            <button className="close-button" onClick={closeChallengeModal}>
              &times;
            </button>
            <h2>Challenge Form</h2>
            <form>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="targetSteps"
                    checked={checkboxes.targetSteps}
                    onChange={handleCheckboxChange}
                  />
                  Steps
                </label>
                {checkboxes.targetSteps && (
                  <input
                    type="number"
                    name="targetSteps"
                    value={challengeForm.targetSteps}
                    onChange={handleFormChange}
                    placeholder="Enter steps target"
                  />
                )}
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="targetCalories"
                    checked={checkboxes.targetCalories}
                    onChange={handleCheckboxChange}
                  />
                  Calories
                </label>
                {checkboxes.targetCalories && (
                  <input
                    type="number"
                    name="targetCalories"
                    value={challengeForm.targetCalories}
                    onChange={handleFormChange}
                    placeholder="Enter calories target"
                  />
                )}
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="targetDistance"
                    checked={checkboxes.targetDistance}
                    onChange={handleCheckboxChange}
                  />
                  Distance
                </label>
                {checkboxes.targetDistance && (
                  <input
                    type="number"
                    name="targetDistance"
                    value={challengeForm.targetDistance}
                    onChange={handleFormChange}
                    placeholder="Enter distance target"
                  />
                )}
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={challengeForm.deadline}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <button
                type="button"
                className="submit-button"
                onClick={handleSubmitChallenge}
              >
                Submit Challenge
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenge;
