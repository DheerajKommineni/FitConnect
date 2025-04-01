import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link, Navigate } from 'react-router-dom';
import { store } from '../App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';

const Login = () => {
  const [token, setToken] = useContext(store);
  const [data, setData] = useState({
    email: '',
    password: '',
  });

  const changeHandler = e => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const submitHandler = e => {
    e.preventDefault();
    axios
      .post('http://localhost:8000/api/auth/login', data)
      .then(res => setToken(res.data.token))
      .catch(err => console.log(err));
  };

  if (token) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container-fluid">
      <h1 className="fitconnect-title2">FitConnect</h1>
      <div className="card shadow login-card">
        <div className="card-body">
          <h3 className="card-title text-center mb-4">Login</h3>
          <form onSubmit={submitHandler}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control login-input"
                onChange={changeHandler}
                name="email"
                placeholder="Email"
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control login-input"
                onChange={changeHandler}
                name="password"
                placeholder="Password"
                required
              />
            </div>
            <div className="mb-3">
              <button type="submit" className="custom-btn w-100">
                Login
              </button>
            </div>
          </form>
          <div className="text-center">
            <Link to="/register" className="create-account-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
