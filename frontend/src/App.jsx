import React, { useState, createContext } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/register';
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import 'bootstrap/dist/css/bootstrap.min.css';

export const store = createContext();

const App = () => {
  const [xtoken, setXToken] = useState(null);

  return (
    <store.Provider value={[xtoken, setXToken]}>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/my-activity" element={<Activity />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </BrowserRouter>
    </store.Provider>
  );
};

export default App;
