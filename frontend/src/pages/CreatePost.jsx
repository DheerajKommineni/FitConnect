import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import { store } from '../App';
import './CreatePost.css';

function CreatePost() {
  const [xtoken, setXToken] = useContext(store);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    file: null,
  });
  const navigate = useNavigate();

  const handleInputChange = event => {
    const { name, value } = event.target;
    setNewPost({ ...newPost, [name]: value });
  };

  const handleFileChange = event => {
    setNewPost({ ...newPost, file: event.target.files[0] });
  };

  const handlePostSubmit = () => {
    const formData = new FormData();
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    formData.append('file', newPost.file);

    axios
      .post('http://localhost:8000/api/posts', formData, {
        headers: {
          'x-token': xtoken,
        },
      })
      .then(response => {
        console.log('Post created:', response.data);
        // Reset the form
        setNewPost({
          title: '',
          content: '',
          file: null,
        });
        navigate('/dashboard');
      })
      .catch(error => console.error('Error creating post:', error));
  };

  return (
    <div className="create-post">
      <h2>Create a New Post</h2>
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={newPost.title}
        onChange={handleInputChange}
        className="title-input"
      />
      <textarea
        name="content"
        placeholder="Content"
        value={newPost.content}
        onChange={handleInputChange}
        className="content-input"
      />
      <input type="file" onChange={handleFileChange} className="file-input" />
      <button onClick={handlePostSubmit} className="submit-button">
        Post
      </button>
    </div>
  );
}

export default CreatePost;
