import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './FriendRequests.css';
import { store } from '../App';
import { useNavigate } from 'react-router-dom';
import { FaCommentAlt } from 'react-icons/fa'; // Import only the chat icon

const FriendRequests = ({ onFriendAdded }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [xtoken] = useContext(store); // Removed setXToken as it's not used
  const navigate = useNavigate(); // Added useNavigate hook

  useEffect(() => {
    fetchData();
  }, [xtoken]);

  const fetchData = async () => {
    try {
      const usersResponse = await axios.get('http://localhost:8000/api/users', {
        headers: { 'x-token': xtoken },
      });
      setUsers(usersResponse.data);

      const pendingResponse = await axios.get(
        'http://localhost:8000/api/friends/pending',
        {
          headers: { 'x-token': xtoken },
        },
      );
      setPendingRequests(pendingResponse.data);

      const friendRequestsResponse = await axios.get(
        'http://localhost:8000/api/friends/requests',
        {
          headers: { 'x-token': xtoken },
        },
      );
      setFriendRequests(friendRequestsResponse.data);

      const friendsResponse = await axios.get('http://localhost:8000/friends', {
        headers: { 'x-token': xtoken },
      });
      setFriends(friendsResponse.data.friends);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSendRequest = async userId => {
    try {
      await axios.post(
        `http://localhost:8000/api/friends/request/${userId}`,
        {},
        { headers: { 'x-token': xtoken } },
      );
      setPendingRequests(prev => [
        ...prev,
        { userId, username: users.find(user => user._id === userId).username },
      ]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (userId, username) => {
    try {
      await axios.post(
        `http://localhost:8000/api/friends/accept/${userId}`,
        {},
        { headers: { 'x-token': xtoken } },
      );
      setFriendRequests(prevRequests =>
        prevRequests.filter(request => request.userId !== userId),
      );
      setFriends(prevFriends => [...prevFriends, { userId, username }]);
      onFriendAdded();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleCancelRequest = async userId => {
    try {
      await axios.post(
        `http://localhost:8000/api/friends/cancel/${userId}`,
        {},
        { headers: { 'x-token': xtoken } },
      );
      setFriendRequests(prev =>
        prev.filter(request => request.userId !== userId),
      );
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const getRequestStatus = userId => {
    if (pendingRequests.some(request => request.userId === userId)) {
      return 'Request Sent';
    }
    return '';
  };

  const handleChatClick = friendId => {
    navigate(`/dashboard/chat?friendId=${friendId}`);
  };

  return (
    <div className="friend-requests">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Friends"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <ul className="search-results">
            {users
              .filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map(user => (
                <li key={user._id}>
                  {user.username}
                  {getRequestStatus(user._id) && (
                    <span>{getRequestStatus(user._id)}</span>
                  )}
                  <button onClick={() => handleSendRequest(user._id)}>+</button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="friend-requests">
        <h3>Friend Requests</h3>
        <ul>
          {friendRequests.map(request => (
            <li key={request.userId}>
              {request.username}
              <button
                onClick={() =>
                  handleAcceptRequest(request.userId, request.username)
                }
              >
                ✔
              </button>
              <button
                className="cancel"
                onClick={() => handleCancelRequest(request.userId)}
              >
                ✖
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="friends">
        <h3>Friends</h3>
        <ul>
          {friends.map(friend => (
            <li key={friend.userId._id} className="friend-item">
              {friend.username}
              <div className="friend-icons">
                <FaCommentAlt
                  onClick={() => handleChatClick(friend.userId._id)}
                  className="chat-icon"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FriendRequests;
