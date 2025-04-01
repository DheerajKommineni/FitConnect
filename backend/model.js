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
    ref: 'RegisterUser',
    required: true,
  },
  age: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
    default: '',
  },
  height: {
    type: Number,
    default: 0,
  },
  weight: {
    type: Number,
    default: 0,
  },
  totalSteps: {
    type: Number,
    default: 0,
  },
  totalDistance: {
    type: Number,
    default: 0,
  },
  totalCalories: {
    type: Number,
    default: 0,
  },
  totalHeartRate: {
    type: Number,
    default: 0,
  },
  totalMoveMinutes: {
    type: Number,
    default: 0,
  },
  totalHeartPoints: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Schema for daily user data
const userDailyData = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterUser',
    required: true,
  },
  date: {
    type: Date,
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
  caloriesExpended: {
    type: Number,
    default: 0,
  },
  heartRate: {
    type: Number,
    default: 0,
  },
  moveMinutes: {
    type: Number,
    default: 0,
  },
  heartPoints: {
    type: Number,
    default: 0,
  },
  sleep: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Schema for monthly user data
const userMonthlyData = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterUser',
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  months: [
    {
      month: {
        type: Number,
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
      caloriesExpended: {
        type: Number,
        default: 0,
      },
      heartRate: {
        type: Number,
        default: 0,
      },
      moveMinutes: {
        type: Number,
        default: 0,
      },
      heartPoints: {
        type: Number,
        default: 0,
      },
      sleep: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const userPostsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  username: String,
  title: String,
  content: String,
  file: String,
  likes: { type: Number, default: 0 },
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    },
  ],
  likedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'registerUser' },
      username: String,
    },
  ], // Array of user IDs who liked the post
  createdAt: { type: Date, default: Date.now },
});

const friendsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  friends: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
      },
      username: String,
    },
  ],
  // Track requests to add friends
  friendRequests: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
      },
      username: String,
    },
  ],
  pendingRequests: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
      },
      username: String, // Add username
    },
  ],
});

const challengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  challenges: [
    {
      challengedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      challenging: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      deadline: {
        type: Date,
        required: true,
      },
      targetSteps: {
        type: Number,
        default: 0,
      },
      targetCalories: {
        type: Number,
        default: 0,
      },
      targetDistance: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['ongoing', 'completed', 'won', 'lost'],
        default: 'ongoing',
      },
    },
  ],
  pendingChallenges: [
    {
      challengedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      challenging: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      deadline: {
        type: Date,
        required: true,
      },
      targetSteps: {
        type: Number,
        default: 0,
      },
      targetCalories: {
        type: Number,
        default: 0,
      },
      targetDistance: {
        type: Number,
        default: 0,
      },
    },
  ],
  challengesWon: [
    {
      challengedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      challenging: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
  challengesLost: [
    {
      challengedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      challenging: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
});

const chatSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    },
  ],
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const communitySchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registerUser',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
      },
      username: String,
      progress: {
        type: Number, // Progress percentage towards the community goal
        default: 0,
      },
      badges: [
        {
          type: {
            type: String,
            enum: ['Bronze', 'Silver', 'Gold'], // Badge type earned after goal completion
          },
          points: {
            type: Number, // Points associated with the badge type
          },
        },
      ],
      points: {
        type: Number, // Total points accumulated by the participant
        default: 0,
      },
    },
  ],
  goal: {
    target: {
      type: Number, // The common goal for the community (e.g., 1 million steps)
      required: true,
    },
    startDate: {
      type: Date, // Start date of the goal
      required: true,
    },
    deadline: {
      type: Date, // Deadline for achieving the goal
      required: true,
    },
    goalType: {
      type: String, // Type of goal: 'steps', 'distance', 'calories', etc.
      enum: ['steps', 'distance', 'calories', 'heartPoints'],
      default: 'steps',
    },
    progressType: {
      type: String, // How progress is measured: 'percentage', 'total'
      enum: ['percentage', 'total'],
      default: 'total',
    },
    status: {
      type: String, // Goal status: 'active', 'completed', 'failed'
      enum: ['active', 'completed', 'failed'],
      default: 'active',
    },
    badgeType: {
      type: String, // Type of badge (Bronze, Silver, Gold) rewarded for completing the goal
      enum: ['Bronze', 'Silver', 'Gold'],
      required: true,
    },
    badgePoints: {
      type: Number, // Points associated with the badge
      required: true,
    },
  },
  leaderboard: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
      },
      username: String,
      rank: Number, // Rank based on progress
      progress: Number, // Total progress towards the community goal
    },
  ],
  rewards: {
    type: String, // Rewards for completing the goal
    default: 'Community badges',
  },
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registerUser',
      },
      senderUsername: String,
      text: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  registerUser: mongoose.model('registerUser', registerUser),
  userFitnessInfo: mongoose.model('userFitnessInfo', userFitnessInfo),
  userDailyData: mongoose.model('userDailyData', userDailyData),
  userMonthlyData: mongoose.model('userMonthlyData', userMonthlyData),
  userPostsSchema: mongoose.model('userPosts', userPostsSchema),
  friendsSchema: mongoose.model('Friends', friendsSchema),
  challengeSchema: mongoose.model('Challenge', challengeSchema),
  chatSchema: mongoose.model('Chat', chatSchema),
  communitySchema: mongoose.model('Community', communitySchema),
};
