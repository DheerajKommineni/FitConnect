import React, { useState, useContext, useEffect } from 'react';
import { store } from '../App';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FaUser, FaThLarge, FaTimes } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [xtoken, setXToken] = useContext(store);
  const [data, setData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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

  if (!xtoken) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={toggleMenu}
          />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Navbar.Brand href="#">
                {isMenuOpen ? (
                  <FaTimes onClick={closeMenu} />
                ) : (
                  <FaThLarge onClick={toggleMenu} />
                )}
              </Navbar.Brand>
            </Nav>
            <Nav
              className="mx-auto"
              style={{ position: 'absolute', right: '18%' }}
            >
              {data && (
                <Navbar.Text>
                  <h4>Welcome {data.username}</h4>
                </Navbar.Text>
              )}
            </Nav>
            <Nav className="ml-auto">
              <Nav.Link href="#profile">
                <FaUser style={{ height: '30px', width: '30px' }} />
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
            <Nav.Link onClick={() => navigate('/my-activity')}>
              My Activity
            </Nav.Link>
            <Nav.Link onClick={() => navigate('/analytics')}>
              Analytics
            </Nav.Link>
            <Nav.Link onClick={() => navigate('/chat')}>Chat</Nav.Link>
            <Nav.Link onClick={() => navigate('/challenge')}>
              Challenge
            </Nav.Link>
          </div>
        </div>
      )}
      <div>
        {data && (
          <center>
            <h1>Welcome {data.username}</h1>
          </center>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
