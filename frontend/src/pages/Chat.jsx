import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { store } from '../App';
import axios from 'axios';
import './Chat.css';

const initializeSocket = xToken => {
  return io('http://localhost:8000', {
    withCredentials: true,
    extraHeaders: {
      'x-token': xToken,
    },
  });
};

const Chat = () => {
  const [xToken, setXToken] = useContext(store);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendUserName, setFriendUserName] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const friendId = queryParams.get('friendId');
  const socketRef = useRef(null);
  const endOfMessagesRef = useRef(null); // Reference for the end of messages

  useEffect(() => {
    if (xToken) {
      socketRef.current = initializeSocket(xToken);
      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('message', message => {
        console.log('Received message:', message);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            senderUsername: message.senderUsername || 'Unknown',
            text: message.text || '',
          },
        ]);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [xToken]);

  useEffect(() => {
    const fetchFriendsData = async () => {
      if (friendId && xToken) {
        try {
          const friendsResponse = await axios.get(
            'http://localhost:8000/friends',
            {
              headers: { 'x-token': xToken },
            },
          );

          const friendsList = friendsResponse.data.friends;
          setFriends(friendsList);

          const friend = friendsList.find(
            friend => friend.userId._id === friendId,
          );

          if (friend) {
            setFriendUserName(friend.username);
          } else {
            console.log('No matching friend found');
          }

          setCurrentUserId(friendsResponse.data.currentUser.userId);
          setCurrentUserName(friendsResponse.data.currentUser.username);

          const chatHistoryResponse = await fetch(
            `http://localhost:8000/api/chat-history?friendId=${friendId}`,
            {
              headers: {
                'x-token': xToken,
              },
            },
          );

          const contentType = chatHistoryResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const chatHistoryData = await chatHistoryResponse.json();
            setMessages(chatHistoryData);
          } else {
            const text = await chatHistoryResponse.text();
            console.error(
              'Expected JSON but received HTML or other content:',
              text,
            );
          }
        } catch (error) {
          console.error('Error fetching data:', error.message);
        }
      } else {
        console.log('No friendId or xToken available');
      }
    };

    fetchFriendsData();
  }, [friendId, xToken]);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    try {
      if (socketRef.current && newMessage.trim() !== '') {
        console.log('Emitting message:', {
          userId: currentUserId,
          friendId,
          content: newMessage,
        });

        socketRef.current.emit('message', {
          userId: currentUserId,
          friendId,
          content: newMessage,
        });

        setMessages(prevMessages => [
          ...prevMessages,
          {
            senderUsername: currentUserName,
            text: newMessage,
          },
        ]);

        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!friendId) {
    return (
      <div className="chat-error">
        Error: friendId is missing from the query parameters.
      </div>
    );
  }

  return (
    <div className="chat-container">
      <h3 className="chat-header">Chat with {friendUserName}</h3>
      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${
                msg.senderUsername === currentUserName
                  ? 'chat-message-you'
                  : 'chat-message-friend'
              }`}
            >
              <strong className="chat-message-sender">
                {msg.senderUsername === currentUserName
                  ? 'You'
                  : msg.senderUsername || 'Unknown'}
                :
              </strong>{' '}
              {msg.text}
            </div>
          ))
        ) : (
          <div className="chat-no-messages">No messages yet.</div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
      <div className="chat-input-container">
        <input
          className="chat-input"
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button className="chat-send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
