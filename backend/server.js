// WORKING CODE

const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const http = require('http');
const socketIo = require('socket.io');
const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
  chatSchema,
  communitySchema,
} = require('./model'); // Ensure correct imports
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');
const cors = require('cors');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const crypto = require('crypto');
const Big = require('big.js');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { exec } = require('child_process');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const googleFitRoutes = require('./routes/googleFitRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');
const activityService = require('./services/activityService');
const socialNetRoutes = require('./routes/socialNetRoutes');
// const { saveFitnessData } = require('./services/fitnessDataService');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(bodyParser.json());
const port = process.env.PORT || 8000;
const sessionSecret = crypto.randomBytes(64).toString('hex');

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// const YOUTUBE_API_KEY = 'AIzaSyBcNY6pC_l8pKSsLauNiDD7yQiQg0VjBV8';
// const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

const scopes = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
];

mongoose
  .connect(
    'mongodb+srv://dheerajkommineni123:Dheeraj123ms@cluster0.ptcotdp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  )
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Connection Error:', err));

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

app.use('/api/auth', authRoutes);
app.use(googleFitRoutes);
app.use('/api', activityRoutes);
app.use(userRoutes);
app.use(socialNetRoutes);

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

function isAccessTokenExpired(tokens) {
  return tokens.expiry_date < Date.now();
}

app.use(async (req, res, next) => {
  if (req.session.tokens && isAccessTokenExpired(req.session.tokens)) {
    const { refresh_token } = req.session.tokens;
    try {
      const { tokens } = await oAuth2Client.refreshToken(refresh_token);
      req.session.tokens = tokens; // Update tokens in session
      console.log('Refreshed tokens:', tokens);
    } catch (error) {
      console.error('Error refreshing token:', error);
      return res.status(401).send('Token refresh failed');
    }
  }
  next();
});

const getUsername = async userId => {
  try {
    const user = await registerUser.findById(userId).select('username');
    return user ? user.username : 'Unknown';
  } catch (error) {
    console.error('Error fetching username:', error);
    return 'Unknown';
  }
};

// app.get('/dashboard', middleware, async (req, res) => {
//   try {
//     let exist = await registerUser.findById(req.user.id);
//     if (!exist) {
//       return res.status(400).send('User Not Found');
//     }
//     res.json(exist);
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send('Internal Server Error');
//   }
// });

// app.get('/google-auth', middleware, (req, res) => {
//   const xToken = req.headers['x-token'];
//   const state = JSON.stringify({ xToken, userId: req.user.id });
//   const encodedState = encodeURIComponent(state);

//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: scopes,
//     redirect_uri: process.env.GOOGLE_REDIRECT_URI,
//     state: encodedState,
//   });
//   console.log('Generated Google OAuth URL:', authUrl);
//   console.log('userID', req.user.id);
//   res.json({ authUrl });
// });

// app.get('/google-auth/callback', async (req, res) => {
//   const code = req.query.code;
//   const state = req.query.state;
//   console.log('Received Google OAuth callback with code:', code);
//   console.log('Received state:', state);

//   if (!code) {
//     return res.status(400).json({ error: 'No code parameter found in URL' });
//   }

//   try {
//     // Exchange code for tokens
//     const { tokens } = await oAuth2Client.getToken(code);
//     req.session.tokens = tokens;
//     console.log('Tokens received:', tokens);

//     // Fetch Google Fit data using the access token
//     const fitData = await fetchGoogleFitData(tokens.access_token);

//     // Assuming userId is stored in state and passed as JSON
//     const { xToken, userId } = JSON.parse(decodeURIComponent(state));
//     console.log('Parsed userId from state:', userId);

//     if (!userId) {
//       throw new Error('User ID is missing from state');
//     }

//     console.log('FitData in callback function', fitData);
//     console.log(
//       'Detailed log of fitData',
//       fitData.dailySteps,
//       fitData.monthlySteps,
//       fitData.totalSteps,
//       fitData.dailyDistance,
//       fitData.monthlyDistance,
//       fitData.totalDistance,
//       fitData.monthlySteps,
//       fitData.monthlyDistance,
//       fitData.dailySteps,
//       fitData.dailyDistance,
//       fitData.dailyHeartPoints,
//       fitData.monthlyHeartPoints,
//       fitData.totalHeartPoints,
//     );

//     const monthlyStepsArray = fitData.monthlySteps.map(
//       step => parseFloat(step) || 0,
//     );
//     const monthlyDistanceArray = fitData.monthlyDistance.map(
//       distance => parseFloat(distance) || 0,
//     );

//     // console.log('Steps Array in callback', monthlyStepsArray);
//     // console.log('Distance Array in callback', monthlyDistanceArray);
//     const userFitness = await userFitnessInfo.findOne({ userId });

//     // Save fitness data
//     const saveFitnessResponse = await axios.post(
//       'http://localhost:8000/save-fitness-data',
//       {
//         userId,
//         age: userFitness.age || null, // Default to null if not available
//         weight: userFitness.weight || null, // Default to null if not available
//         height: userFitness.height || null, // Default to null if not available
//         gender: userFitness.gender || null, // Default to null if not available
//         totalSteps: fitData.totalSteps || 0,
//         totalDistance: fitData.totalDistance || 0,
//         dailySteps: fitData.dailySteps || [],
//         monthlySteps: fitData.monthlySteps || [],
//         dailyDistance: fitData.dailyDistance || [],
//         monthlyDistance: fitData.monthlyDistance || [],
//         dailyCalories: fitData.dailyCalories || [],
//         monthlyCalories: fitData.monthlyCalories || [],
//         dailyHeartRate: fitData.dailyHeartRate || [],
//         monthlyHeartRate: fitData.monthlyHeartRate || [],
//         dailyMoveMinutes: fitData.dailyMoveMinutes || [],
//         monthlyMoveMinutes: fitData.monthlyMoveMinutes || [],
//         dailyHeartPoints: fitData.dailyHeartPoints || [],
//         monthlyHeartPoints: fitData.monthlyHeartPoints || [],

//         // New fields with default values
//         totalCalories: fitData.totalCalories || 0,
//         totalHeartRate: fitData.totalHeartRate || 0,
//         totalMoveMinutes: fitData.totalMoveMinutes || 0,
//         totalHeartPoints: fitData.totalHeartPoints || 0,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${tokens.access_token}`,
//         },
//       },
//     );

//     console.log('Fitness Data Saved:', saveFitnessResponse.data);

//     // Redirect to the activity page with the access token in the query parameters
//     res.redirect(
//       `http://localhost:5173/dashboard/my-activity?access_token=${tokens.access_token}&xToken=${xToken}`,
//     );
//   } catch (error) {
//     console.error(
//       'Error handling callback:',
//       error.response ? error.response.data : error.message,
//     );

//     res.status(500).json({
//       error: error.response
//         ? error.response.data.error
//         : 'Failed to handle Google OAuth callback',
//     });
//   }
// });

// const fetchGoogleFitData = async accessToken => {
//   // Calculate time ranges dynamically
//   const now = new Date();

//   // Current month start and end times
//   const dailyStartTime = new Date(
//     now.getFullYear(),
//     now.getMonth(),
//     1,
//   ).getTime();
//   const dailyEndTime = new Date(
//     now.getFullYear(),
//     now.getMonth() + 1,
//     0,
//   ).getTime();

//   // Six months start and end times
//   const sixMonthsStartTime = new Date(
//     now.getFullYear(),
//     now.getMonth() - 5,
//     1,
//   ).getTime(); // 6 months ago from now
//   const sixMonthsEndTime = new Date(
//     now.getFullYear(),
//     now.getMonth() + 1,
//     0,
//   ).getTime(); // End of current month

//   // Extract steps, distance, and other data from the responses
//   const extractData = (response, dataType) => {
//     if (!response || !response.bucket) {
//       console.log('Invalid response structure.');
//       return new Big(0);
//     }

//     return response.bucket.reduce((total, bucket) => {
//       if (!bucket.dataset) {
//         console.log('No dataset in bucket.');
//         return total;
//       }

//       return bucket.dataset.reduce((bucketTotal, dataset) => {
//         if (!dataset.point) {
//           console.log('No points in dataset.');
//           return bucketTotal;
//         }

//         return dataset.point.reduce((pointTotal, point) => {
//           const rawValue = point.value[0] ? point.value[0][dataType] : 0;
//           const value =
//             isNaN(rawValue) || rawValue === null || rawValue === undefined
//               ? 0
//               : rawValue;

//           try {
//             return pointTotal.plus(new Big(value));
//           } catch (error) {
//             console.error('Error creating Big instance with value:', value);
//             throw error; // Re-throw the error after logging
//           }
//         }, bucketTotal);
//       }, total);
//     }, new Big(0));
//   };
//   const fetchData = async (start, end, durationMillis, dataType) => {
//     // console.log(`Fetching ${dataType} data from ${start} to ${end}...`);
//     try {
//       const response = await fetch(
//         `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
//         {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             aggregateBy: [{ dataTypeName: dataType }],
//             bucketByTime: { durationMillis },
//             startTimeMillis: start,
//             endTimeMillis: end,
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error('Error Response Text:', errorText);
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const responseData = await response.json();
//       console.log(
//         `Response Data for ${dataType}:`,
//         JSON.stringify(responseData, null, 2),
//       );
//       // console.log('Response Data:', responseData);
//       return responseData;
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       throw error;
//     }
//   };

//   try {
//     // Fetch data for the current month
//     const dailyStepsData = await fetchData(
//       dailyStartTime,
//       dailyEndTime,
//       86400000, // 1 day in milliseconds
//       'com.google.step_count.delta',
//     );

//     const dailyDistanceData = await fetchData(
//       dailyStartTime,
//       dailyEndTime,
//       86400000, // 1 day in milliseconds
//       'com.google.distance.delta',
//     );

//     const dailyCaloriesData = await fetchData(
//       dailyStartTime,
//       dailyEndTime,
//       86400000, // 1 day in milliseconds
//       'com.google.calories.expended',
//     );

//     const dailyHeartRateData = await fetchData(
//       dailyStartTime,
//       dailyEndTime,
//       86400000, // 1 day in milliseconds
//       'com.google.heart_rate.bpm',
//     );

//     const dailyMoveMinutesData = await fetchData(
//       dailyStartTime,
//       dailyEndTime,
//       86400000, // 1 day in milliseconds
//       'com.google.active_minutes',
//     );

//     const dailyHeartPointsData = await fetchData(
//       dailyStartTime,
//       dailyEndTime,
//       86400000, // 1 day in milliseconds
//       'com.google.heart_minutes',
//     );

//     // Extract daily data for additional data types
//     const extractDailyData = (response, dataType) => {
//       const dailyData = [];
//       if (response && response.bucket) {
//         response.bucket.forEach(bucket => {
//           if (bucket.dataset) {
//             bucket.dataset.forEach(dataset => {
//               if (dataset.point) {
//                 dataset.point.forEach(point => {
//                   const timestamp = bucket.startTimeMillis;
//                   const rawValue = point.value[0]
//                     ? point.value[0][dataType]
//                     : 0;
//                   const value =
//                     isNaN(rawValue) ||
//                     rawValue === null ||
//                     rawValue === undefined
//                       ? 0
//                       : rawValue;
//                   dailyData.push({ timestamp, value: new Big(value) });
//                 });
//               }
//             });
//           }
//         });
//       }
//       return dailyData;
//     };

//     const dailyStepsArray = extractDailyData(dailyStepsData, 'intVal');
//     const dailyDistanceArray = extractDailyData(dailyDistanceData, 'fpVal');
//     const dailyCaloriesArray = extractDailyData(dailyCaloriesData, 'fpVal');
//     const dailyHeartRateArray = extractDailyData(dailyHeartRateData, 'fpVal');
//     const dailyMoveMinutesArray = extractDailyData(
//       dailyMoveMinutesData,
//       'intVal',
//     );
//     const dailyHeartPointsArray = extractDailyData(
//       dailyHeartPointsData,
//       'fpVal',
//     );

//     // Fetch 6 months data in smaller intervals
//     const sixMonthsSteps = [];
//     const sixMonthsDistance = [];
//     const sixMonthsCalories = [];
//     // Commenting out heart rate data fetch
//     const sixMonthsHeartRate = [];
//     const sixMonthsMoveMinutes = [];
//     const sixMonthsHeartPoints = [];
//     let totalSteps = new Big(0);
//     let totalDistance = new Big(0);
//     let totalCalories = new Big(0);
//     let totalHeartRate = new Big(0);
//     let heartRateCount = 0;
//     let totalMoveMinutes = new Big(0);
//     let totalHeartPoints = new Big(0);
//     const interval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
//     let start = sixMonthsStartTime;
//     const end = sixMonthsEndTime;

//     while (start < end) {
//       const intervalEnd = Math.min(start + interval, end);
//       const intervalStepsData = await fetchData(
//         start,
//         intervalEnd,
//         interval,
//         'com.google.step_count.delta',
//       );
//       sixMonthsSteps.push(intervalStepsData);

//       const intervalDistanceData = await fetchData(
//         start,
//         intervalEnd,
//         interval,
//         'com.google.distance.delta',
//       );
//       sixMonthsDistance.push(intervalDistanceData);

//       const intervalCaloriesData = await fetchData(
//         start,
//         intervalEnd,
//         interval,
//         'com.google.calories.expended',
//       );
//       sixMonthsCalories.push(intervalCaloriesData);

//       // Commenting out heart rate data fetch
//       const intervalHeartRateData = await fetchData(
//         start,
//         intervalEnd,
//         interval,
//         'com.google.heart_rate.bpm',
//       );
//       sixMonthsHeartRate.push(intervalHeartRateData);

//       const intervalMoveMinutesData = await fetchData(
//         start,
//         intervalEnd,
//         interval,
//         'com.google.active_minutes',
//       );
//       sixMonthsMoveMinutes.push(intervalMoveMinutesData);

//       const intervalHeartPointsData = await fetchData(
//         start,
//         intervalEnd,
//         interval,
//         'com.google.heart_minutes',
//       );
//       sixMonthsHeartPoints.push(intervalHeartPointsData);

//       totalSteps = totalSteps.plus(extractData(intervalStepsData, 'intVal'));
//       totalDistance = totalDistance.plus(
//         extractData(intervalDistanceData, 'fpVal'),
//       );
//       totalCalories = totalCalories.plus(
//         extractData(intervalCaloriesData, 'fpVal'),
//       );
//       totalHeartRate = totalHeartRate.plus(
//         extractData(intervalHeartRateData, 'fpVal').toString(),
//       );

//       totalMoveMinutes = totalMoveMinutes.plus(
//         extractData(intervalMoveMinutesData, 'intVal'),
//       );

//       totalHeartPoints = totalHeartPoints.plus(
//         extractData(intervalHeartPointsData, 'fpVal'),
//       );

//       start = intervalEnd; // Move start to the end of the current interval
//     }

//     // Prepare monthly data array for last 6 months
//     const monthlyStepsArray = [];
//     const monthlyDistanceArray = [];
//     const monthlyCaloriesArray = [];
//     // Commenting out heart rate data fetch
//     const monthlyHeartRateArray = [];
//     const monthlyMoveMinutesArray = [];
//     const monthlyHeartPointsArray = [];

//     for (let i = 0; i < 6; i++) {
//       const monthStart = new Date(
//         now.getFullYear(),
//         now.getMonth() - i,
//         1,
//       ).getTime();
//       const monthEnd = new Date(
//         now.getFullYear(),
//         now.getMonth() - i + 1,
//         0,
//       ).getTime();

//       const monthStepsData = await fetchData(
//         monthStart,
//         monthEnd,
//         2592000000, // 1 month in milliseconds
//         'com.google.step_count.delta',
//       );

//       const monthDistanceData = await fetchData(
//         monthStart,
//         monthEnd,
//         2592000000, // 1 month in milliseconds
//         'com.google.distance.delta',
//       );

//       const monthCaloriesData = await fetchData(
//         monthStart,
//         monthEnd,
//         2592000000, // 1 month in milliseconds
//         'com.google.calories.expended',
//       );

//       const monthHeartRateData = await fetchData(
//         monthStart,
//         monthEnd,
//         2592000000, // 1 month in milliseconds
//         'com.google.heart_rate.bpm',
//       );

//       const monthMoveMinutesData = await fetchData(
//         monthStart,
//         monthEnd,
//         2592000000, // 1 month in milliseconds
//         'com.google.active_minutes',
//       );

//       const monthHeartPointsData = await fetchData(
//         monthStart,
//         monthEnd,
//         2592000000, // 1 month in milliseconds,
//         'com.google.heart_minutes',
//       );

//       monthlyStepsArray.unshift(
//         extractData(monthStepsData, 'intVal').toString(),
//       );
//       monthlyDistanceArray.unshift(
//         extractData(monthDistanceData, 'fpVal').toString(),
//       );
//       monthlyCaloriesArray.unshift(
//         extractData(monthCaloriesData, 'fpVal').toString(),
//       );
//       monthlyHeartRateArray.unshift(
//         extractData(monthHeartRateData, 'fpVal').toString(),
//       );
//       monthlyMoveMinutesArray.unshift(
//         extractData(monthMoveMinutesData, 'intVal').toString(),
//       );
//       monthlyHeartPointsArray.unshift(
//         extractData(monthHeartPointsData, 'fpVal').toString(),
//       );
//     }

//     console.log('Daily Heart Rate Array:', dailyHeartRateArray);
//     console.log('Monthly Heart Rate Array:', monthlyHeartRateArray);

//     const sum = dailyHeartRateArray.reduce((sum, entry) => {
//       // Convert value to a number and add to the sum
//       return sum + parseFloat(entry.value);
//     }, 0);

//     const len = dailyHeartRateArray.length;

//     const averageHeartRate = sum / len;

//     return {
//       dailySteps: dailyStepsArray,
//       dailyDistance: dailyDistanceArray,
//       dailyCalories: dailyCaloriesArray,
//       dailyHeartRate: dailyHeartRateArray,
//       dailyMoveMinutes: dailyMoveMinutesArray,
//       dailyHeartPoints: dailyHeartPointsArray,
//       monthlySteps: monthlyStepsArray,
//       monthlyDistance: monthlyDistanceArray,
//       monthlyCalories: monthlyCaloriesArray,
//       monthlyHeartRate: monthlyHeartRateArray,
//       monthlyMoveMinutes: monthlyMoveMinutesArray,
//       monthlyHeartPoints: monthlyHeartPointsArray,
//       totalSteps: totalSteps.toString(),
//       totalDistance: totalDistance.toString(),
//       totalCalories: totalCalories.toString(),
//       totalHeartRate: averageHeartRate.toString(),
//       totalMoveMinutes: totalMoveMinutes.toString(),
//       totalHeartPoints: totalHeartPoints.toString(),
//     };
//   } catch (error) {
//     console.error('Error in fetchGoogleFitData:', error);
//     throw error;
//   }
// };

app.post('/save-fitness-data', async (req, res) => {
  console.log('Full received request body:', JSON.stringify(req.body, null, 2));
  try {
    const {
      userId,
      age = 0,
      weight = 0,
      height = 0,
      gender = '',
      dailySteps = [],
      monthlySteps = [],
      sixMonthsSteps = 0,
      dailyDistance = [],
      monthlyDistance = [],
      dailyCalories = [],
      monthlyCalories = [],
      dailyMoveMinutes = [],
      monthlyMoveMinutes = [],
      dailyHeartPoints = [],
      monthlyHeartPoints = [],
      dailyHeartRate = [],
      monthlyHeartRate = [],
      sixMonthsDistance = 0,
      dailyStepsArray = [],
      dailyDistanceArray = [],
      calories = 0,
      heartRate = 0,
      sleep = 0,
      totalCalories = 0,
      totalSteps = 0,
      totalDistance = 0,
      totalHeartRate = 0,
      totalMoveMinutes = 0,
      totalHeartPoints = 0,
      activityDuration = 0,
    } = req.body;

    console.log('Received monthlySteps:', monthlySteps);
    console.log('Received monthlyDistance:', monthlyDistance);
    console.log('Received monthlyCalories:', monthlyCalories);
    console.log('Received monthlyHeartRate:', monthlyHeartRate);
    console.log('Received monthlyMoveMinutes:', monthlyMoveMinutes);
    console.log('Received monthlyHeartPoints:', monthlyHeartPoints);

    console.log('Received data:', {
      userId,
      age,
      weight,
      height,
      gender,
      dailySteps,
      monthlySteps,
      dailyDistance,
      monthlyDistance,
      dailyCalories,
      monthlyCalories,
      calories,
      heartRate,
      dailyHeartRate,
      monthlyHeartRate,
      dailyMoveMinutes,
      monthlyMoveMinutes,
      dailyHeartPoints,
      monthlyHeartPoints,
      sleep,
      activityDuration,
      sixMonthsSteps,
      sixMonthsDistance,
      totalCalories,
      totalSteps,
      totalDistance,
      totalHeartRate,
      totalMoveMinutes,
      dailyStepsArray,
      dailyDistanceArray,
      totalHeartPoints,
    });

    // Parse and validate incoming data
    const validSixMonthsSteps = !isNaN(parseFloat(sixMonthsSteps))
      ? parseFloat(sixMonthsSteps)
      : 0;
    const validSixMonthsDistance = !isNaN(parseFloat(sixMonthsDistance))
      ? parseFloat(sixMonthsDistance)
      : 0;

    // Find or create the fitness data record
    let fitnessData = await userFitnessInfo.findOne({ userId });
    if (!fitnessData) {
      console.log('Creating new fitness data record...');
      fitnessData = new userFitnessInfo({
        userId,
        age,
        weight,
        height,
        gender,
        totalSteps,
        totalDistance,
        totalCalories,
        totalHeartRate,
        totalMoveMinutes,
        totalHeartPoints,
        sleep,
        activityDuration,
      });
    } else {
      console.log('Updating existing fitness data record...');
      fitnessData.age = age;
      fitnessData.weight = weight;
      fitnessData.height = height;
      fitnessData.gender = gender;
      fitnessData.totalSteps = totalSteps;
      fitnessData.totalDistance = totalDistance;
      fitnessData.totalCalories = totalCalories;
      fitnessData.totalHeartRate = totalHeartRate;
      fitnessData.totalMoveMinutes = totalMoveMinutes;
      fitnessData.totalHeartPoints = totalHeartPoints;
      fitnessData.sleep = sleep;
      fitnessData.activityDuration = activityDuration;
    }

    await fitnessData.save();

    // Save daily data for each day in the current month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based month

    // Save daily steps data
    for (const stepEntry of dailySteps) {
      const formattedDate = new Date(parseInt(stepEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const steps = parseInt(stepEntry.value) || 0;

      console.log('Formatted Date Steps', formattedDate);
      console.log('Steps', steps);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({ userId, date: formattedDate, steps });
      } else {
        dailyData.steps = steps;
      }
      console.log('Daily Data steps', dailyData);
      await dailyData.save();
    }

    // Save daily distance data
    for (const distanceEntry of dailyDistance) {
      const formattedDate = new Date(parseInt(distanceEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const distance = parseFloat(distanceEntry.value) || 0;

      console.log('Formatted Date Distance', formattedDate);
      console.log('Distance', distance);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          distance,
        });
      } else {
        dailyData.distance = distance;
      }
      console.log('Daily Data distance', dailyData);
      await dailyData.save();
    }

    // Save daily calories data
    for (const caloriesEntry of dailyCalories) {
      const formattedDate = new Date(parseInt(caloriesEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const calories = parseFloat(caloriesEntry.value) || 0;

      console.log('Formatted Date Calories', formattedDate);
      console.log('Calories', calories);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          caloriesExpended: calories,
        });
      } else {
        dailyData.caloriesExpended = calories;
      }
      console.log('Daily Data calories', dailyData);
      await dailyData.save();
    }

    // Save daily Heart Points
    for (const heartpointsEntry of dailyHeartPoints) {
      const formattedDate = new Date(parseInt(heartpointsEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const heartpoints = parseInt(heartpointsEntry.value) || 0;

      console.log('Formatted Date HeartPoints', formattedDate);
      console.log('Heaart Points', heartpoints);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          heartpoints,
        });
      } else {
        dailyData.heartPoints = heartpoints;
      }
      console.log('Daily Data steps', dailyData);
      await dailyData.save();
    }

    // Save daily heart rate data
    for (const heartRateEntry of dailyHeartRate) {
      const formattedDate = new Date(parseInt(heartRateEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const heartRate = parseFloat(heartRateEntry.value) || 0;

      console.log('Formatted Date Heart Rate', formattedDate);
      console.log('Heart Rate', heartRate);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          heartRate,
        });
      } else {
        dailyData.heartRate = heartRate;
      }
      console.log('Daily Data heart rate', dailyData);
      await dailyData.save();
    }

    // Save daily move minutes data
    for (const moveMinutesEntry of dailyMoveMinutes) {
      const formattedDate = new Date(parseInt(moveMinutesEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD
      const moveMinutes = parseFloat(moveMinutesEntry.moveMinutes) || 0;

      console.log('Formatted Date Move Minutes', formattedDate);
      console.log('Move Minutes', moveMinutes);

      let dailyData = await userDailyData.findOne({
        userId,
        date: formattedDate,
      });
      if (!dailyData) {
        dailyData = new userDailyData({
          userId,
          date: formattedDate,
          moveMinutes,
        });
      } else {
        dailyData.moveMinutes = moveMinutes;
      }
      console.log('Daily Data move minutes', dailyData);
      await dailyData.save();
    }

    let monthlyData = await userMonthlyData.findOne({
      userId,
      year: currentYear,
    });

    if (!monthlyData) {
      console.log('Creating new monthly data record...');
      monthlyData = new userMonthlyData({
        userId,
        year: currentYear,
        months: [],
      });
    }

    // Prepare new monthly data
    const numberOfMonths = 6; // Number of months to process
    const currentMonthIndex = new Date().getMonth(); // 0-based index for the current month

    // Adjusted month index calculation
    const getCorrectMonth = (currentMonthIndex, offset) => {
      let monthIndex = (currentMonthIndex - offset + 12) % 12; // Ensure index is non-negative
      return monthIndex + 1; // Convert to 1-based index
    };

    // Create new monthly data
    const newMonthlyData = [];

    for (let i = 0; i < numberOfMonths; i++) {
      const month = getCorrectMonth(currentMonthIndex, i); // Ensure this returns the correct month format (e.g., YYYYMM)

      const steps = parseFloat(monthlySteps[numberOfMonths - 1 - i]) || 0;
      const distance = parseFloat(monthlyDistance[numberOfMonths - 1 - i]) || 0;
      const caloriesExpended =
        parseFloat(monthlyCalories[numberOfMonths - 1 - i]) || 0;
      const heartRate =
        parseFloat(monthlyHeartRate[numberOfMonths - 1 - i]) || 0;
      const moveMinutes =
        parseFloat(monthlyMoveMinutes[numberOfMonths - 1 - i]) || 0;
      const heartPoints =
        parseFloat(monthlyHeartPoints[numberOfMonths - 1 - i]) || 0;
      // const sleep = parseFloat(monthlySleep[i]) || 0;

      newMonthlyData.push({
        month,
        steps,
        distance,
        caloriesExpended,
        heartRate,
        moveMinutes,
        heartPoints,
        sleep,
      });
    }

    // Merge new monthly data with existing data
    const existingMonthsMap = new Map(
      (monthlyData.months || []).map(m => [m.month, m]),
    );

    newMonthlyData.forEach(m => {
      existingMonthsMap.set(m.month, m);
    });

    // Update the months array
    monthlyData.months = Array.from(existingMonthsMap.values())
      .sort((a, b) => b.month - a.month) // Sort in descending order
      .slice(0, 6); // Keep the latest 6 months

    console.log('Updated monthly data:', monthlyData.months);

    try {
      await monthlyData.save();
      console.log('Monthly data saved successfully.');
    } catch (error) {
      console.error('Error saving monthly data:', error); // Error handling
    } // Adjust this according to your saving logic

    res.send('User fitness data saved successfully');
  } catch (error) {
    console.error('Error saving user fitness data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// app.post('/save-fitness-data', async (req, res) => {
//   try {
//     await saveFitnessData(req.body);
//     res.send('User fitness data saved successfully');
//   } catch (error) {
//     console.error('Error saving user fitness data:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.post('/update-fitness-info', async (req, res) => {
  const { userId, age, weight, height, gender } = req.body;

  if (
    !userId ||
    (age === undefined &&
      weight === undefined &&
      height === undefined &&
      gender === undefined)
  ) {
    return res
      .status(400)
      .json({ error: 'User ID and at least one field to update are required' });
  }

  try {
    const updateData = {};
    if (age !== undefined) updateData.age = age;
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (gender !== undefined) updateData.gender = gender;

    const result = await userFitnessInfo.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true },
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating fitness info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/predict', middleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('req.user or req.user.id is undefined');
      return res.status(400).send('User not authenticated');
    }

    const userId = req.user.id;
    console.log('User ID:', userId);

    const userFitness = await userFitnessInfo.findOne({ userId });
    if (!userFitness) {
      console.error('User fitness info not found');
      return res.status(404).send('User fitness info not found');
    }

    const dailyData = await userDailyData
      .find({ userId })
      .sort({ date: -1 })
      .limit(1);
    if (!dailyData.length) {
      console.error('Daily data not found');
      return res.status(404).send('Daily data not found');
    }

    const monthlyData = await userMonthlyData.findOne({ userId });
    console.log('Monthly Data', monthlyData);
    if (!monthlyData || !Array.isArray(monthlyData.months)) {
      console.error('Monthly data is not available or invalid');
      return res.status(400).send('Monthly data is not available or invalid');
    }

    const input = {
      monthlyData: monthlyData.months.map(data => ({
        steps: data.steps,
        distance: data.distance,
        month: data.month,
        caloriesExpended: data.caloriesExpended,
        heartRate: data.heartRate,
        moveMinutes: data.moveMinutes,
      })),
      userInfo: {
        gender: userFitness.gender,
        weight: userFitness.weight,
        height: userFitness.height,
      },
    };

    const inputString = JSON.stringify(input);

    console.log('Input data to Python script:', inputString);

    const pythonProcess = spawn('./.venv-3.10/bin/python3', [
      'predict.py',
      inputString,
    ]);

    let predictionResult = '';

    pythonProcess.stdout.on('data', data => {
      predictionResult += data.toString();
    });

    pythonProcess.stderr.on('data', data => {
      console.error(`stderr: ${data.toString()}`);
    });

    pythonProcess.on('close', code => {
      console.log(`Python process exited with code ${code}`);
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        return res.status(500).send('Internal Server Error');
      }

      // Check if predictionResult is a string before parsing as JSON
      try {
        const prediction = JSON.parse(predictionResult.trim());
        console.log('Parsed prediction:', prediction);
        res.json(prediction);
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
        res.status(500).send('Failed to parse prediction result');
      }
    });
  } catch (error) {
    console.error('Error in /predict:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/user-calories-data', middleware, async (req, res) => {
  const userId = req.user.id;
  console.log('userID:', userId);

  try {
    const userFitness = await activityService.fetchUserFitnessInfo(userId);
    const dailyData = await activityService.fetchDailyData(userId);

    if (
      !userFitness ||
      !userFitness.weight ||
      !dailyData ||
      !userFitness.gender
    ) {
      console.error('Data or required fields are missing:', data);
      return res
        .status(500)
        .json({ error: 'Internal Server Error: Missing data' });
    }

    console.log('userFitness Data:', userFitness);

    const weight = userFitness.weight || null;
    const gender = userFitness.gender || null;
    const age = userFitness.age || null;
    const height = userFitness.height || null;

    // Helper function to format dates as YYYY-MM-DD (local time)
    function formatDateToLocalYYYYMMDD(date) {
      return date.toLocaleDateString('en-CA'); // Format as YYYY-MM-DD in local time
    }

    // Get today's date in local time
    const todayFormatted = formatDateToLocalYYYYMMDD(new Date());
    console.log('Today Date (Local Time):', todayFormatted);

    // Find today's data by explicitly converting each entry date to local time
    const todayData = dailyData.find(entry => {
      // Convert entry.date from UTC to local time
      const entryDate = new Date(entry.date);
      const entryLocalDate = new Date(
        entryDate.getUTCFullYear(),
        entryDate.getUTCMonth(),
        entryDate.getUTCDate(),
      );
      const entryFormatted = formatDateToLocalYYYYMMDD(entryLocalDate);

      // Debugging statements
      console.log('Entry Date (Local Time):', entryFormatted);

      return entryFormatted === todayFormatted;
    });

    console.log(
      'Today Data date:',
      todayData ? new Date(todayData.date).toISOString() : 'No data found',
    );
    console.log('Today Data:', todayData);
    console.log(
      'Today Data Calories Expended:',
      todayData ? todayData.caloriesExpended : 'No data found',
    );

    const caloriesExpended = todayData ? todayData.caloriesExpended : null;

    const response = {
      weight,
      caloriesExpended,
      gender,
      age,
      height,
    };
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/get-calories', middleware, async (req, res) => {
  const food = req.body.food;

  // Helper function to wrap exec in a Promise
  function execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return reject(`Error executing Python script: ${error}`);
        }
        if (stderr) {
          return reject(`Python script stderr: ${stderr}`);
        }
        resolve(stdout);
      });
    });
  }

  try {
    const command = `python3 get_calories.py calories "${food}"`;
    const stdout = await execPromise(command);

    const result = JSON.parse(stdout);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/food-suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    const suggestions = await getFoodSuggestions(query);
    res.json(suggestions);
  } catch (err) {
    console.error('Error fetching food suggestions:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/get-suggestions', (req, res) => {
  const { query } = req.body;

  exec(
    `python3 get_calories.py suggestions "${query}"`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('Internal Server Error');
      }

      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (e) {
        console.error(`JSON parse error: ${e}`);
        res.status(500).send('Internal Server Error');
      }
    },
  );
});

// app.get('/api/posts', middleware, async (req, res) => {
//   try {
//     const userId = req.user.id; // Get the current user's ID from the request

//     // Step 1: Get the current user's friends
//     const friendsDoc = await friendsSchema
//       .findOne({ userId })
//       .populate('friends.userId', 'username');

//     if (!friendsDoc) {
//       return res.status(404).json({ error: 'Friends list not found' });
//     }

//     // Collect the user IDs of the friends
//     const friendIds = friendsDoc.friends.map(friend => friend.userId);

//     // Add the current user's ID to the list of IDs to query
//     const userAndFriendIds = [userId, ...friendIds];

//     // Step 2: Find posts authored by the current user or their friends
//     const posts = await userPostsSchema
//       .find({ userId: { $in: userAndFriendIds } })
//       .populate('userId', 'username');

//     // Step 3: Separate current user's posts from other users' posts
//     const currentUserPosts = posts.filter(
//       post => post.userId._id.toString() === userId,
//     );
//     const otherUserPosts = posts.filter(
//       post => post.userId._id.toString() !== userId,
//     );

//     // Step 4: Remove the first post of every user from otherUserPosts
//     const userPostMap = new Map();
//     otherUserPosts.forEach(post => {
//       const authorId = post.userId._id.toString();
//       if (!userPostMap.has(authorId)) {
//         userPostMap.set(authorId, []);
//       }
//       userPostMap.get(authorId).push(post);
//     });

//     // Create an array of posts excluding the first post from each user
//     const filteredOtherUserPosts = [];
//     userPostMap.forEach(postsArray => {
//       // Exclude the first post
//       postsArray.shift();
//       filteredOtherUserPosts.push(...postsArray);
//     });

//     // Step 5: Return the response with both sets of posts
//     res.json({
//       currentUserPosts, // Posts created by the current user
//       otherUserPosts: filteredOtherUserPosts, // Posts created by friends (excluding the first post of each user)
//     });
//   } catch (error) {
//     console.error('Error fetching posts:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.post('/api/posts', upload.single('file'), middleware, async (req, res) => {
//   try {
//     const { title, content } = req.body;
//     const file = req.file ? req.file.filename : undefined;
//     const userId = req.user.id;

//     const user = await registerUser.findById(userId);
//     const username = user.username;

//     if (!title || !content) {
//       return res
//         .status(400)
//         .json({ error: 'Title and content are required fields' });
//     }

//     const post = new userPostsSchema({
//       userId,
//       username,
//       title,
//       content,
//       file,
//     });
//     console.log('Post', post);
//     await post.save();
//     res.status(201).json(post);
//   } catch (error) {
//     console.error('Error creating post:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.post('/api/posts/like/:postId', middleware, async (req, res) => {
//   try {
//     const postId = req.params.postId;
//     const userId = req.user.id; // Assuming `req.user` contains the logged-in user's information
//     const likedBy = [];

//     const post = await userPostsSchema.findById(postId);

//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     // // Check if user has already liked the post
//     // const postsWithUserLikeStatus = posts.map(post => {
//     //   const userHasLiked = post.likedBy.includes(userId);
//     //   return { ...post._doc, userHasLiked: userHasLiked || false }; // Ensure it's always a boolean
//     // });

//     // Add the user to likedBy

//     // Fetch username for the user who liked the post
//     const user = await registerUser.findById(userId);
//     const username = user ? user.username : 'Unknown';

//     const newLike = { userId, username };
//     post.likedBy.push(newLike);

//     // Update the post with the new like
//     post.likes += 1;
//     await post.save();

//     // Send response
//     if (post.userId === userId) {
//       likedBy.push('You');
//     } else {
//       likedBy.push(username);
//     }
//     updated_post = { ...post, likedByUser: likedBy };
//     res.json(post);
//   } catch (error) {
//     console.error('Error liking post:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.post('/api/posts/comment/:postId', middleware, async (req, res) => {
//   try {
//     const postId = req.params.postId;
//     const userId = req.user.id; // Assuming `req.user` contains the logged-in user's information
//     const { text } = req.body;
//     const commentedBy = [];

//     const post = await userPostsSchema.findById(postId);

//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     // Fetch username for the user who commented
//     const user = await registerUser.findById(userId);
//     const username = user ? user.username : 'Unknown';

//     const newComment = { userId, username, text };

//     // Add comment with user information
//     post.comments.push(newComment);
//     console.log('Comments Post', post);
//     await post.save();

//     res.json(post);
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.get('/friends', middleware, async (req, res) => {
//   const userId = req.user.id; // Assuming user ID is in req.user
//   try {
//     // Fetch the current user's friends
//     const userFriends = await friendsSchema
//       .findOne({ userId })
//       .populate('friends.userId');
//     const friends = userFriends.friends;

//     const user = await registerUser.findById(userId);

//     // Fetch heart points for each friend
//     const friendsWithHeartPoints = await Promise.all(
//       friends.map(async friend => {
//         const fitnessInfo = await userFitnessInfo.findOne({
//           userId: friend.userId,
//         });
//         return {
//           username: friend.username,
//           heartPoints: fitnessInfo.totalHeartPoints,
//           userId: friend.userId,
//         };
//       }),
//     );

//     // Sort friends by heart points
//     friendsWithHeartPoints.sort((a, b) => b.heartPoints - a.heartPoints);

//     // Fetch current user's fitness info
//     const currentUser = await userFitnessInfo.findOne({ userId });
//     const currentUserInfo = {
//       userId: user.id,
//       username: user.username, // Assuming username is stored in req.user
//       heartPoints: currentUser.totalHeartPoints,
//     };

//     res.json({
//       currentUser: currentUserInfo,
//       friends: friendsWithHeartPoints,
//     });
//     console.log({
//       currentUser: currentUserInfo,
//       friends: friendsWithHeartPoints,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/friends/request/:friendId', middleware, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const friendId = req.params.friendId;

//     // Find the friend user
//     const friend = await registerUser.findById(friendId);
//     if (!friend) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Find the requesting user
//     const user = await registerUser.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Check if the friend is already in the user's friends list
//     const userFriends = await friendsSchema.findOne({ userId: userId });
//     const isFriend = userFriends?.friends.some(
//       friend => friend.userId.toString() === friendId,
//     );
//     if (isFriend) {
//       return res.status(400).json({ error: 'User is already your friend' });
//     }

//     // Check if the friend request already exists
//     const existingRequest = await friendsSchema.findOne({
//       userId: userId,
//       'pendingRequests.userId': friendId,
//     });
//     if (existingRequest) {
//       return res.status(400).json({ error: 'Friend request already sent' });
//     }

//     // Add friend request to the user's requests
//     await friendsSchema.findOneAndUpdate(
//       { userId: userId },
//       {
//         $push: {
//           pendingRequests: { userId: friendId, username: friend.username },
//         },
//       },
//       { upsert: true },
//     );

//     // Add request to the friend's requests
//     await friendsSchema.findOneAndUpdate(
//       { userId: friendId },
//       {
//         $push: { friendRequests: { userId: userId, username: user.username } },
//       },
//       { upsert: true },
//     );

//     res.status(200).json({ message: 'Friend request sent' });
//   } catch (error) {
//     console.error('Error sending friend request:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.post('/api/friends/accept/:friendId', middleware, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const friendId = req.params.friendId;

//     // Find the friend user
//     const friend = await registerUser.findById(friendId);
//     if (!friend) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const user = await registerUser.findById(userId);

//     // Remove the friend request from both users
//     await friendsSchema.findOneAndUpdate(
//       { userId: userId },
//       { $pull: { friendRequests: { userId: friendId } } },
//     );

//     await friendsSchema.findOneAndUpdate(
//       { userId: friendId },
//       { $pull: { pendingRequests: { userId: userId } } },
//     );

//     // Add the friend to both users' friends list
//     await friendsSchema.findOneAndUpdate(
//       { userId: userId },
//       { $push: { friends: { userId: friendId, username: friend.username } } },
//     );

//     await friendsSchema.findOneAndUpdate(
//       { userId: friendId },
//       { $push: { friends: { userId: userId, username: user.username } } },
//     );

//     res.status(200).json({ message: 'Friend request accepted' });
//   } catch (error) {
//     console.error('Error accepting friend request:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.get('/api/friends/requests', middleware, async (req, res) => {
//   try {
//     const currentUserId = req.user.id;

//     // Fetch the friend's schema document for the current user
//     const friendData = await friendsSchema.findOne({ userId: currentUserId });

//     if (!friendData) {
//       return res
//         .status(404)
//         .json({ message: 'No friend data found for the user' });
//     }

//     // Get the list of friend requests received
//     const friendRequests = friendData.friendRequests;

//     // Respond with the list of friend requests
//     res.status(200).json(friendRequests);
//   } catch (error) {
//     console.error('Error fetching friend requests:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.get('/api/friends/pending', middleware, async (req, res) => {
//   try {
//     const currentUserId = req.user.id;

//     // Fetch the friend's schema document for the current user
//     const friendData = await friendsSchema.findOne({ userId: currentUserId });

//     if (!friendData) {
//       return res
//         .status(404)
//         .json({ message: 'No friend data found for the user' });
//     }

//     // Get the list of pending requests (requests sent but not accepted yet)
//     const pendingRequests = friendData.pendingRequests;

//     // Respond with the list of pending requests
//     res.status(200).json(pendingRequests);
//   } catch (error) {
//     console.error('Error fetching pending requests:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

app.get('/api/users', middleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Fetch the current user's friend requests and pending requests
    const userFriends = await friendsSchema.findOne({ userId: currentUserId });

    const friendRequests = userFriends
      ? userFriends.friendRequests.map(request => request.userId)
      : [];
    const friends = userFriends
      ? userFriends.friends.map(request => request.userId)
      : [];
    const pendingRequests = userFriends
      ? userFriends.pendingRequests.map(request => request.userId)
      : [];

    // Combine the current user ID and all excluded user IDs
    const excludedUserIds = [
      currentUserId,
      ...friendRequests,
      ...pendingRequests,
      ...friends,
    ];

    // Fetch all users except the excluded ones
    const users = await registerUser.find(
      { _id: { $nin: excludedUserIds } },
      'username',
    );

    // Respond with the filtered list of users
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// app.post('/api/friends/cancel/:userId', middleware, async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { userId } = req.params;

//     console.log('Cuuurent user ID', currentUserId);
//     console.log('userID of cancelled friend', userId);

//     // Remove the user from the friend requests array
//     await friendsSchema.updateOne(
//       { userId: currentUserId },
//       { $pull: { friendRequests: { userId: userId } } },
//     );

//     await friendsSchema.updateOne(
//       { userId: userId },
//       { $pull: { pendingRequests: { userId: currentUserId } } },
//     );

//     res.status(200).json({ message: 'Request canceled successfully' });
//   } catch (error) {
//     console.error('Error canceling friend request:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.post('/challenge', middleware, async (req, res) => {
//   const { challenging, targetSteps, targetCalories, targetDistance, deadline } =
//     req.body;
//   const challengedBy = req.user.id;
//   const userId = req.user.id;

//   try {
//     // Check if a challenge or pending challenge already exists
//     const challengeExists = await challengeSchema.findOne({
//       challenging: challenging,
//       'challenges.challengedBy': challengedBy,
//       'challenges.status': 'ongoing',
//     });

//     console.log('Challenge Exists', challengeExists);

//     const pendingExists = await challengeSchema.findOne({
//       challenging: challenging,
//       'pendingChallenges.challengedBy': challengedBy,
//     });

//     console.log('Pending Exists', pendingExists);

//     if (challengeExists || pendingExists) {
//       return res
//         .status(400)
//         .json({ message: 'Cannot challenge this user at the moment.' });
//     }

//     // Fetch challenged user's username
//     const challengedUser = await registerUser.findById(challengedBy);
//     console.log('Challenged username', challengedUser.username);
//     if (!challengedUser) {
//       return res.status(404).json({ message: 'Challenged user not found' });
//     }

//     const newPendingChallenge = {
//       challengedBy,
//       challenging,
//       startDate: new Date(),
//       deadline,
//       targetSteps: targetSteps || 0,
//       targetCalories: targetCalories || 0,
//       targetDistance: targetDistance || 0,
//       status: 'pending',
//     };

//     console.log('Pending Challenge', newPendingChallenge);

//     await challengeSchema.updateOne(
//       { userId },
//       { $push: { pendingChallenges: newPendingChallenge } },
//       { upsert: true },
//     );

//     res.status(200).json({ message: 'Challenge request sent successfully!' });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: 'Error creating challenge request', error });
//   }
// });

// app.get('/pending-challenges', middleware, async (req, res) => {
//   const challengedBy = req.user.id;

//   try {
//     // Find the user's challenges where they are the challenging user
//     const userChallenges = await challengeSchema.findOne({
//       userId: challengedBy,
//     });

//     if (!userChallenges) {
//       return res
//         .status(404)
//         .json({ message: 'No challenges found for this user' });
//     }

//     // Fetch the usernames for all challenging users
//     const userIds = userChallenges.pendingChallenges.map(
//       challenge => challenge.challenging,
//     );
//     const challengedByIds = userChallenges.pendingChallenges.map(
//       challenge => challenge.challengedBy,
//     );

//     // Fetch challenging users' details
//     const challengingUsers = await registerUser
//       .find({ _id: { $in: userIds } })
//       .lean();
//     const challengedByUsers = await registerUser
//       .find({ _id: { $in: challengedByIds } })
//       .lean();

//     // Create a map for quick lookup
//     const challengingUserMap = challengingUsers.reduce((map, user) => {
//       map[user._id.toString()] = user.username;
//       return map;
//     }, {});

//     const challengedByUserMap = challengedByUsers.reduce((map, user) => {
//       map[user._id.toString()] = user.username;
//       return map;
//     }, {});

//     // Map through the pendingChallenges to include the user information
//     const pendingChallengesWithUsernames = userChallenges.pendingChallenges.map(
//       challenge => ({
//         ...challenge.toObject(),
//         challenging: {
//           userId: challenge.challenging,
//           username:
//             challengingUserMap[challenge.challenging.toString()] || 'Unknown',
//         },
//         challengedBy: {
//           userId: challenge.challengedBy,
//           username:
//             challengedByUserMap[challenge.challengedBy.toString()] || 'Unknown',
//         },
//       }),
//     );
//     console.log(
//       'Response of pendingchallenges',
//       pendingChallengesWithUsernames,
//     );

//     res.status(200).json(pendingChallengesWithUsernames);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: 'Error fetching pending challenges', error });
//   }
// });

// app.get('/incoming-challenges', middleware, async (req, res) => {
//   const challenging = req.user.id;

//   try {
//     // Fetch challenges where the logged-in user is listed as the challengedBy in pending challenges
//     const userChallenges = await challengeSchema.find({
//       'pendingChallenges.challenging': challenging,
//     });

//     console.log('userChallenges', userChallenges);

//     // Initialize an array to store incoming challenges with sender names
//     const incomingChallenges = [];

//     for (const userChallenge of userChallenges) {
//       for (const challenge of userChallenge.pendingChallenges) {
//         if (challenge.challenging.toString() === challenging) {
//           // Fetch the challengedBy user's information
//           const challengedByUser = await registerUser.findById(
//             challenge.challengedBy,
//           );
//           const challengedByUserInfo = {
//             userId: challengedByUser
//               ? challengedByUser._id.toString()
//               : 'Unknown',
//             username: challengedByUser ? challengedByUser.username : 'Unknown',
//           };

//           // Fetch the challenging user's information
//           const challengingUser = await registerUser.findById(challenging);
//           const challengingUserInfo = {
//             userId: challenging,
//             username: challengingUser ? challengingUser.username : 'Unknown',
//           };

//           console.log('challenging User INFO', challengingUserInfo);
//           console.log('challenged by user INFO', challengedByUserInfo);

//           // Add challenges with both user information
//           const challengeWithUserInfo = {
//             ...challenge.toObject(),
//             challenging: challengingUserInfo,
//             challengedBy: challengedByUserInfo,
//           };

//           incomingChallenges.push(challengeWithUserInfo);
//         }
//       }
//     }

//     if (incomingChallenges.length === 0) {
//       return res.status(404).json({ message: 'No incoming challenges found' });
//     }

//     res.status(200).json(incomingChallenges);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: 'Error fetching incoming challenges', error });
//   }
// });

// app.post('/respond-challenge', middleware, async (req, res) => {
//   const { challengedBy, action } = req.body; // current user is challenging
//   const challenging = req.user.id; // current user is the one who received the challenge

//   try {
//     // Fetch the challenge document where the current user is the challenging user
//     const userChallenges = await challengeSchema.findOne({
//       userId: challengedBy,
//     });

//     if (!userChallenges) {
//       return res
//         .status(404)
//         .json({ message: 'No challenges found for this user' });
//     }

//     // Find the specific pending challenge where the current user is the challengedBy
//     const pendingChallenge = userChallenges.pendingChallenges.find(
//       challenge => challenge.challengedBy.toString() === challengedBy,
//     );

//     if (!pendingChallenge) {
//       return res
//         .status(404)
//         .json({ message: 'No such pending challenge found' });
//     }

//     if (action === 'accept') {
//       // Get the current UTC date and time
//       const utcDate = new Date();

//       // Define the desired time zone
//       const timeZone = 'America/Los_Angeles';

//       // Format the date to the local time zone
//       const formatter = new Intl.DateTimeFormat('en-US', {
//         timeZone,
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//       });

//       const [
//         { value: month },
//         ,
//         { value: day },
//         ,
//         { value: year },
//         ,
//         { value: hour },
//         ,
//         { value: minute },
//         ,
//         { value: second },
//       ] = formatter.formatToParts(utcDate);

//       // Construct a new Date object with the formatted date parts
//       const localDate = new Date(
//         `${year}-${month}-${day}T${hour}:${minute}:${second}`,
//       );

//       console.log('localDate', localDate);

//       const startDate = new Date(localDate);

//       console.log('startDate', startDate);

//       // Move the challenge to ongoing challenges
//       userChallenges.challenges.push({
//         ...pendingChallenge.toObject(),
//         startDate,
//         status: 'ongoing',
//       });
//     }

//     console.log(
//       'User Challenges after updating ongoing status',
//       userChallenges,
//     );

//     // Remove the challenge from pendingChallenges regardless of the action
//     userChallenges.pendingChallenges = userChallenges.pendingChallenges.filter(
//       challenge => challenge.challengedBy.toString() !== challengedBy,
//     );

//     console.log(
//       'user challenges after removing pending challenges',
//       userChallenges,
//     );

//     // Save the updated challenge data
//     await userChallenges.save();

//     // Fetch usernames for both challengedBy and challenging
//     const challengedByUser = await registerUser.findById(challengedBy);
//     const challengingUser = await registerUser.findById(challenging);

//     res.status(200).json({
//       message: `Challenge ${action}ed successfully!`,
//       challengedBy: {
//         userId: challengedBy,
//         username: challengedByUser?.username || 'Unknown',
//       },
//       challenging: {
//         userId: challenging,
//         username: challengingUser?.username || 'Unknown',
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error processing challenge', error });
//   }
// });

// app.get('/ongoing-challenges', middleware, async (req, res) => {
//   const userId = req.user.id;

//   try {
//     // Fetch challenges where the user is either challenging or challengedBy
//     const userChallenges = await challengeSchema.findOne({
//       $or: [
//         { 'challenges.challenging': userId },
//         { 'challenges.challengedBy': userId },
//       ],
//     });

//     if (!userChallenges) {
//       return res.status(404).json({ message: 'No challenges found' });
//     }

//     // Get the current UTC date and time
//     const utcDate = new Date();

//     // Define the desired time zone
//     const timeZone = 'America/Los_Angeles';

//     // Format the date to the local time zone
//     const formatter = new Intl.DateTimeFormat('en-US', {
//       timeZone,
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     });

//     const [
//       { value: month },
//       ,
//       { value: day },
//       ,
//       { value: year },
//       ,
//       { value: hour },
//       ,
//       { value: minute },
//       ,
//       { value: second },
//     ] = formatter.formatToParts(utcDate);

//     // Construct a new Date object with the formatted date parts
//     const localDate = new Date(
//       `${year}-${month}-${day}T${hour}:${minute}:${second}`,
//     );

//     const today = new Date(localDate);

//     // Process each challenge
//     const updatedChallenges = await Promise.all(
//       (userChallenges.challenges || []).map(async challenge => {
//         const {
//           status,
//           startDate,
//           deadline,
//           targetSteps,
//           targetCalories,
//           targetDistance,
//           challengedBy,
//           challenging: challengeChallenging,
//         } = challenge;

//         const challengedByUser = await registerUser.findById(challengedBy);
//         const challengingUser = await registerUser.findById(
//           challengeChallenging,
//         );

//         if (status === 'completed') {
//           // Directly return the challenge without any calculation
//           return {
//             challenge: {
//               ...challenge.toObject(),
//               progress: {
//                 totalSteps: 0,
//                 totalCalories: 0,
//                 totalDistance: 0,
//                 percentage: {
//                   steps: 100,
//                   calories: 100,
//                   distance: 100,
//                 },
//                 status: 'completed',
//               },
//               challengedBy: {
//                 userId: challengedBy,
//                 username: challengedByUser?.username || 'Unknown',
//               },
//               challenging: {
//                 userId: challengeChallenging,
//                 username: challengingUser?.username || 'Unknown',
//               },
//             },
//           };
//         }

//         if (challenge.status !== 'ongoing') {
//           return null; // Skip non-ongoing challenges
//         }

//         const startOfDay = new Date(startDate.setUTCHours(0, 0, 0, 0));
//         const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

//         // Fetch daily data within the correct date range
//         const dailyData = await userDailyData.find({
//           userId: challengeChallenging,
//           date: { $gte: startOfDay, $lte: endOfDay },
//         });

//         // Initialize totals
//         let totalSteps = 0;
//         let totalCalories = 0;
//         let totalDistance = 0;

//         // Calculate total steps, calories, and distance
//         dailyData.forEach(data => {
//           totalSteps += data.steps || 0;
//           totalCalories += data.caloriesExpended || 0;
//           totalDistance += data.distance || 0;
//         });

//         // Calculate progress percentage
//         const rawProgress = {
//           steps: targetSteps > 0 ? (totalSteps / targetSteps) * 100 : 0,
//           calories:
//             targetCalories > 0 ? (totalCalories / targetCalories) * 100 : 0,
//           distance:
//             targetDistance > 0 ? (totalDistance / targetDistance) * 100 : 0,
//         };

//         const progress = {
//           steps: Math.min(rawProgress.steps, 100),
//           calories: Math.min(rawProgress.calories, 100),
//           distance: Math.min(rawProgress.distance, 100),
//         };

//         const relevantMetrics = {
//           steps: targetSteps > 0,
//           calories: targetCalories > 0,
//           distance: targetDistance > 0,
//         };

//         // Check progress only for relevant metrics
//         let newStatus = 'ongoing';
//         const isCompleted =
//           (relevantMetrics.steps ? progress.steps >= 100 : true) &&
//           (relevantMetrics.calories ? progress.calories >= 100 : true) &&
//           (relevantMetrics.distance ? progress.distance >= 100 : true);

//         if (isCompleted) {
//           newStatus = 'completed';
//         } else if (today > new Date(deadline)) {
//           newStatus = isCompleted ? 'won' : 'lost';
//         }

//         // Update challenge status if needed
//         if (newStatus !== status) {
//           // Update challenge status in the database
//           await challengeSchema.updateOne(
//             { 'challenges._id': challenge._id },
//             { $set: { 'challenges.$.status': newStatus } },
//           );
//         }

//         return {
//           challenge: {
//             ...challenge.toObject(),
//             progress: {
//               totalSteps,
//               totalCalories,
//               totalDistance,
//               percentage: progress,
//               status: newStatus,
//             },
//             challengedBy: {
//               userId: challengedBy,
//               username: challengedByUser?.username || 'Unknown',
//             },
//             challenging: {
//               userId: challengeChallenging,
//               username: challengingUser?.username || 'Unknown',
//             },
//           },
//         };
//       }),
//     );

//     // Filter out null results from skipped challenges
//     const filteredChallenges = updatedChallenges.filter(
//       challenge => challenge !== null,
//     );

//     console.log('Filtered Challenges:', filteredChallenges);

//     // Separate challenges into won, lost, ongoing, and completed
//     const challengesWon = filteredChallenges.filter(
//       c => c.challenge.progress.status === 'won',
//     );
//     const challengesLost = filteredChallenges.filter(
//       c => c.challenge.progress.status === 'lost',
//     );
//     const challengesOngoing = filteredChallenges.filter(
//       c => c.challenge.progress.status === 'ongoing',
//     );
//     const challengesCompleted = filteredChallenges.filter(
//       c => c.challenge.progress.status === 'completed',
//     );

//     console.log({
//       challengesWon,
//       challengesLost,
//       challengesOngoing,
//       challengesCompleted,
//     });

//     // Return the categorized challenges
//     res.status(200).json({
//       challengesWon,
//       challengesLost,
//       challengesOngoing,
//       challengesCompleted,
//     });
//   } catch (error) {
//     console.error('Error Fetching Challenges:', error);
//     res.status(500).json({ message: 'Error fetching challenges', error });
//   }
// });

// app.get('/challenges/won', middleware, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Fetch challenges related to the user
//     const challenges = await challengeSchema.find({
//       $or: [
//         { 'challenges.challengedBy': userId },
//         { 'challenges.challenging': userId },
//       ],
//     });

//     // Filter won challenges
//     const wonChallenges = challenges.reduce((acc, challenge) => {
//       const userWonChallenges = challenge.challenges.filter(
//         c =>
//           c.status === 'completed' &&
//           (c.challengedBy.toString() === userId.toString() ||
//             c.challenging.toString() === userId.toString()),
//       );
//       return acc.concat(userWonChallenges);
//     }, []);

//     // Extract unique user IDs
//     const userIds = Array.from(
//       new Set([
//         ...wonChallenges.map(c => c.challengedBy.toString()),
//         ...wonChallenges.map(c => c.challenging.toString()),
//       ]),
//     );

//     // Fetch usernames for these user IDs
//     const users = await registerUser
//       .find({ _id: { $in: userIds } })
//       .select('username _id');
//     const userMap = users.reduce((map, user) => {
//       map[user._id.toString()] = user.username;
//       return map;
//     }, {});

//     // Add usernames to won challenges
//     const wonChallengesWithUsernames = wonChallenges.map(challenge => ({
//       ...challenge._doc,
//       challengedByUsername: userMap[challenge.challengedBy.toString()],
//       challengingUsername: userMap[challenge.challenging.toString()],
//     }));

//     res.json(wonChallengesWithUsernames);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// app.get('/challenges/lost', middleware, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Fetch challenges related to the user
//     const challenges = await challengeSchema.find({
//       $or: [
//         { 'challenges.challengedBy': userId },
//         { 'challenges.challenging': userId },
//       ],
//     });

//     // Filter lost challenges
//     const lostChallenges = challenges.reduce((acc, challenge) => {
//       const userLostChallenges = challenge.challenges.filter(
//         c =>
//           c.status === 'lost' &&
//           (c.challengedBy.toString() === userId.toString() ||
//             c.challenging.toString() === userId.toString()),
//       );
//       return acc.concat(userLostChallenges);
//     }, []);

//     // Extract unique user IDs
//     const userIds = Array.from(
//       new Set([
//         ...lostChallenges.map(c => c.challengedBy.toString()),
//         ...lostChallenges.map(c => c.challenging.toString()),
//       ]),
//     );

//     // Fetch usernames for these user IDs
//     const users = await registerUser
//       .find({ _id: { $in: userIds } })
//       .select('username _id');
//     const userMap = users.reduce((map, user) => {
//       map[user._id.toString()] = user.username;
//       return map;
//     }, {});

//     // Add usernames to lost challenges
//     const lostChallengesWithUsernames = lostChallenges.map(challenge => ({
//       ...challenge._doc,
//       challengedByUsername: userMap[challenge.challengedBy.toString()],
//       challengingUsername: userMap[challenge.challenging.toString()],
//     }));

//     res.json(lostChallengesWithUsernames);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

app.post('/api/filter-exercises', (req, res) => {
  const { selectedBodyParts } = req.body;

  if (
    !Array.isArray(selectedBodyParts) ||
    selectedBodyParts.some(part => typeof part !== 'string')
  ) {
    return res.status(400).send('Invalid input');
  }

  const pythonProcess = spawn('python3', [
    'process_exercises.py',
    ...selectedBodyParts,
  ]);

  let dataBuffer = '';

  pythonProcess.stdout.on('data', data => {
    dataBuffer += data.toString();
  });

  pythonProcess.stdout.on('end', () => {
    try {
      const exercises = JSON.parse(dataBuffer);
      res.json(exercises);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      res.status(500).send('Error parsing data');
    }
  });

  pythonProcess.stderr.on('data', data => {
    console.error(`Error: ${data.toString()}`);
    res.status(500).send('Error processing data');
  });
});

// Send a message
app.post('/send-message', async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;
    const chat = await chatSchema.findOne({ chatId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Add message to chat
    chat.messages.push({ senderId, text });

    // Limit messages to 100
    if (chat.messages.length > 100) {
      chat.messages.shift(); // Remove the oldest message
    }

    chat.updatedAt = Date.now();
    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});

app.get('/api/chat-history', middleware, async (req, res) => {
  try {
    const { friendId } = req.query;
    const userId = req.user.id; // Assuming you have user authentication

    if (!userId || !friendId) {
      return res
        .status(400)
        .json({ error: 'userId and friendId are required' });
    }

    // Find the chat document where both userId and friendId are participants
    const chat = await chatSchema.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId } },
          { $elemMatch: { userId: friendId } },
        ],
      },
    });

    if (chat) {
      // Get usernames for each sender
      const messagesWithUsernames = await Promise.all(
        chat.messages.map(async message => {
          const senderUsername = await getUsername(message.senderId);
          return {
            ...message.toObject(),
            senderUsername,
          };
        }),
      );

      console.log('MESSAGES', messagesWithUsernames);

      res.json(messagesWithUsernames);
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/start-chat', async (req, res) => {
  const { userId1, userId2 } = req.body;
  try {
    const chat = await chatSchema.findOne({
      participants: { $all: [{ userId: userId1 }, { userId: userId2 }] },
    });
    if (chat) {
      res.json({ chatId: chat._id });
    } else {
      const newChat = new chatSchema({
        participants: [
          { userId: userId1, username: await getUsername(userId1) },
          { userId: userId2, username: await getUsername(userId2) },
        ],
      });
      await newChat.save();
      res.json({ chatId: newChat._id });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// app.post('/api/search-youtube', async (req, res) => {
//   const { bodyPart, exerciseName } = req.body;
//   const query = `${bodyPart} ${exerciseName}`;

//   try {
//     const response = await axios.get(YOUTUBE_API_URL, {
//       params: {
//         part: 'snippet',
//         q: query,
//         type: 'video',
//         maxResults: 1,
//         key: YOUTUBE_API_KEY,
//       },
//     });

//     const video = response.data.items[0];
//     if (video) {
//       const videoId = video.id.videoId;
//       const videoTitle = video.snippet.title;
//       const videoThumbnail = video.snippet.thumbnails.default.url;
//       const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

//       res.json({ videoUrl, videoTitle, videoThumbnail });
//     } else {
//       res.status(404).send('No video found');
//     }
//   } catch (error) {
//     console.error('Error fetching YouTube video:', error);
//     res.status(500).send('Error fetching video');
//   }
// });

app.post('/create-community', middleware, async (req, res) => {
  try {
    const { name, description, participants, goal } = req.body;
    const creatorId = req.user.id;

    // Add creator to the participants list
    const creatorParticipant = {
      userId: creatorId, // Use the creator's user ID
      username: (await getUsername(creatorId)) || 'Creator', // Assuming you have username in req.user
      progress: 0, // Default progress
      points: 0, // Default points
      badges: [], // Initialize with empty badges array
    };

    // Add creatorParticipant to the existing participants array
    const participantsList = [
      creatorParticipant,
      ...participants, // Spread the existing participants
    ];

    // Validate and set default values for the goal
    const communityGoal = {
      target: goal?.target || 0, // Default goal target if not provided
      startDate: goal?.startDate || new Date(), // Default start date to now
      deadline: goal?.deadline || new Date(), // Default deadline
      goalType: goal?.goalType || 'steps', // Default goal type
      progressType: goal?.progressType || 'total', // Default progress type
      status: goal?.status || 'active', // Default status
      badgeType: goal?.badgeType || 'Bronze', // Default badge type
      badgePoints: goal?.badgePoints || 0, // Default badge points
    };

    // Initialize leaderboard
    const leaderboard = participantsList.map(participant => ({
      userId: participant.userId,
      username: participant.username,
      rank: 0, // Default rank
      progress: 0, // Default progress
    }));

    const newCommunity = new communitySchema({
      creatorId,
      name,
      description,
      participants: participantsList, // Use the updated participants list
      goal: communityGoal, // Use the structured goal object
      leaderboard,
      messages: [], // Initialize as an empty array for new community
    });

    await newCommunity.save();
    res.status(201).json(newCommunity);
  } catch (error) {
    res.status(500).json({ message: 'Error creating community', error });
  }
});

// Get all communities
app.get('/communities', middleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const communities = await communitySchema
      .find()
      .populate('creatorId', 'username');
    res.status(200).json({ communities, userId });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching communities', error });
  }
});

// Join a community
app.post('/join-community/:communityId', middleware, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.id;

    // Find the community by ID
    const community = await communitySchema.findById(communityId);

    // Check if the community exists
    if (!community) {
      return res.status(404).json({ message: 'Community not found.' });
    }

    // Check if the user is already a member
    if (
      community.participants.some(participant =>
        participant.userId.equals(userId),
      )
    ) {
      return res
        .status(400)
        .json({ message: 'You are already a member of this community.' });
    }

    // Get the username for the user
    const username = await getUsername(userId); // Assuming you have a function to get the username

    // Add the user to the community's participants list
    community.participants.push({
      userId: new mongoose.Types.ObjectId(userId), // Ensure userId is added
      username: username, // Use the fetched username
      progress: 0, // Default progress
      badges: [], // Initialize with empty badges array
      points: 0, // Default points
    });

    // Optionally update the leaderboard if needed
    community.leaderboard.push({
      userId: new mongoose.Types.ObjectId(userId),
      username: username,
      rank: 0, // Default rank
      progress: 0, // Default progress
    });

    await community.save();

    res.status(200).json({ message: 'Successfully joined the community!' });
  } catch (error) {
    console.error(
      'Error joining community:',
      error.response?.data || error.message,
    );
  }
});

// Get community details
app.get('/community/:communityId', middleware, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.id;

    // Fetch the community and its participants
    const community = await communitySchema
      .findById(communityId)
      .populate('participants.userId', 'username');

    // Ensure the community was found
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Fetch the usernames
    const userName = await getUsername(userId);
    const creatorName =
      userId !== community.creatorId
        ? await getUsername(community.creatorId)
        : userName;

    res.status(200).json({ community, userId, userName, creatorName });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching community details', error });
  }
});

// Fetch chat history for a community
app.get('/community/:communityId/messages', middleware, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.id;

    // Find the community and populate messages
    const community = await communitySchema
      .findById(communityId)
      .populate('messages.senderId', 'username');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const messages = community.messages.map(message => ({
      senderUsername: message.senderUsername,
      text: message.text,
      timestamp: message.timestamp,
    }));

    const currentUsername = getUsername(userId);

    // Send the chat history along with the current user's username
    res.status(200).json({
      messages,
      currentUsername,
      userId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history', error });
  }
});

app.post('/community/:communityId/message', middleware, async (req, res) => {
  const { communityId } = req.params;
  const { text } = req.body;
  const userId = req.user.id; // Ensure req.user.id exists and is valid

  try {
    const community = await communitySchema.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if userId exists
    if (userId) {
      // Add new message to the community's messages array
      community.messages.push({
        senderId: mongoose.Types.ObjectId(userId), // userId added here
        senderUsername: await getUsername(userId),
        text: String(text),
        timestamp: new Date(),
      });

      // Validate that all participants have a valid userId before saving
      if (community.participants.some(participant => !participant.userId)) {
        return res
          .status(400)
          .json({ message: 'One or more participants have missing userId' });
      }

      // Save the updated community
      await community.save();

      // Emit message to the community room via socket
      io.to(communityId).emit('message', {
        senderId: userId,
        senderUsername: await getUsername(userId),
        text,
      });

      return res.status(200).json(community.messages);
    } else {
      return res.status(400).json({ message: 'User ID missing' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error sending message', error });
  }
});

app.get('/community/:communityId/leaderboard', middleware, async (req, res) => {
  try {
    const { communityId } = req.params;

    // Find the community by ID and populate its participants
    const community = await communitySchema
      .findById(communityId)
      .select('participants');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const participants = community.participants || [];
    const userId = req.user.id; // Assuming userId is in the request context
    const username = await getUsername(userId); // Fetch the current user's username

    // Calculate the total points for each participant
    for (let participant of participants) {
      // Assuming points are already calculated and stored in the participant object
      // You may want to implement logic here to calculate points based on badges or goals
      participant.points = participant.badges.reduce(
        (total, badge) => total + badge.points,
        0,
      ); // Example calculation
      console.log('badges array', participant.badges);
    }

    // Sort participants by total points in descending order
    participants.sort((a, b) => b.points - a.points);

    // Prepare the response data
    const leaderboardData = participants.map(participant => ({
      userId: participant.userId,
      username: participant.username || 'Unknown User',
      bronze:
        participant.badges.filter(badge => badge.type === 'Bronze').length || 0,
      silver:
        participant.badges.filter(badge => badge.type === 'Silver').length || 0,
      gold:
        participant.badges.filter(badge => badge.type === 'Gold').length || 0,
      points: participant.points,
    }));

    // Send the leaderboard data along with current user information
    res.json({
      participants: leaderboardData,
      currentUserId: userId,
      currentUsername: username,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

app.post('/api/community/:communityId/set-goal', async (req, res) => {
  const { communityId } = req.params;
  const { target, goalType, deadline, startDate, badgeType, badgePoints } =
    req.body; // Include badgeType and badgePoints

  try {
    const community = await communitySchema.findById(communityId);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Ensure that required fields are provided
    if (
      target === undefined ||
      !goalType ||
      !deadline ||
      !startDate ||
      !badgeType ||
      badgePoints === undefined
    ) {
      return res.status(400).json({ message: 'All goal fields are required' });
    }

    // Set the new goal
    community.goal = {
      target,
      startDate,
      deadline,
      goalType,
      progressType: 'total', // Default progress type
      status: 'active', // Set status to active
      badgeType, // Badge type
      badgePoints, // Badge points
    };

    await community.save();

    res
      .status(200)
      .json({ message: 'Goal set successfully', goal: community.goal });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error setting the goal', error: err.message });
  }
});

app.get('/community/:communityId/goals', middleware, async (req, res) => {
  try {
    const { communityId } = req.params;
    const currentDate = new Date();

    // Find the community by ID and populate its goal and participants
    const community = await communitySchema
      .findById(communityId)
      .select('goal participants');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const { goal, participants } = community;
    console.log('GOAL', goal);
    const userId = req.user.id; // Assuming userId is in the request context
    const currentParticipant = participants.find(p => p.userId.equals(userId));
    const username = await getUsername(userId);

    // If the goal status is active
    if (goal.status === 'active') {
      // Check if the goal's deadline has passed
      if (currentDate > new Date(goal.deadline)) {
        goal.status = 'completed'; // Update goal status to completed

        // Calculate the progress of all participants from startDate to deadline
        for (let participant of participants) {
          // Calculate total progress based on the goal type
          const totalProgress = await calculateProgress(
            participant.userId,
            goal.startDate,
            goal.deadline,
            goal.goalType,
          );

          // Update participant progress
          participant.progress = totalProgress;

          // Check if the participant reached the goal
          if (participant.progress >= goal.target) {
            // Assign badge and update points
            const badgePoints = goal.badgePoints;
            const badgeType = goal.badgeType;

            participant.badges.push({ type: badgeType, points: badgePoints });
            participant.points += badgePoints;
          } else {
            // Deduct 1 point if they didn't meet the goal
            participant.points -= 1;
          }

          // Remove the participant if points are -10 or below
          if (participant.points <= -10) {
            participants.splice(participants.indexOf(participant), 1);
          }
        }

        // Remove the goal from the community
        await community.updateOne(
          { _id: communityId },
          { $unset: { goal: '' } },
        );

        // Reload the community to reflect the removal of the goal in memory
        community = await communitySchema
          .findById(communityId)
          .select('goal participants');
        console.log('After reloading:', community);
        console.log('Before saving:', community);

        // Save updated community with progress and badges
        await community.save();

        return res.json({
          goal: community.goal, // This will be null
          participants: community.participants,
          currentParticipant: currentParticipant,
          currentUserId: userId,
          currentUsername: username,
        });
      } else {
        // If goal is still active, calculate progress till the current date
        for (let participant of participants) {
          const totalProgress = await calculateProgress(
            participant.userId,
            goal.startDate,
            currentDate,
            goal.goalType,
          );
          participant.progress = totalProgress;
        }

        // Save the updated community with progress
        await community.save();
      }
    }

    if (currentParticipant) {
      const currentProgress = await calculateCurrentProgress(
        currentParticipant.userId,
        goal.startDate,
        currentDate, // Up to the current date
        goal.goalType,
      );

      currentParticipant.progress = currentProgress;

      // Save the updated progress only for the current participant
      await community.save();
    }

    // Send the goals and participants back to the frontend
    res.json({
      goal: community.goal, // This will be updated based on the checks above
      participants: community.participants,
      currentParticipant: currentParticipant,
      currentUserId: userId,
      currentUsername: username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching goals' });
  }
});

// Helper function to calculate current progress from start date to current date
async function calculateCurrentProgress(
  userId,
  startDate,
  currentDate,
  goalType,
) {
  const dailyData = await userDailyData
    .find({
      userId: userId,
      date: { $gte: startDate, $lte: currentDate },
    })
    .select(goalType); // Select only the goalType (e.g., 'steps', 'distance')

  // Sum up the progress based on the goalType
  const currentProgress = dailyData.reduce(
    (sum, day) => sum + day[goalType],
    0,
  );
  console.log('current progress', currentProgress);
  return currentProgress;
}

const calculateProgress = async (userId, startDate, endDate, goalType) => {
  try {
    // Fetch the user's daily data between the start and end date
    const dailyData = await userDailyData.find({
      userId: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate total progress based on the goal type
    let totalProgress = 0;
    dailyData.forEach(data => {
      if (goalType === 'steps') {
        totalProgress += data.steps;
      } else if (goalType === 'distance') {
        totalProgress += data.distance;
      } else if (goalType === 'calories') {
        totalProgress += data.caloriesExpended;
      } else if (goalType === 'heartPoints') {
        totalProgress += data.heartPoints;
      }
    });

    return totalProgress;
  } catch (error) {
    console.error('Error calculating progress:', error);
    return 0;
  }
};

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Socket.IO events
io.on('connection', socket => {
  console.log('New client connected:', socket.id);

  // Private chat message handler
  socket.on('message', async data => {
    console.log('Received private chat message:', data);

    try {
      const chat = await chatSchema.findOne({
        participants: {
          $all: [
            { $elemMatch: { userId: data.userId } },
            { $elemMatch: { userId: data.friendId } },
          ],
        },
      });

      if (chat) {
        chat.messages.push({
          senderId: data.userId,
          text: data.content,
          timestamp: new Date(),
        });

        chat.updatedAt = new Date();

        await chat.save();

        // Emit only to the involved users
        io.to(data.userId)
          .to(data.friendId)
          .emit('message', {
            senderUsername: await getUsername(data.userId),
            text: data.content,
          });
      } else {
        const newChat = new chatSchema({
          chatId: new mongoose.Types.ObjectId(),
          participants: [
            { userId: data.userId, username: await getUsername(data.userId) },
            {
              userId: data.friendId,
              username: await getUsername(data.friendId),
            },
          ],
          messages: [
            {
              senderId: data.userId,
              text: data.content,
              timestamp: new Date(),
            },
          ],
        });

        await newChat.save();

        io.to(data.userId)
          .to(data.friendId)
          .emit('message', {
            senderUsername: await getUsername(data.userId),
            text: data.content,
          });
      }
    } catch (error) {
      console.error('Error handling private chat message:', error);
    }
  });

  // Community message handler
  socket.on('communityMessage', async data => {
    const { communityId, userId, content } = data;
    console.log('Received community message:', data);

    try {
      const community = await communitySchema.findById(communityId);

      if (!community) {
        return socket.emit('error', { message: 'Community not found' });
      }

      // Add message to the community's messages array
      community.messages.push({
        senderId: userId,
        senderUsername: await getUsername(userId),
        text: content,
        timestamp: new Date(),
      });

      await community.save();

      // Emit the message to all users in the community room
      io.to(`community-${communityId}`).emit('communityMessage', {
        senderId: userId,
        senderUsername: await getUsername(userId),
        text: content,
      });

      console.log('Community message sent to room:', communityId);
    } catch (error) {
      console.error('Error handling community message:', error);
      socket.emit('error', { message: 'Error sending community message' });
    }
  });

  // Handle joining a community room
  socket.on('joinCommunity', communityId => {
    console.log(`User joined community: ${communityId}`);
    socket.join(`community-${communityId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
