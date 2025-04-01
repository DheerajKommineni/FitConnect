import React, { useState, createContext } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/register';
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import 'bootstrap/dist/css/bootstrap.min.css';
import WeightAnalyzer from './pages/WeightAnalyzer';
import NewsFeed from './pages/NewsFeed';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import FriendRequests from './pages/FriendRequests';
import Challenge from './pages/Challenge';
import MainChallenge from './pages/MainChallenge';
import PendingChallenge from './pages/PendingChallenge';
import OngoingChallenge from './pages/OngoingChallenge';
import IncomingChallenge from './pages/IncomingChallenge';
import WonChallenges from './pages/WonChallenges';
import LostChallenges from './pages/LostChallenges';
import Exercises from './pages/Exercises';
import Chat from './pages/Chat';
import './GlobalStyles.module.css';
import CreateCommunity from './pages/CreateCommunity';
import DisplayCommunities from './pages/DisplayCommunities';
import CommunityDetails from './pages/CommunityDetails';
import ChatRoom from './pages/ChatRoom';
import SetGoal from './pages/SetGoal';
import ViewGoals from './pages/ViewGoals';
import Leaderboard from './pages/Leaderboard';

export const store = createContext();

const App = () => {
  const [xtoken, setXToken] = useState(null);

  return (
    <store.Provider value={[xtoken, setXToken]}>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/*" element={<Dashboard />} />

          <Route path="/my-activity" element={<Activity />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/weight-analyzer" element={<WeightAnalyzer />} />
          <Route path="/news-feed" element={<NewsFeed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/friend-requests" element={<FriendRequests />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/main-challenge" element={<MainChallenge />} />
          <Route path="/pending-challenge" element={<PendingChallenge />} />
          <Route path="/ongoing-challenge" element={<OngoingChallenge />} />
          <Route path="/incoming-challenge" element={<IncomingChallenge />} />
          <Route path="/won-challenge" element={<WonChallenges />} />
          <Route path="/lost-challenge" element={<LostChallenges />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/create-community" element={<CreateCommunity />} />
          <Route path="/chat-room" element={<ChatRoom />} />
          <Route path="/setgoal" element={<SetGoal />} />
          <Route path="/viewgoals" element={<ViewGoals />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/display-communities" element={<DisplayCommunities />} />
          <Route
            path="/community-details/:communityId"
            element={<CommunityDetails />}
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </store.Provider>
  );
};

export default App;
