import React, { useState, useEffect, useContext } from 'react';
import { store } from '../App';
import axios from 'axios';
import './NewsFeed.css';

function NewsFeed({ refreshTrigger }) {
  const [xtoken] = useContext(store);
  const [likedPosts, setLikedPosts] = useState({});
  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPosts = () => {
    axios
      .get('http://localhost:8000/api/posts', {
        headers: {
          'x-token': xtoken,
        },
      })
      .then(response => {
        const sortedPosts = response.data.otherUserPosts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setPosts(sortedPosts);
      })
      .catch(error => console.error('Error fetching posts:', error));
  };

  useEffect(() => {
    fetchPosts();
  }, [xtoken, refreshTrigger]);

  const handleLike = postId => {
    if (likedPosts[postId]) return; // If already liked, do nothing

    axios
      .post(
        `http://localhost:8000/api/posts/like/${postId}`,
        {},
        {
          headers: {
            'x-token': xtoken,
          },
        },
      )
      .then(response => {
        const updatedPosts = posts.map(post =>
          post._id === postId ? response.data : post,
        );
        setPosts(updatedPosts);
        setLikedPosts(prev => ({ ...prev, [postId]: true })); // Update state to indicate post is liked
      })
      .catch(error => console.error('Error liking post:', error));
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = (postId, commentText) => {
    axios
      .post(
        `http://localhost:8000/api/posts/comment/${postId}`,
        {
          text: commentText,
        },
        {
          headers: {
            'x-token': xtoken,
          },
        },
      )
      .then(response => {
        const updatedPosts = posts.map(post =>
          post._id === postId ? response.data : post,
        );
        setPosts(updatedPosts);
        setCommentInputs(prev => ({ ...prev, [postId]: '' })); // Clear comment input for the specific post
      })
      .catch(error => console.error('Error adding comment:', error));
  };

  return (
    <div className="newsfeed">
      <h2>News Feed</h2>
      {posts.map(post => (
        <div key={post._id} className="post">
          <h2>{post.username}</h2>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          {post.file && (
            <div>
              {post.file.includes('.mp4') ? (
                <video width="320" height="240" controls>
                  <source
                    src={`http://localhost:8000/uploads/${post.file}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={`http://localhost:8000/uploads/${post.file}`}
                  alt="Post Media"
                />
              )}
            </div>
          )}
          <p>Likes: {post.likes}</p>
          {post.likes > 0 && (
            <p>
              Liked By:{' '}
              {Array.from(new Set(post.likedBy.map(like => like.username)))
                .map(username => <span key={username}>{username}</span>)
                .reduce((prev, curr) => [prev, ', ', curr])}
            </p>
          )}
          <button
            onClick={() => handleLike(post._id)}
            disabled={likedPosts[post._id]} // Disable if post is liked
            className="like-button"
          >
            {likedPosts[post._id] ? 'Liked' : 'Like'}
          </button>
          <p>Comments: {post.comments.length}</p>
          <ul>
            {post.comments.map((comment, index) => (
              <li key={index}>
                <em>
                  {comment.username === post.userId ? 'You' : comment.username}
                </em>{' '}
                - {comment.text}
              </li>
            ))}
          </ul>

          <input
            type="text"
            placeholder="Add a comment"
            className="comment-input"
            value={commentInputs[post._id] || ''}
            onChange={e => handleCommentInputChange(post._id, e.target.value)}
          />
          <button
            onClick={() => handleAddComment(post._id, commentInputs[post._id])}
            className="comment-button"
          >
            Add Comment
          </button>
        </div>
      ))}
    </div>
  );
}

export default NewsFeed;
