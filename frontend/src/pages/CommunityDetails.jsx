import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { store } from '../App';
import { useParams } from 'react-router-dom';
import './CommunityDetails.css';
import ChatRoom from './ChatRoom';
import SetGoal from './SetGoal'; // Component for setting goals
import ViewGoals from './ViewGoals'; // Component for viewing goals
import Leaderboard from './Leaderboard';

const CommunityDetails = () => {
  const [community, setCommunity] = useState(null);
  const [xToken] = useContext(store);
  const [userId, setUserId] = useState(null);
  const [creatorName, setCreatorName] = useState('');
  const [goalExists, setGoalExists] = useState(false);
  const [userName, setUserName] = useState('');
  const { communityId } = useParams();
  const [activeTab, setActiveTab] = useState('view-goals');

  const getStringValue = value => {
    if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object' && value.username) {
      return value.username;
    }
    return 'Unknown';
  };

  useEffect(() => {
    axios
      .get(`http://localhost:8000/community/${communityId}`, {
        headers: {
          'x-token': xToken,
        },
      })
      .then(res => {
        const { community, userId, creatorName, userName } = res.data;

        setCommunity(community);
        setUserId(userId);
        setCreatorName(getStringValue(creatorName));
        setUserName(getStringValue(userName));

        if (community.goal.target !== 0) {
          setGoalExists(true);
          setActiveTab('view-goals');
        } else {
          setGoalExists(false);
          // If the user is the creator and no goal exists, set active tab to 'set-goal'
          if (userId === community.creatorId) {
            setActiveTab('set-goal');
          } else {
            setActiveTab('view-goals');
          }
        }
      })
      .catch(err => console.error(err));
  }, [xToken, communityId]);

  const handleGoalSet = () => {
    setGoalExists(true);
    setActiveTab('view-goals');
  };

  // Handle tab change
  const renderContent = () => {
    switch (activeTab) {
      case 'community-guidelines':
        return (
          <div>
            <h2>Community Guidelines</h2>
            <p>
              Welcome to the community! We're excited to have you on board as we
              work together toward our common goals. Here are some important
              guidelines to follow:
            </p>
            <h3>Goal Setting and Participation</h3>
            <p>
              - The community admin sets a common goal for all participants
              based on discussions in the Chat Room.
              <br />
              - Once the goal is set, participants can begin their journey
              toward completing it.
              <br />- Badges are awarded upon completion of the goals, based on
              the difficulty: <strong>Gold</strong> (3 points),{' '}
              <strong>Silver</strong> (2 points), and <strong>Bronze</strong> (1
              point).
              <br />
              - If a goal is not completed by the deadline, 1 point is deducted
              from your total score.
              <br />
              - The leaderboard ranks users by their total points based on the
              badges they've earned.
              <br />- If a user’s total points drop below -10, they will be
              removed from the community due to inactivity.
            </p>
            <h3>Friendly Interaction and Conduct</h3>
            <p>
              - We encourage friendly conversations in the Chat Room. Please be
              respectful to others and avoid offensive language or behavior.
              <br />- Collaboration and support for fellow members are key to
              achieving our collective goals.
            </p>
            <h3>Discipline and Conduct</h3>
            <p>
              - Active participation is expected. Inactive members may lose
              points and risk removal from the community.
              <br />
              - Stay committed to the goals and provide encouragement to other
              participants.
              <br />- Any inappropriate conduct or repeated inactivity will
              result in consequences, including removal from the community.
            </p>
            <p>
              Let's work together and make this community a success. Good luck
              on your journey!
            </p>
          </div>
        );
      case 'set-goal':
        return <SetGoal onGoalSet={handleGoalSet} communityId={communityId} />;
      case 'view-goals':
        return <ViewGoals communityId={communityId} />;
      case 'leaderboard':
        return <Leaderboard communityId={communityId} />;
      case 'chat':
        return <ChatRoom communityId={communityId} />;
      default:
        return <ViewGoals communityId={communityId} />;
    }
  };

  if (!community || userId === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="community-details-container">
      {/* Left Sidebar */}
      <div className="left-sidebar">
        <ul>
          <li
            className={activeTab === 'community-guidelines' ? 'active' : ''}
            onClick={() => setActiveTab('community-guidelines')}
          >
            Community Guidelines
          </li>
          {/* Show "Set Goal" and "View Goals" for the creator if a goal exists */}
          {userId === community.creatorId ? (
            <>
              <li
                className={activeTab === 'view-goals' ? 'active' : ''}
                onClick={() => setActiveTab('view-goals')}
              >
                View Goals
              </li>
              <li
                className={activeTab === 'set-goal' ? 'active' : ''}
                onClick={() => setActiveTab('set-goal')}
              >
                {goalExists ? 'Set New Goal' : 'Set Goal'}
              </li>
            </>
          ) : (
            <li
              className={activeTab === 'view-goals' ? 'active' : ''}
              onClick={() => setActiveTab('view-goals')}
            >
              View Goals
            </li>
          )}
          <li
            className={activeTab === 'leaderboard' ? 'active' : ''}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </li>
          <li
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat Room
          </li>
        </ul>
      </div>

      {/* Center Content */}
      <div className="center-content">
        <h1 className="community-title">{community?.name} Community</h1>
        <p className="community-description">{community?.description}</p>
        {renderContent()}
      </div>

      {/* Right Sidebar - Members List */}
      <div className="right-sidebar">
        <h3>Members</h3>
        <ul>
          <li>{creatorName} (Creator)</li>
          {community?.participants
            .filter(
              member =>
                member.userId._id.toString() !== community.creatorId.toString(),
            ) // Exclude creator
            .map(member => (
              <li key={member.userId._id}>
                {member.userId?.username || 'Unknown User'}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default CommunityDetails;
