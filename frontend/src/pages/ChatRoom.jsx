import React, { useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { store } from '../App';
import './ChatRoom.css';

const initializeSocket = (xToken, communityId) => {
  return io('http://localhost:8000', {
    withCredentials: true,
    extraHeaders: {
      'x-token': xToken,
    },
    query: { communityId },
  });
};

const ChatRoom = ({ communityId }) => {
  const [xToken] = useContext(store);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [userId, setUserId] = useState(null);
  const socketRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (xToken) {
      socketRef.current = initializeSocket(xToken, communityId);
      const socket = socketRef.current;

      socket.emit('joinCommunity', communityId);

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('communityMessage', message => {
        setMessages(prevMessages => [...prevMessages, message]);
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [xToken, communityId]);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/community/${communityId}`,
          {
            headers: { 'x-token': xToken },
          },
        );

        const { userId, userName } = response.data;
        setUserId(userId);
        setCurrentUsername(userName);
      } catch (error) {
        console.error('Error fetching community details:', error);
      }
    };

    fetchCommunity();
  }, [xToken, communityId]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/community/${communityId}/messages`,
          {
            headers: { 'x-token': xToken },
          },
        );

        const { messages, currentUsername, userId } = response.data;
        setMessages(messages);
        setCurrentUsername(currentUsername);
        setUserId(userId);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
  }, [xToken, communityId]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    try {
      if (!userId) {
        console.error('User ID is not available. Cannot send message.');
        return;
      }

      if (socketRef.current && newMessage.trim() !== '') {
        socketRef.current.emit('communityMessage', {
          userId: userId,
          communityId: communityId,
          content: newMessage,
        });
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-room-container">
      <h3 className="chat-room-header">Group Chat</h3>
      <div className="chat-room-messages">
        {[...messages]
          .slice()
          .reverse()
          .map((msg, index, arr) => (
            <div
              key={index}
              ref={index === 0 ? endOfMessagesRef : null} // Attach ref to last message
              className={`chat-room-message ${
                msg.senderUsername === currentUsername
                  ? 'current-user'
                  : 'other-user'
              }`}
            >
              <strong>
                {msg.senderUsername === currentUsername
                  ? 'You'
                  : msg.senderUsername}
                :
              </strong>{' '}
              {typeof msg.text === 'object'
                ? JSON.stringify(msg.text)
                : msg.text}
            </div>
          ))}
      </div>

      <div className="chat-room-input-container">
        <input
          className="chat-room-input"
          type="text"
          placeholder="Type a message..."
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

export default ChatRoom;
