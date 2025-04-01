const socialNetService = require('../services/socialNetService');
const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
} = require('../model');

async function getPosts(req, res) {
  const userId = req.user.id;
  try {
    const posts = await socialNetService.getPosts(userId);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function createPost(req, res) {
  try {
    const { title, content } = req.body;
    const file = req.file ? req.file.filename : undefined;
    const userId = req.user.id;

    const user = await registerUser.findById(userId);
    const username = user.username;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: 'Title and content are required fields' });
    }

    const post = new userPostsSchema({
      userId,
      username,
      title,
      content,
      file,
    });

    console.log('Post', post);
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Controller to like a post
async function likePost(req, res) {
  try {
    const post = await socialNetService.likePost(
      req.params.postId,
      req.user.id,
    );
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to comment on a post
async function commentOnPost(req, res) {
  try {
    const post = await socialNetService.commentOnPost(
      req.params.postId,
      req.user.id,
      req.body.text,
    );
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to get friends list with heart points
async function getFriends(req, res) {
  try {
    const friendsData = await socialNetService.getFriends(req.user.id);
    res.json(friendsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to send a friend request
async function sendFriendRequest(req, res) {
  try {
    const response = await socialNetService.sendFriendRequest(
      req.user.id,
      req.params.friendId,
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to accept a friend request
async function acceptFriendRequest(req, res) {
  try {
    const response = await socialNetService.acceptFriendRequest(
      req.user.id,
      req.params.friendId,
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to fetch friend requests
async function getFriendRequests(req, res) {
  try {
    const friendRequests = await socialNetService.getFriendRequests(
      req.user.id,
    );
    res.status(200).json(friendRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to fetch pending friend requests
async function getPendingRequests(req, res) {
  try {
    const pendingRequests = await socialNetService.getPendingRequests(
      req.user.id,
    );
    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to fetch available users
async function getUsers(req, res) {
  try {
    const excludedUserIds = [
      req.user.id,
      ...(req.body.friendRequests || []),
      ...(req.body.pendingRequests || []),
      ...(req.body.friends || []),
    ];
    const users = await socialNetService.getUsers(req.user.id, excludedUserIds);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller to cancel a friend request
async function cancelFriendRequest(req, res) {
  try {
    const response = await socialNetService.cancelFriendRequest(
      req.user.id,
      req.params.userId,
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createChallenge(req, res) {
  const { challenging, targetSteps, targetCalories, targetDistance, deadline } =
    req.body;
  const challengedBy = req.user.id;
  const userId = req.user.id;

  try {
    const result = await socialNetService.createChallenge(
      challengedBy,
      challenging,
      targetSteps,
      targetCalories,
      targetDistance,
      deadline,
      userId,
    );
    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating challenge request', error });
  }
}

// Controller to get pending challenges
async function getPendingChallenges(req, res) {
  const challengedBy = req.user.id;

  try {
    const pendingChallenges = await socialNetService.getPendingChallenges(
      challengedBy,
    );
    res.status(200).json(pendingChallenges);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching pending challenges', error });
  }
}

// Controller to get incoming challenges
async function getIncomingChallenges(req, res) {
  const challenging = req.user.id;

  try {
    const incomingChallenges = await socialNetService.getIncomingChallenges(
      challenging,
    );

    if (incomingChallenges.length === 0) {
      return res.status(404).json({ message: 'No incoming challenges found' });
    }

    res.status(200).json(incomingChallenges);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching incoming challenges',
      error: error.message,
    });
  }
}

// Controller to respond to a challenge (accept/decline)
async function respondToChallenge(req, res) {
  const { challengedBy, action } = req.body;
  const challenging = req.user.id;

  try {
    const response = await socialNetService.respondToChallenge(
      challengedBy,
      challenging,
      action,
    );
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error processing challenge', error });
  }
}

// Controller to get ongoing challenges
async function getOngoingChallenges(req, res) {
  const userId = req.user.id;

  try {
    const ongoingChallenges = await socialNetService.getOngoingChallenges(
      userId,
    );
    res.status(200).json(ongoingChallenges);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching ongoing challenges', error });
  }
}

// Controller to get won challenges
async function getWonChallenges(req, res) {
  const userId = req.user.id;

  try {
    const wonChallenges = await socialNetService.getWonChallenges(userId);
    res.status(200).json(wonChallenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching won challenges', error });
  }
}

// Controller to get lost challenges
async function getLostChallenges(req, res) {
  const userId = req.user.id;

  try {
    const lostChallenges = await socialNetService.getLostChallenges(userId);
    res.status(200).json(lostChallenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lost challenges', error });
  }
}

module.exports = {
  getPosts,
  createPost,
  likePost,
  commentOnPost,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getPendingRequests,
  getUsers,
  cancelFriendRequest,
  createChallenge,
  getPendingChallenges,
  getIncomingChallenges,
  respondToChallenge,
  getOngoingChallenges,
  getWonChallenges,
  getLostChallenges,
};
