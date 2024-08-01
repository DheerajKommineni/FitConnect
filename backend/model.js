const mongoose = require('mongoose');

// Schema for user registration
const registerUser = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures unique emails
  },
  password: {
    type: String,
    required: true,
  },
  confirmpassword: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
});

// Schema for user fitness information
const userFitnessInfo = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  age: Number,
  weight: Number,
  height: Number,
  gender: String,
  steps: {
    type: Number,
    default: 0,
  },
  distance: {
    type: Number,
    default: 0,
  },
  // Add more fields as required
});

// Schema for daily user data
const userDailyData = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  date: {
    type: String,
    required: true,
    index: true, // Indexing date for performance on queries
  },
  steps: {
    type: Number,
    default: 0,
  },
  distance: {
    type: Number,
    default: 0,
  },
});

// Schema for monthly user data
const userMonthlyData = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  months: [
    {
      month: {
        type: Number, // 1 for January, 2 for February, etc.
        required: true,
      },
      steps: {
        type: Number,
        default: 0,
      },
      distance: {
        type: Number,
        default: 0,
      },
    },
  ],
});

module.exports = {
  registerUser: mongoose.model('registerUser', registerUser),
  userFitnessInfo: mongoose.model('userFitnessInfo', userFitnessInfo),
  userDailyData: mongoose.model('userDailyData', userDailyData),
  userMonthlyData: mongoose.model('userMonthlyData', userMonthlyData),
};
