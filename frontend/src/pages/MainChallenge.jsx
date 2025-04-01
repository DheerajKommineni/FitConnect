import React, { useContext } from 'react';
import Challenge from './Challenge';
import PendingChallenge from './PendingChallenge';
import OngoingChallenge from './OngoingChallenge';
import { store } from '../App';
import IncomingChallenge from './IncomingChallenge';
import WonChallenges from './WonChallenges';
import LostChallenges from './LostChallenges';
import { ChallengesProvider } from './ChallengesContext';

const MainChallenge = () => {
  const [xtoken, setXToken] = useContext(store);
  return (
    <div style={{ marginTop: '50px' }}>
      <ChallengesProvider>
        <Challenge />
        {/* <PendingChallenge /> */}
        <IncomingChallenge />
        <OngoingChallenge />
        <WonChallenges />
        <LostChallenges />
      </ChallengesProvider>
    </div>
  );
};

export default MainChallenge;
