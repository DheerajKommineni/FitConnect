const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const session = require('express-session');
const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
} = require('../model');
const GoogleFitService = require('../services/googleFitService');
const fetchGoogleFitData = GoogleFitService.fetchGoogleFitData;
const axios = require('axios');

console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const scopes = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
];

// Handle Google OAuth authorization and generate auth URL
const googleAuth = (req, res) => {
  const xToken = req.headers['x-token'];
  const state = JSON.stringify({ xToken, userId: req.user.id });
  const encodedState = encodeURIComponent(state);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    state: encodedState,
  });
  console.log('Generated Google OAuth URL:', authUrl);
  console.log('userID', req.user.id);
  res.json({ authUrl });
};

// Handle Google OAuth callback
const googleAuthCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  console.log('code', code);
  console.log('state', state);
  console.log('Session:', req.session);

  if (!code) {
    return res.status(400).json({ error: 'No code parameter found in URL' });
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    req.session.tokens = tokens;

    const fitData = await fetchGoogleFitData(tokens.access_token);
    console.log('Fit Data', fitData);

    const { xToken, userId } = JSON.parse(decodeURIComponent(state));
    const userFitness = await userFitnessInfo.findOne({ userId });

    const saveFitnessResponse = await axios.post(
      'http://localhost:8000/save-fitness-data',
      {
        userId,
        age: userFitness.age || null,
        weight: userFitness.weight || null,
        height: userFitness.height || null,
        gender: userFitness.gender || null,
        totalSteps: fitData.totalSteps || 0,
        totalDistance: fitData.totalDistance || 0,
        dailySteps: fitData.dailySteps || [],
        monthlySteps: fitData.monthlySteps || [],
        dailyDistance: fitData.dailyDistance || [],
        monthlyDistance: fitData.monthlyDistance || [],
        dailyCalories: fitData.dailyCalories || [],
        monthlyCalories: fitData.monthlyCalories || [],
        dailyHeartRate: fitData.dailyHeartRate || [],
        monthlyHeartRate: fitData.monthlyHeartRate || [],
        dailyMoveMinutes: fitData.dailyMoveMinutes || [],
        monthlyMoveMinutes: fitData.monthlyMoveMinutes || [],
        dailyHeartPoints: fitData.dailyHeartPoints || [],
        monthlyHeartPoints: fitData.monthlyHeartPoints || [],

        // New fields with default values
        totalCalories: fitData.totalCalories || 0,
        totalHeartRate: fitData.totalHeartRate || 0,
        totalMoveMinutes: fitData.totalMoveMinutes || 0,
        totalHeartPoints: fitData.totalHeartPoints || 0,
        dailySteps: fitData.dailySteps || [],
        dailyDistance: fitData.dailyDistance || [],
        dailyCalories: fitData.dailyCalories || [],

        userId,
        //         age: userFitness.age || null,
        //         weight: userFitness.weight || null,
        //         height: userFitness.height || null,
        //         gender: userFitness.gender || null,
        //         totalSteps: fitD
      },
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    res.redirect(
      `http://localhost:5173/dashboard/my-activity?access_token=${tokens.access_token}&xToken=${xToken}`,
    );
  } catch (error) {
    console.error('Error during Google Fit callback:', error);
    res.status(500).json({ error: 'Failed to handle Google OAuth callback' });
  }
};

module.exports = {
  googleAuth,
  googleAuthCallback,
};
