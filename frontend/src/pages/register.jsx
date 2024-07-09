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
      .post('http://localhost:8000/register', data)
      .then(res => alert(res.data))
      .catch(err => console.log(err));
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}
    >
      <div className="card shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
          <h3 className="card-title text-center mb-4">Register</h3>
          <form onSubmit={submitHandler}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
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
                style={{ width: '100%' }}
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
            <Link style={{ color: 'black' }} to="/login">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
