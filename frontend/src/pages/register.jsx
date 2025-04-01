import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css'; // Reusing the same CSS

const Register = () => {
  const [data, setData] = useState({
    username: '',
    email: '',
    password: '',
    confirmpassword: '',
  });

  const changeHandler = e => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const submitHandler = e => {
    e.preventDefault();
    axios
      .post('http://localhost:8000/api/auth/register', data)
      .then(res => {
        if (res.status === 200 || res.status === 201) {
          alert('Account created successfully!');
        } else {
          alert('An error occurred. Please try again.');
        }
      })
      .catch(err => console.log(err));
  };

  return (
    <div className="container-fluid">
      <h1 className="fitconnect-title2">FitConnect</h1>
      <div className="card shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">Register</h3>
          <form onSubmit={submitHandler}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                onChange={changeHandler}
                name="username"
                placeholder="User Name"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                onChange={changeHandler}
                name="email"
                placeholder="Email"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                onChange={changeHandler}
                name="password"
                placeholder="Password"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                onChange={changeHandler}
                name="confirmpassword"
                placeholder="Confirm Password"
                required
              />
            </div>
            <div className="mb-3">
              <button type="submit" className="custom-btn w-100">
                Register
              </button>
            </div>
          </form>
          <div className="text-center">
            <Link style={{ color: '#2d98da' }} to="/login">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
