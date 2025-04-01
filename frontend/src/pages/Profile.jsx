import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { Link } from 'react-router-dom';
import './Profile.css'; // Import the CSS file

const Profile = () => {
  const [posts, setPosts] = useState([]);
  const [xtoken] = useContext(store);

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/posts', {
        headers: {
          'x-token': xtoken,
        },
      })
      .then(res => setPosts(res.data.currentUserPosts))
      .catch(err => console.log(err));
  }, [xtoken]);

  return (
    <div className="profile">
      <div className="profile-header">
        <h2 className="profile-title">My Posts</h2>
        <div className="profile-actions">
          <Link to="/create-post" className="button">
            Create Post
          </Link>
          <Link to="/create-community" className="button ">
            Create Community
          </Link>
        </div>
      </div>
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
              {post.likedBy
                .map(like =>
                  like.username === post.userId ? 'You' : like.username,
                )
                .join(', ')}
            </p>
          )}
          <p>Comments: {post.comments.length}</p>
          <ul>
            {post.comments.map((comment, index) => (
              <li key={index}>
                {comment.text} -{' '}
                <em>
                  {comment.username === post.userId ? 'You' : comment.username}
                </em>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Profile;
