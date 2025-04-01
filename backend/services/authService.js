const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
} = require('../model');

const session = require('express-session');
const crypto = require('crypto');

const sessionSecret = crypto.randomBytes(64).toString('hex');

router.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

class AuthService {
  async register(userData) {
    const { username, email, password, confirmpassword } = userData;

    // Check if user already exists
    let exist = await registerUser.findOne({ email });
    if (exist) {
      throw new Error('User Already Exists');
    }

    // Check if passwords match
    if (password !== confirmpassword) {
      throw new Error('Passwords Do Not Match');
    }

    // Create a new user
    let newUser = new registerUser({
      username,
      email,
      password,
      confirmpassword,
    });
    await newUser.save();

    // Add initial fitness data
    await this.addInitialFitnessData(newUser._id);
    await this.addInitialDailyData(newUser._id);
    await this.addInitialMonthlyData(newUser._id);
    await this.addSocialMediaData(newUser._id, username);
    await this.addFriendsData(newUser._id);
    await this.addChallengeData(newUser._id);

    return newUser;
  }

  async addInitialFitnessData(userId) {
    let fitnessData = new userFitnessInfo({
      userId,
      age: null,
      weight: null,
      height: null,
      gender: null,
      totalSteps: 0,
      distance: 0,
      totalCalories: 0,
      totalHeartRate: 0,
      totalMoveMinutes: 0,
      totalHeartPoints: 0,
      sleep: 0,
      activityDuration: 0,
    });
    await fitnessData.save();
  }

  async addInitialDailyData(userId) {
    let dailyData = new userDailyData({
      userId,
      date: new Date().toISOString().slice(0, 10),
      steps: 0,
      distance: 0,
      calories: 0,
      heartRate: 0,
      sleep: 0,
      heartPoints: 0,
      activityDuration: 0,
    });
    await dailyData.save();
  }

  async addInitialMonthlyData(userId) {
    let currentDate = new Date();
    let month = currentDate.getMonth() + 1;
    let year = currentDate.getFullYear();

    let monthlyData = new userMonthlyData({
      userId,
      year,
      months: [
        {
          month,
          steps: 0,
          distance: 0,
          calories: 0,
          heartRate: 0,
          heartPoints: 0,
          sleep: 0,
          activityDuration: 0,
        },
      ],
    });
    await monthlyData.save();
  }

  async addSocialMediaData(userId, username) {
    let socialMediaData = new userPostsSchema({
      userId,
      title: 'Welcome to FitConnect!',
      username,
      content:
        'Welcome to FitConnect! Feel free to share your fitness journey.',
      file: '',
      likes: 0,
      comments: [],
      likedBy: [],
      createdAt: new Date(),
    });
    await socialMediaData.save();
  }

  async addFriendsData(userId) {
    let friendsData = new friendsSchema({
      userId,
      friends: [],
      friendRequests: [],
      pendingRequests: [],
    });
    await friendsData.save();
  }

  async addChallengeData(userId) {
    let challengeData = new challengeSchema({
      userId,
      challenges: [],
      pendingChallenges: [],
      challengesWon: [],
      challengesLost: [],
    });
    await challengeData.save();
  }

  async login(email, password) {
    let exist = await registerUser.findOne({ email });
    if (!exist) {
      throw new Error('User Not Found');
    }
    if (exist.password !== password) {
      throw new Error('Invalid Credentials');
    }

    let payload = {
      user: {
        id: exist.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: 3600000,
    });
    return { token, userId: exist.id }; // Return token and user ID
  }
}

module.exports = new AuthService();
