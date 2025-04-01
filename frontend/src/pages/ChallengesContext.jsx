import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const ChallengesContext = createContext();

export const ChallengesProvider = ({ children }) => {
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [ongoingChallenges, setOngoingChallenges] = useState([]);
  const [wonChallenges, setWonChallenges] = useState([]);
  const [lostChallenges, setLostChallenges] = useState([]);

  const fetchIncomingChallenges = useCallback(async xtoken => {
    try {
      const response = await axios.get(
        'http://localhost:8000/incoming-challenges',
        {
          headers: { 'x-token': xtoken },
        },
      );
      setIncomingChallenges(response.data || []);
    } catch (error) {
      console.error('Error fetching incoming challenges:', error);
      setIncomingChallenges([]);
    }
  }, []);

  const fetchOngoingChallenges = useCallback(async xtoken => {
    try {
      const response = await axios.get(
        'http://localhost:8000/ongoing-challenges',
        {
          headers: { 'x-token': xtoken },
        },
      );

      if (response.data) {
        setOngoingChallenges([
          ...response.data.challengesOngoing,
          ...response.data.challengesCompleted,
        ]);
      } else {
        console.error('Unexpected data format:', response.data);
        setOngoingChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching ongoing challenges:', error);
      setOngoingChallenges([]);
    }
  }, []);

  const fetchWonChallenges = useCallback(async xtoken => {
    try {
      const response = await axios.get('http://localhost:8000/challenges/won', {
        headers: { 'x-token': xtoken },
      });
      setWonChallenges(response.data);
    } catch (error) {
      console.error('Error fetching won challenges:', error);
    }
  }, []);

  const fetchLostChallenges = useCallback(async xtoken => {
    try {
      const response = await axios.get(
        'http://localhost:8000/challenges/lost',
        {
          headers: { 'x-token': xtoken },
        },
      );
      setLostChallenges(response.data);
    } catch (error) {
      console.error('Error fetching lost challenges:', error);
    }
  }, []);

  return (
    <ChallengesContext.Provider
      value={{
        incomingChallenges,
        setIncomingChallenges,
        fetchIncomingChallenges,
        ongoingChallenges,
        setOngoingChallenges,
        wonChallenges,
        setWonChallenges,
        lostChallenges,
        setLostChallenges,
        fetchOngoingChallenges,
        fetchWonChallenges,
        fetchLostChallenges,
      }}
    >
      {children}
    </ChallengesContext.Provider>
  );
};

export const useChallenges = () => useContext(ChallengesContext);
