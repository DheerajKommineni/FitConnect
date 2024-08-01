const express = require('express');
const mongoose = require('mongoose');
const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
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
const { execFile } = require('child_process');
const { spawn } = require('child_process');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 8000;
const sessionSecret = crypto.randomBytes(64).toString('hex');

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
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/userinfo.profile',
];

mongoose
  .connect(
    'mongodb+srv://dheerajkommineni123:Dheeraj123ms@cluster0.ptcotdp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    { useNewUrlParser: true, useUnifiedTopology: true },
  )
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Connection Error:', err));

const corsOptions = {
  origin: 'http://localhost:5173', // Allow requests only from this origin
  credentials: true, // Allow credentials like cookies, authorization headers
};

app.use(express.json());
app.use(cors(corsOptions));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Adjust secure option based on your HTTPS setup
  }),
);

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

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;
    let exist = await registerUser.findOne({ email });
    if (exist) {
      return res.status(400).send('User Already Exists');
    }
    if (password !== confirmpassword) {
      return res.status(400).send('Passwords Do Not Match');
    }
    let newUser = new registerUser({
      username,
      email,
      password,
      confirmpassword,
    });
    await newUser.save();

    // Add initial fitness data for the user (with null values)
    let fitnessData = new userFitnessInfo({
      userId: newUser._id, // Assuming _id is used as userId
      age: null,
      weight: null,
      height: null,
      gender: null,
      steps: 0,
      distance: 0,
    });
    await fitnessData.save();

    // Add initial daily data (optional, can be empty or have default values)
    let dailyData = new userDailyData({
      userId: newUser._id,
      date: new Date(), // You can set it to the current date or leave it empty
      steps: 0,
      distance: 0,
    });
    await dailyData.save();

    // Add initial monthly data (initialize with current month and year)
    let currentDate = new Date();
    let month = currentDate.getMonth(); // Months are 0-based in JavaScript
    let year = currentDate.getFullYear();
    let monthlyData = new userMonthlyData({
      userId: newUser._id,
      year: year,
      months: [
        {
          month: month,
          steps: 0,
          distance: 0,
        },
      ],
    });
    await monthlyData.save();

    return res.status(200).send('Registered Successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let exist = await registerUser.findOne({ email });
    if (!exist) {
      return res.status(400).send('User Not Found');
    }
    if (exist.password !== password) {
      return res.status(400).send('Invalid Credentials');
    }

    let payload = {
      user: {
        id: exist.id,
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600000 },
      (err, token) => {
        if (err) throw err;
        console.log('User logged in, JWT generated:', token);
        req.session.userId = exist.id;
        console.log('user id stored in session', exist.id);
        console.log('testing if it is stored', req.session.userId);
        return res.json({ token });
      },
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/dashboard', middleware, async (req, res) => {
  try {
    let exist = await registerUser.findById(req.user.id);
    if (!exist) {
      return res.status(400).send('User Not Found');
    }
    res.json(exist);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/google-auth', middleware, (req, res) => {
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
});

app.get('/google-auth/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  console.log('Received Google OAuth callback with code:', code);
  console.log('Received state:', state);

  if (!code) {
    return res.status(400).json({ error: 'No code parameter found in URL' });
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    req.session.tokens = tokens;
    console.log('Tokens received:', tokens);

    // Fetch Google Fit data using the access token
    const fitData = await fetchGoogleFitData(tokens.access_token);

    // Assuming userId is stored in state and passed as JSON
    const { xToken, userId } = JSON.parse(decodeURIComponent(state));
    console.log('Parsed userId from state:', userId);

    if (!userId) {
      throw new Error('User ID is missing from state');
    }

    console.log('FitData in callback function', fitData);
    console.log(
      'Detailed log of fitData',
      fitData.dailySteps,
      fitData.monthlySteps,
      fitData.totalSteps,
      fitData.dailyDistance,
      fitData.monthlyDistance,
      fitData.totalDistance,
      fitData.monthlySteps,
      fitData.monthlyDistance,
      fitData.dailyStepsArray,
      fitData.dailyDistanceArray,
    );

    const monthlyStepsArray = fitData.monthlySteps.map(
      step => parseFloat(step) || 0,
    );
    const monthlyDistanceArray = fitData.monthlyDistance.map(
      distance => parseFloat(distance) || 0,
    );

    console.log('Steps Array in callback', monthlyStepsArray);
    console.log('Distance Array in callback', monthlyDistanceArray);

    // Save fitness data
    const saveFitnessResponse = await axios.post(
      'http://localhost:8000/save-fitness-data',
      {
        userId,
        age: fitData.age, // Assuming fitData includes age
        weight: fitData.weight, // Assuming fitData includes weight
        height: fitData.height, // Assuming fitData includes height
        gender: fitData.gender, // Assuming fitData includes gender
        steps: fitData.totalSteps,
        distance: fitData.totalDistance,
        dailySteps: fitData.dailySteps,
        monthlySteps: fitData.monthlySteps,
        sixMonthsSteps: fitData.totalSteps,
        dailyDistance: fitData.dailyDistance,
        monthlyDistance: fitData.monthlyDistance,
        sixMonthsDistance: fitData.totalDistance,
        dailyStepsArray: fitData.dailyStepsArray,
        dailyDistanceArray: fitData.dailyDistanceArray,
      },
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    console.log('Fitness Data Saved:', saveFitnessResponse.data);

    // Redirect to the activity page with the access token in the query parameters
    res.redirect(
      `http://localhost:5173/my-activity?access_token=${tokens.access_token}`,
    );
  } catch (error) {
    console.error(
      'Error handling callback:',
      error.response ? error.response.data : error.message,
    );
    res.status(500).json({
      error: error.response
        ? error.response.data.error
        : 'Failed to handle Google OAuth callback',
    });
  }
});

// Updated /activity endpoint in the backend
app.get('/activity', middleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userFitness = await userFitnessInfo.findOne({ userId });

    if (!userFitness) {
      return res.status(404).send('User fitness data not found');
    }

    // Fetch daily data
    const dailyData = await userDailyData.find({ userId });
    // console.log('Daily Data:', dailyData);

    // Fetch monthly data
    const currentYear = new Date().getFullYear();
    const monthlyData = await userMonthlyData.findOne({
      userId,
      year: currentYear,
    });

    // Extract months array from the found document
    const monthsData = monthlyData ? monthlyData.months : [];

    // console.log('Monthly Data:', monthsData);

    res.json({
      ...userFitness.toObject(),
      dailyData,
      monthlyData: monthsData, // Use the extracted months array
    });
  } catch (err) {
    console.log('Error:', err); // Log the error
    res.status(500).send('Internal Server Error');
  }
});

const fetchGoogleFitData = async accessToken => {
  // Calculate time ranges dynamically
  const now = new Date();

  // Current month start and end times
  const dailyStartTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).getTime();
  const dailyEndTime = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getTime();

  // Six months start and end times
  const sixMonthsStartTime = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
  ).getTime(); // 6 months ago from now
  const sixMonthsEndTime = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getTime(); // End of current month

  // Extract steps and distance from the responses
  const extractData = (response, dataType) => {
    if (!response || !response.bucket) {
      console.log('Invalid response structure.');
      return new Big(0);
    }

    return response.bucket.reduce((total, bucket) => {
      if (!bucket.dataset) {
        console.log('No dataset in bucket.');
        return total;
      }

      return bucket.dataset.reduce((bucketTotal, dataset) => {
        if (!dataset.point) {
          console.log('No points in dataset.');
          return bucketTotal;
        }

        return dataset.point.reduce((pointTotal, point) => {
          const value = point.value[0] ? point.value[0][dataType] : 0;
          return pointTotal.plus(new Big(value));
        }, bucketTotal);
      }, total);
    }, new Big(0));
  };

  const fetchData = async (start, end, durationMillis, dataType) => {
    console.log(`Fetching ${dataType} data from ${start} to ${end}...`);
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: dataType }],
            bucketByTime: { durationMillis },
            startTimeMillis: start,
            endTimeMillis: end,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response Text:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Response Data:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  try {
    // Fetch data for the current month
    const dailyStepsData = await fetchData(
      dailyStartTime,
      dailyEndTime,
      86400000, // 1 day in milliseconds
      'com.google.step_count.delta',
    );

    const dailyDistanceData = await fetchData(
      dailyStartTime,
      dailyEndTime,
      86400000, // 1 day in milliseconds
      'com.google.distance.delta',
    );

    // Extract daily steps and distance data
    const extractDailyData = (response, dataType) => {
      const dailyData = [];
      if (response && response.bucket) {
        response.bucket.forEach(bucket => {
          if (bucket.dataset) {
            bucket.dataset.forEach(dataset => {
              if (dataset.point) {
                dataset.point.forEach(point => {
                  const timestamp = bucket.startTimeMillis;
                  const value = point.value[0] ? point.value[0][dataType] : 0;
                  dailyData.push({ timestamp, value: new Big(value) });
                });
              }
            });
          }
        });
      }
      return dailyData;
    };

    const dailyStepsArray = extractDailyData(dailyStepsData, 'intVal');
    const dailyDistanceArray = extractDailyData(dailyDistanceData, 'fpVal');

    // Fetch 6 months data in smaller intervals
    const sixMonthsSteps = [];
    const sixMonthsDistance = [];
    let totalSteps = new Big(0);
    let totalDistance = new Big(0);
    const interval = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    let start = sixMonthsStartTime;
    const end = sixMonthsEndTime;

    while (start < end) {
      const intervalEnd = Math.min(start + interval, end);
      const intervalStepsData = await fetchData(
        start,
        intervalEnd,
        interval,
        'com.google.step_count.delta',
      );
      sixMonthsSteps.push(intervalStepsData);

      const intervalDistanceData = await fetchData(
        start,
        intervalEnd,
        interval,
        'com.google.distance.delta',
      );
      sixMonthsDistance.push(intervalDistanceData);

      totalSteps = totalSteps.plus(extractData(intervalStepsData, 'intVal'));
      totalDistance = totalDistance.plus(
        extractData(intervalDistanceData, 'fpVal'),
      );

      start = intervalEnd; // Move start to the end of the current interval
    }

    // Prepare monthly data array for last 6 months
    const monthlyStepsArray = [];
    const monthlyDistanceArray = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
      ).getTime();
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
      ).getTime();

      const monthStepsData = await fetchData(
        monthStart,
        monthEnd,
        2592000000, // 1 month in milliseconds
        'com.google.step_count.delta',
      );

      const monthDistanceData = await fetchData(
        monthStart,
        monthEnd,
        2592000000, // 1 month in milliseconds
        'com.google.distance.delta',
      );

      monthlyStepsArray.unshift(
        extractData(monthStepsData, 'intVal').toString(),
      );
      monthlyDistanceArray.unshift(
        extractData(monthDistanceData, 'fpVal').toString(),
      );
    }

    console.log('Parsed Data:', {
      dailyStepsArray: dailyStepsArray.map(d => ({
        timestamp: d.timestamp,
        steps: d.value.toString(),
      })),
      dailyDistanceArray: dailyDistanceArray.map(d => ({
        timestamp: d.timestamp,
        distance: d.value.toString(),
      })),
      dailySteps: dailyStepsArray.map(d => ({
        timestamp: d.timestamp,
        steps: d.value.toString(),
      })),
      dailyDistance: dailyDistanceArray.map(d => ({
        timestamp: d.timestamp,
        distance: d.value.toString(),
      })),
      monthlySteps: monthlyStepsArray,
      monthlyDistance: monthlyDistanceArray,
      totalSteps: totalSteps.toString(),
      totalDistance: totalDistance.toString(),
    });

    return {
      dailyStepsArray: dailyStepsArray.map(d => ({
        timestamp: d.timestamp,
        steps: d.value.toString(),
      })),
      dailyDistanceArray: dailyDistanceArray.map(d => ({
        timestamp: d.timestamp,
        distance: d.value.toString(),
      })),
      dailySteps: extractData(dailyStepsData, 'intVal').toString(),
      dailyDistance: extractData(dailyDistanceData, 'fpVal').toString(),
      monthlySteps: monthlyStepsArray,
      monthlyDistance: monthlyDistanceArray,
      totalSteps: totalSteps.toString(),
      totalDistance: totalDistance.toString(),
    };
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
    throw error;
  }
};

app.post('/save-fitness-data', async (req, res) => {
  try {
    const {
      userId,
      age,
      weight,
      height,
      gender,
      dailySteps,
      monthlySteps = [],
      sixMonthsSteps,
      dailyDistance,
      monthlyDistance = [],
      sixMonthsDistance,
      dailyStepsArray = [],
      dailyDistanceArray = [],
    } = req.body;

    console.log('Received data:', {
      userId,
      age,
      weight,
      height,
      gender,
      dailySteps,
      monthlySteps,
      sixMonthsSteps,
      dailyDistance,
      monthlyDistance,
      sixMonthsDistance,
      dailyStepsArray,
      dailyDistanceArray,
    });

    // Parse and validate incoming data
    const validDailySteps = !isNaN(parseFloat(dailySteps))
      ? parseFloat(dailySteps)
      : 0;
    const validDailyDistance = !isNaN(parseFloat(dailyDistance))
      ? parseFloat(dailyDistance)
      : 0;
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
        age: age || 0,
        weight: weight || 0,
        height: height || 0,
        gender: gender || '',
        steps: validSixMonthsSteps,
        distance: validSixMonthsDistance,
      });
    } else {
      console.log('Updating existing fitness data record...');
      fitnessData.age = age || fitnessData.age;
      fitnessData.weight = weight || fitnessData.weight;
      fitnessData.height = height || fitnessData.height;
      fitnessData.gender = gender || fitnessData.gender;
      fitnessData.steps = validSixMonthsSteps;
      fitnessData.distance = validSixMonthsDistance;
    }

    await fitnessData.save();

    // Save daily data for each day in the current month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // Zero-based month

    // Iterate over the dailyStepsArray and dailyDistanceArray to save data
    for (const stepEntry of dailyStepsArray) {
      const formattedDate = new Date(parseInt(stepEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD

      console.log('Formatted Date Steps', formattedDate);
      const steps = parseFloat(stepEntry.steps) || 0;

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

    for (const distanceEntry of dailyDistanceArray) {
      const formattedDate = new Date(parseInt(distanceEntry.timestamp))
        .toISOString()
        .slice(0, 10); // YYYY-MM-DD

      console.log('Formatted Date Distance', formattedDate);
      const distance = parseFloat(distanceEntry.distance) || 0;

      console.log('distance', distance);

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

    // Save or update monthly data
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
    const newMonthlyData = [];
    const currentMonthIndex = currentMonth + 1; // 1-based month
    const numberOfMonths = monthlySteps.length;

    // Populate the new monthly data
    for (let i = 0; i < numberOfMonths; i++) {
      const month =
        ((currentMonthIndex - (numberOfMonths - 1 - i) + 11) % 12) + 1; // Adjust month index to be 1-based
      const steps = parseFloat(monthlySteps[i]) || 0;
      const distance = parseFloat(monthlyDistance[i]) || 0;

      newMonthlyData.push({ month, steps, distance });
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

    await monthlyData.save();
    res.send('User fitness data saved successfully');
  } catch (error) {
    console.error('Error saving user fitness data:', error);
    res.status(500).send('Internal Server Error');
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
    if (!monthlyData || !Array.isArray(monthlyData.months)) {
      console.error('Monthly data is not available or invalid');
      return res.status(400).send('Monthly data is not available or invalid');
    }

    const input = {
      monthlyData: monthlyData.months.map(data => ({
        steps: data.steps,
        distance: data.distance,
        month: data.month,
        feature3: 0,
        feature4: 0,
        feature5: 0,
        feature6: 0,
        feature7: 0,
        feature8: 0,
        feature9: 0,
      })),
    };

    const inputString = JSON.stringify(input);

    console.log('Input data to Python script:', inputString);

    const pythonProcess = spawn('python3', ['predict.py', inputString]);

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
