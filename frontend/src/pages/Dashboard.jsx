import React, { useState, useContext, useEffect } from 'react';
import { store } from '../App';
import {
  Navigate,
  useNavigate,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import axios from 'axios';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FaUser, FaThLarge, FaTimes } from 'react-icons/fa';
import NewsFeed from './NewsFeed';
import CreatePost from './CreatePost';
import FriendRequests from './FriendRequests';
import Activity from './Activity';
import Analytics from './Analytics';
import WeightAnalyzer from './WeightAnalyzer';
import Exercises from './Exercises';
import Profile from './Profile';
import Chat from './Chat';
// import Chat from './Chat';
import MainChallenge from './MainChallenge';
import DisplayCommunities from './DisplayCommunities';
import './Dashboard.css';
import CommunityDetails from './CommunityDetails';
import SetGoal from './SetGoal';
import ViewGoals from './ViewGoals';
import Leaderboard from './Leaderboard';

const Dashboard = () => {
  const [xtoken, setXToken] = useContext(store);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [data, setData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('xToken');
    if (token) {
      setXToken(token);
      // Optionally, save xToken to local storage or a global state
      localStorage.setItem('xToken', token);
    }
    axios
      .get('http://localhost:8000/dashboard', {
        headers: {
          'x-token': xtoken,
        },
      })
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  }, [xtoken]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleNavLinkClick = path => {
    navigate(path);
    closeMenu(); // Close menu after navigation
  };

  const handleFriendAdded = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh
  };

  if (!xtoken) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <Navbar bg="dark" expand="lg" variant="dark">
        <Container>
          <Navbar.Brand href="#" onClick={() => navigate('/dashboard')}>
            <FaThLarge onClick={toggleMenu} style={{ marginRight: '10px' }} />
            <span className="fitconnect-title">FITCONNECT</span>
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={toggleMenu}
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              {data && (
                <Navbar.Text className="welcome-text">
                  Welcome, {data.username}
                </Navbar.Text>
              )}
              <Nav.Link onClick={() => navigate('/dashboard/profile')}>
                <FaUser className="nav-icon" />
              </Nav.Link>
              <Nav.Link>
                <button className="custom-btn" onClick={() => setXToken(null)}>
                  Logout
                </button>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {isMenuOpen && (
        <div className="fullscreen-menu" onClick={closeMenu}>
          <div className="menu-content" onClick={e => e.stopPropagation()}>
            <Nav.Link
              onClick={() => handleNavLinkClick('/dashboard/my-activity')}
            >
              My Activity
            </Nav.Link>
            <Nav.Link
              onClick={() => handleNavLinkClick('/dashboard/analytics')}
            >
              Analytics
            </Nav.Link>
            <Nav.Link
              onClick={() => handleNavLinkClick('/dashboard/weight-analyzer')}
            >
              Weight Analyzer
            </Nav.Link>
            {/* <Nav.Link onClick={() => handleNavLinkClick('/dashboard/chat')}>
              Chat
            </Nav.Link> */}
            <Nav.Link
              onClick={() => handleNavLinkClick('/dashboard/main-challenge')}
            >
              Challenge
            </Nav.Link>
            <Nav.Link
              onClick={() => handleNavLinkClick('/dashboard/exercises')}
            >
              Exercises
            </Nav.Link>
          </div>
        </div>
      )}

      {location.pathname === '/dashboard' && (
        <>
          <div style={{ position: 'absolute', left: '5%' }}>
            <DisplayCommunities />
          </div>
          <div>
            <center>
              <h1
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '24px',
                  fontStyle: 'italic',
                  color: '#4A90E2',
                  borderLeft: '3px solid #4A90E2',
                  paddingLeft: '15px',
                  margin: '20px 0',
                }}
              >
                Every step counts! Keep pushing and stay active.
              </h1>
            </center>
          </div>

          <div style={{ position: 'absolute', right: '5%' }}>
            <FriendRequests onFriendAdded={handleFriendAdded} />
          </div>
        </>
      )}

      <div>
        <Routes>
          <Route
            path="/"
            element={<NewsFeed refreshTrigger={refreshTrigger} />}
          />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/my-activity" element={<Activity />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/weight-analyzer" element={<WeightAnalyzer />} />
          {/* <Route path="/chat" element={<Chat />} /> */}
          <Route path="/main-challenge" element={<MainChallenge />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/chat" element={<Chat />} />
          <Route
            path="/community-details/:communityId"
            element={<CommunityDetails />}
          />
          <Route path="/setgoal" element={<SetGoal />} />
          <Route path="/viewgoals" element={<ViewGoals />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        {/* {location.pathname === '/dashboard' && (
          <div className="create-post-wrapper">
            <Link to="/create-post" className="create-post-btn">
              Create Post
            </Link>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Dashboard;
