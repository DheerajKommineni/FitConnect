// socialNetRoutes.js

const express = require('express');
const router = express.Router();
const middleware = require('../middleware'); // assuming you have a middleware file for authentication
const socialNetController = require('../controllers/socialNetController');
const multer = require('multer');
const path = require('path');

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

// Post-related routes
router.get('/api/posts', middleware, socialNetController.getPosts); // Get all posts
router.post(
  '/api/posts',
  upload.single('file'),
  middleware,
  socialNetController.createPost,
);

router.post(
  '/api/posts/like/:postId',
  middleware,
  socialNetController.likePost,
); // Like a post
router.post(
  '/api/posts/comment/:postId',
  middleware,
  socialNetController.commentOnPost,
); // Comment on a post

// Friend-related routes
router.get('/friends', middleware, socialNetController.getFriends); // Get user's friends
router.post(
  '/api/friends/request/:friendId',
  middleware,
  socialNetController.sendFriendRequest,
); // Send a friend request
router.post(
  '/api/friends/accept/:friendId',
  middleware,
  socialNetController.acceptFriendRequest,
); // Accept a friend request
router.get(
  '/api/friends/requests',
  middleware,
  socialNetController.getFriendRequests,
); // Get friend requests received
router.get(
  '/api/friends/pending',
  middleware,
  socialNetController.getPendingRequests,
); // Get pending friend requests sent by user
router.get('/api/users', middleware, socialNetController.getUsers); // Get users available to add as friends
router.post(
  '/api/friends/cancel/:userId',
  middleware,
  socialNetController.cancelFriendRequest,
); // Cancel a sent friend request

// Challenge-related routes
router.post('/challenge', middleware, socialNetController.createChallenge); // Create a new challenge
router.get(
  '/pending-challenges',
  middleware,
  socialNetController.getPendingChallenges,
); // Get pending challenges sent by user
router.get(
  '/incoming-challenges',
  middleware,
  socialNetController.getIncomingChallenges,
); // Get incoming challenges sent to user
router.post(
  '/respond-challenge',
  middleware,
  socialNetController.respondToChallenge,
); // Respond to a challenge (accept/decline)
router.get(
  '/ongoing-challenges',
  middleware,
  socialNetController.getOngoingChallenges,
); // Get ongoing challenges
router.get('/challenges/won', middleware, socialNetController.getWonChallenges); // Get won challenges
router.get(
  '/challenges/lost',
  middleware,
  socialNetController.getLostChallenges,
); // Get lost challenges

module.exports = router;
