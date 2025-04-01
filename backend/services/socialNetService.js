const {
  registerUser,
  userFitnessInfo,
  userDailyData,
  userMonthlyData,
  userPostsSchema,
  friendsSchema,
  challengeSchema,
} = require('../model');

// Posts related functions

async function getPosts(userId) {
  try {
    // Step 1: Get the current user's friends
    const friendsDoc = await friendsSchema
      .findOne({ userId })
      .populate('friends.userId', 'username');

    if (!friendsDoc) {
      return res.status(404).json({ error: 'Friends list not found' });
    }

    // Collect the user IDs of the friends
    const friendIds = friendsDoc.friends.map(friend => friend.userId);

    // Add the current user's ID to the list of IDs to query
    const userAndFriendIds = [userId, ...friendIds];

    // Step 2: Find posts authored by the current user or their friends
    const posts = await userPostsSchema
      .find({ userId: { $in: userAndFriendIds } })
      .populate('userId', 'username');

    // Step 3: Separate current user's posts from other users' posts
    const currentUserPosts = posts.filter(
      post => post.userId._id.toString() === userId,
    );
    const otherUserPosts = posts.filter(
      post => post.userId._id.toString() !== userId,
    );

    // Step 4: Remove the first post of every user from otherUserPosts
    const userPostMap = new Map();
    otherUserPosts.forEach(post => {
      const authorId = post.userId._id.toString();
      if (!userPostMap.has(authorId)) {
        userPostMap.set(authorId, []);
      }
      userPostMap.get(authorId).push(post);
    });

    // Create an array of posts excluding the first post from each user
    const filteredOtherUserPosts = [];
    userPostMap.forEach(postsArray => {
      // Exclude the first post
      postsArray.shift();
      filteredOtherUserPosts.push(...postsArray);
    });

    // Step 5: Return the response with both sets of posts
    return {
      currentUserPosts, // Posts created by the current user
      otherUserPosts: filteredOtherUserPosts, // Posts created by friends (excluding the first post of each user)
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Error fetching posts');
  }
}

async function createPost(userId, username, title, content, file) {
  try {
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
    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Error creating post');
  }
}

async function likePost(postId, userId) {
  try {
    const likedBy = [];

    const post = await userPostsSchema.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const user = await registerUser.findById(userId);
    const username = user ? user.username : 'Unknown';

    const newLike = { userId, username };
    post.likedBy.push(newLike);

    post.likes += 1;
    await post.save();

    if (post.userId === userId) {
      likedBy.push('You');
    } else {
      likedBy.push(username);
    }
    updated_post = { ...post, likedByUser: likedBy };
    return post;
  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error('Error liking post');
  }
}

async function commentOnPost(postId, userId, text) {
  try {
    const commentedBy = [];

    const post = await userPostsSchema.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const user = await registerUser.findById(userId);
    const username = user ? user.username : 'Unknown';

    const newComment = { userId, username, text };

    post.comments.push(newComment);
    console.log('Comments Post', post);
    await post.save();

    return post;
  } catch (error) {
    console.error('Error commenting posts:', error);
    throw new Error('Error commenting posts');
  }
}

// Friends Management services

async function getFriends(userId) {
  // Retrieve user's friends list with heart points

  try {
    // Fetch the current user's friends
    const userFriends = await friendsSchema
      .findOne({ userId })
      .populate('friends.userId');
    const friends = userFriends.friends;

    const user = await registerUser.findById(userId);

    // Fetch heart points for each friend
    const friendsWithHeartPoints = await Promise.all(
      friends.map(async friend => {
        const fitnessInfo = await userFitnessInfo.findOne({
          userId: friend.userId,
        });
        return {
          username: friend.username,
          heartPoints: fitnessInfo.totalHeartPoints,
          userId: friend.userId,
        };
      }),
    );

    // Sort friends by heart points
    friendsWithHeartPoints.sort((a, b) => b.heartPoints - a.heartPoints);

    // Fetch current user's fitness info
    const currentUser = await userFitnessInfo.findOne({ userId });
    const currentUserInfo = {
      userId: user.id,
      username: user.username, // Assuming username is stored in req.user
      heartPoints: currentUser.totalHeartPoints,
    };

    console.log({
      currentUser: currentUserInfo,
      friends: friendsWithHeartPoints,
    });

    return {
      currentUser: currentUserInfo,
      friends: friendsWithHeartPoints,
    };
  } catch (error) {
    console.error('Error fetching friends:', error);
    throw new Error('Error fetching friends');
  }
}

async function sendFriendRequest(userId, friendId) {
  try {
    // Find the friend user
    const friend = await registerUser.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the requesting user
    const user = await registerUser.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the friend is already in the user's friends list
    const userFriends = await friendsSchema.findOne({ userId: userId });
    const isFriend = userFriends?.friends.some(
      friend => friend.userId.toString() === friendId,
    );
    if (isFriend) {
      return res.status(400).json({ error: 'User is already your friend' });
    }

    // Check if the friend request already exists
    const existingRequest = await friendsSchema.findOne({
      userId: userId,
      'pendingRequests.userId': friendId,
    });
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request to the user's requests
    await friendsSchema.findOneAndUpdate(
      { userId: userId },
      {
        $push: {
          pendingRequests: { userId: friendId, username: friend.username },
        },
      },
      { upsert: true },
    );

    // Add request to the friend's requests
    await friendsSchema.findOneAndUpdate(
      { userId: friendId },
      {
        $push: { friendRequests: { userId: userId, username: user.username } },
      },
      { upsert: true },
    );

    return { message: 'Friend request sent successfully' };
  } catch (error) {
    console.error('Error sending friend request', error);
    throw new Error('Error sending friend request');
  }
}

async function acceptFriendRequest(userId, friendId) {
  try {
    // Find the friend user
    const friend = await registerUser.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await registerUser.findById(userId);

    // Remove the friend request from both users
    await friendsSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { friendRequests: { userId: friendId } } },
    );

    await friendsSchema.findOneAndUpdate(
      { userId: friendId },
      { $pull: { pendingRequests: { userId: userId } } },
    );

    // Add the friend to both users' friends list
    await friendsSchema.findOneAndUpdate(
      { userId: userId },
      { $push: { friends: { userId: friendId, username: friend.username } } },
    );

    await friendsSchema.findOneAndUpdate(
      { userId: friendId },
      { $push: { friends: { userId: userId, username: user.username } } },
    );

    return { message: 'Friend request accepted' };
  } catch (error) {
    console.error('Error accepting friend request', error);
    throw new Error('Error accepting friend request');
  }
}

async function getFriendRequests(currentUserId) {
  try {
    // Fetch the friend's schema document for the current user
    const friendData = await friendsSchema.findOne({ userId: currentUserId });

    if (!friendData) {
      return res
        .status(404)
        .json({ message: 'No friend data found for the user' });
    }

    // Get the list of friend requests received
    const friendRequests = friendData.friendRequests;

    // Respond with the list of friend requests
    return friendRequests;
  } catch (error) {
    console.error('Error getting friend requests', error);
    throw new Error('Error getting friend requests');
  }
}

async function getPendingRequests(currentUserId) {
  try {
    // Fetch the friend's schema document for the current user
    const friendData = await friendsSchema.findOne({ userId: currentUserId });

    if (!friendData) {
      return res
        .status(404)
        .json({ message: 'No friend data found for the user' });
    }

    // Get the list of pending requests (requests sent but not accepted yet)
    const pendingRequests = friendData.pendingRequests;

    // Respond with the list of pending requests
    return pendingRequests;
  } catch (error) {
    console.error('Error getting pending friend requests', error);
    throw new Error('Error getting pending friend requests');
  }
}

async function getUsers(currentUserId, excludedUserIds) {
  try {
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
    // const excludedUserIds = [
    //   currentUserId,
    //   ...friendRequests,
    //   ...pendingRequests,
    //   ...friends,
    // ];

    // Fetch all users except the excluded ones
    const users = await registerUser.find(
      { _id: { $nin: excludedUserIds } },
      'username',
    );

    // Respond with the filtered list of users
    return users;
  } catch (error) {
    console.error('Error getting users', error);
    throw new Error('Error getting users');
  }
}

async function cancelFriendRequest(userId, friendId) {
  try {
    console.log('Cuuurent user ID', currentUserId);
    console.log('userID of cancelled friend', userId);

    // Remove the user from the friend requests array
    await friendsSchema.updateOne(
      { userId: currentUserId },
      { $pull: { friendRequests: { userId: userId } } },
    );

    await friendsSchema.updateOne(
      { userId: userId },
      { $pull: { pendingRequests: { userId: currentUserId } } },
    );

    return { message: 'Request cancelled successfully' };
  } catch (error) {
    console.error('Error cancel friend request', error);
    throw new Error('Error cancel friend request');
  }
}

async function createChallenge(
  challengedBy,
  challenging,
  targetSteps,
  targetCalories,
  targetDistance,
  deadline,
  userId,
) {
  try {
    // Check if a challenge or pending challenge already exists
    const challengeExists = await challengeSchema.findOne({
      challenging: challenging,
      'challenges.challengedBy': challengedBy,
      'challenges.status': 'ongoing',
    });

    console.log('Challenge Exists', challengeExists);

    const pendingExists = await challengeSchema.findOne({
      challenging: challenging,
      'pendingChallenges.challengedBy': challengedBy,
    });

    console.log('Pending Exists', pendingExists);

    if (challengeExists || pendingExists) {
      throw new Error('Cannot challenge this user at the moment.');
    }

    // Fetch challenged user's username
    const challengedUser = await registerUser.findById(challengedBy);
    if (!challengedUser) {
      throw new Error('Challenged user not found');
    }

    const newPendingChallenge = {
      challengedBy,
      challenging,
      startDate: new Date(),
      deadline,
      targetSteps: targetSteps || 0,
      targetCalories: targetCalories || 0,
      targetDistance: targetDistance || 0,
      status: 'pending',
    };

    console.log('Pending Challenge', newPendingChallenge);

    await challengeSchema.updateOne(
      { userId },
      { $push: { pendingChallenges: newPendingChallenge } },
      { upsert: true },
    );

    return { message: 'Challenge request sent successfully!' };
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw new Error(error.message || 'Error creating challenge request');
  }
}

async function getPendingChallenges(challengedBy) {
  try {
    // Find the user's challenges where they are the challenging user
    const userChallenges = await challengeSchema.findOne({
      userId: challengedBy,
    });

    if (!userChallenges) {
      throw new Error('No challenges found for this user');
    }

    // Fetch the usernames for all challenging users
    const userIds = userChallenges.pendingChallenges.map(
      challenge => challenge.challenging,
    );
    const challengedByIds = userChallenges.pendingChallenges.map(
      challenge => challenge.challengedBy,
    );

    // Fetch challenging users' details
    const challengingUsers = await registerUser
      .find({ _id: { $in: userIds } })
      .lean();
    const challengedByUsers = await registerUser
      .find({ _id: { $in: challengedByIds } })
      .lean();

    // Create a map for quick lookup
    const challengingUserMap = challengingUsers.reduce((map, user) => {
      map[user._id.toString()] = user.username;
      return map;
    }, {});

    const challengedByUserMap = challengedByUsers.reduce((map, user) => {
      map[user._id.toString()] = user.username;
      return map;
    }, {});

    // Map through the pendingChallenges to include the user information
    const pendingChallengesWithUsernames = userChallenges.pendingChallenges.map(
      challenge => ({
        ...challenge.toObject(),
        challenging: {
          userId: challenge.challenging,
          username:
            challengingUserMap[challenge.challenging.toString()] || 'Unknown',
        },
        challengedBy: {
          userId: challenge.challengedBy,
          username:
            challengedByUserMap[challenge.challengedBy.toString()] || 'Unknown',
        },
      }),
    );
    console.log(
      'Response of pendingchallenges',
      pendingChallengesWithUsernames,
    );

    return pendingChallengesWithUsernames;
  } catch (error) {
    throw new Error('Error fetching pending challenges');
  }
}

async function getIncomingChallenges(challenging) {
  try {
    // Fetch challenges where the logged-in user is listed as the challengedBy in pending challenges
    const userChallenges = await challengeSchema.find({
      'pendingChallenges.challenging': challenging,
    });

    // Initialize an array to store incoming challenges with sender names
    const incomingChallenges = [];

    for (const userChallenge of userChallenges) {
      for (const challenge of userChallenge.pendingChallenges) {
        if (challenge.challenging.toString() === challenging) {
          // Fetch the challengedBy user's information
          const challengedByUser = await registerUser.findById(
            challenge.challengedBy,
          );
          const challengedByUserInfo = {
            userId: challengedByUser
              ? challengedByUser._id.toString()
              : 'Unknown',
            username: challengedByUser ? challengedByUser.username : 'Unknown',
          };

          // Fetch the challenging user's information
          const challengingUser = await registerUser.findById(challenging);
          const challengingUserInfo = {
            userId: challenging,
            username: challengingUser ? challengingUser.username : 'Unknown',
          };

          // Add challenges with both user information
          const challengeWithUserInfo = {
            ...challenge.toObject(),
            challenging: challengingUserInfo,
            challengedBy: challengedByUserInfo,
          };

          incomingChallenges.push(challengeWithUserInfo);
        }
      }
    }

    // Return incoming challenges array
    return incomingChallenges;
  } catch (error) {
    // Throw the error to be handled by the controller
    throw new Error(error.message || 'Error fetching incoming challenges');
  }
}

async function respondToChallenge(challengedBy, challenging, action) {
  try {
    // Fetch the challenge document where the current user is the challenging user
    const userChallenges = await challengeSchema.findOne({
      userId: challengedBy,
    });

    if (!userChallenges) {
      throw new Error('No Challenges found for this user');
    }

    // Find the specific pending challenge where the current user is the challengedBy
    const pendingChallenge = userChallenges.pendingChallenges.find(
      challenge => challenge.challengedBy.toString() === challengedBy,
    );

    if (!pendingChallenge) {
      throw new Error('No such pending challenge found');
    }

    if (action === 'accept') {
      // Get the current UTC date and time
      const utcDate = new Date();

      // Define the desired time zone
      const timeZone = 'America/Los_Angeles';

      // Format the date to the local time zone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const [
        { value: month },
        ,
        { value: day },
        ,
        { value: year },
        ,
        { value: hour },
        ,
        { value: minute },
        ,
        { value: second },
      ] = formatter.formatToParts(utcDate);

      // Construct a new Date object with the formatted date parts
      const localDate = new Date(
        `${year}-${month}-${day}T${hour}:${minute}:${second}`,
      );

      console.log('localDate', localDate);

      const startDate = new Date(localDate);

      console.log('startDate', startDate);

      // Move the challenge to ongoing challenges
      userChallenges.challenges.push({
        ...pendingChallenge.toObject(),
        startDate,
        status: 'ongoing',
      });
    }

    console.log(
      'User Challenges after updating ongoing status',
      userChallenges,
    );

    // Remove the challenge from pendingChallenges regardless of the action
    userChallenges.pendingChallenges = userChallenges.pendingChallenges.filter(
      challenge => challenge.challengedBy.toString() !== challengedBy,
    );

    console.log(
      'user challenges after removing pending challenges',
      userChallenges,
    );

    // Save the updated challenge data
    await userChallenges.save();

    // Fetch usernames for both challengedBy and challenging
    const challengedByUser = await registerUser.findById(challengedBy);
    const challengingUser = await registerUser.findById(challenging);

    return {
      message: `Challenge ${action}ed successfully!`,
      challengedBy: {
        userId: challengedBy,
        username: challengedByUser?.username || 'Unknown',
      },
      challenging: {
        userId: challenging,
        username: challengingUser?.username || 'Unknown',
      },
    };
  } catch (error) {
    console.error('Error processing challenge:', error);
    throw new Error(error.message || 'Error processing challenge');
  }
}

async function getOngoingChallenges(userId) {
  try {
    // Fetch challenges where the user is either challenging or challengedBy
    const userChallenges = await challengeSchema.findOne({
      $or: [
        { 'challenges.challenging': userId },
        { 'challenges.challengedBy': userId },
      ],
    });

    if (!userChallenges) {
      return res.status(404).json({ message: 'No challenges found' });
    }

    // Get the current UTC date and time
    const utcDate = new Date();

    // Define the desired time zone
    const timeZone = 'America/Los_Angeles';

    // Format the date to the local time zone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const [
      { value: month },
      ,
      { value: day },
      ,
      { value: year },
      ,
      { value: hour },
      ,
      { value: minute },
      ,
      { value: second },
    ] = formatter.formatToParts(utcDate);

    // Construct a new Date object with the formatted date parts
    const localDate = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`,
    );

    const today = new Date(localDate);

    // Process each challenge
    const updatedChallenges = await Promise.all(
      (userChallenges.challenges || []).map(async challenge => {
        const {
          status,
          startDate,
          deadline,
          targetSteps,
          targetCalories,
          targetDistance,
          challengedBy,
          challenging: challengeChallenging,
        } = challenge;

        const challengedByUser = await registerUser.findById(challengedBy);
        const challengingUser = await registerUser.findById(
          challengeChallenging,
        );

        if (status === 'completed') {
          // Directly return the challenge without any calculation
          return {
            challenge: {
              ...challenge.toObject(),
              progress: {
                totalSteps: 0,
                totalCalories: 0,
                totalDistance: 0,
                percentage: {
                  steps: 100,
                  calories: 100,
                  distance: 100,
                },
                status: 'completed',
              },
              challengedBy: {
                userId: challengedBy,
                username: challengedByUser?.username || 'Unknown',
              },
              challenging: {
                userId: challengeChallenging,
                username: challengingUser?.username || 'Unknown',
              },
            },
          };
        }

        if (challenge.status !== 'ongoing') {
          return null; // Skip non-ongoing challenges
        }

        const startOfDay = new Date(startDate.setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999));

        // Fetch daily data within the correct date range
        const dailyData = await userDailyData.find({
          userId: challengeChallenging,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        // Initialize totals
        let totalSteps = 0;
        let totalCalories = 0;
        let totalDistance = 0;

        // Calculate total steps, calories, and distance
        dailyData.forEach(data => {
          totalSteps += data.steps || 0;
          totalCalories += data.caloriesExpended || 0;
          totalDistance += data.distance || 0;
        });

        // Calculate progress percentage
        const rawProgress = {
          steps: targetSteps > 0 ? (totalSteps / targetSteps) * 100 : 0,
          calories:
            targetCalories > 0 ? (totalCalories / targetCalories) * 100 : 0,
          distance:
            targetDistance > 0 ? (totalDistance / targetDistance) * 100 : 0,
        };

        const progress = {
          steps: Math.min(rawProgress.steps, 100),
          calories: Math.min(rawProgress.calories, 100),
          distance: Math.min(rawProgress.distance, 100),
        };

        const relevantMetrics = {
          steps: targetSteps > 0,
          calories: targetCalories > 0,
          distance: targetDistance > 0,
        };

        // Check progress only for relevant metrics
        let newStatus = 'ongoing';
        const isCompleted =
          (relevantMetrics.steps ? progress.steps >= 100 : true) &&
          (relevantMetrics.calories ? progress.calories >= 100 : true) &&
          (relevantMetrics.distance ? progress.distance >= 100 : true);

        if (isCompleted) {
          newStatus = 'completed';
        } else if (today > new Date(deadline)) {
          newStatus = isCompleted ? 'won' : 'lost';
        }

        // Update challenge status if needed
        if (newStatus !== status) {
          // Update challenge status in the database
          await challengeSchema.updateOne(
            { 'challenges._id': challenge._id },
            { $set: { 'challenges.$.status': newStatus } },
          );
        }

        return {
          challenge: {
            ...challenge.toObject(),
            progress: {
              totalSteps,
              totalCalories,
              totalDistance,
              percentage: progress,
              status: newStatus,
            },
            challengedBy: {
              userId: challengedBy,
              username: challengedByUser?.username || 'Unknown',
            },
            challenging: {
              userId: challengeChallenging,
              username: challengingUser?.username || 'Unknown',
            },
          },
        };
      }),
    );

    // Filter out null results from skipped challenges
    const filteredChallenges = updatedChallenges.filter(
      challenge => challenge !== null,
    );

    console.log('Filtered Challenges:', filteredChallenges);

    // Separate challenges into won, lost, ongoing, and completed
    const challengesWon = filteredChallenges.filter(
      c => c.challenge.progress.status === 'won',
    );
    const challengesLost = filteredChallenges.filter(
      c => c.challenge.progress.status === 'lost',
    );
    const challengesOngoing = filteredChallenges.filter(
      c => c.challenge.progress.status === 'ongoing',
    );
    const challengesCompleted = filteredChallenges.filter(
      c => c.challenge.progress.status === 'completed',
    );

    console.log({
      challengesWon,
      challengesLost,
      challengesOngoing,
      challengesCompleted,
    });

    // Return the categorized challenges
    return {
      challengesWon,
      challengesLost,
      challengesOngoing,
      challengesCompleted,
    };
  } catch (error) {
    throw new Error(error.message || 'Error fetching challenges');
  }
}

async function getWonChallenges(userId) {
  try {
    // Fetch challenges related to the user
    const challenges = await challengeSchema.find({
      $or: [
        { 'challenges.challengedBy': userId },
        { 'challenges.challenging': userId },
      ],
    });

    // Filter won challenges
    const wonChallenges = challenges.reduce((acc, challenge) => {
      const userWonChallenges = challenge.challenges.filter(
        c =>
          c.status === 'won' &&
          (c.challengedBy.toString() === userId.toString() ||
            c.challenging.toString() === userId.toString()),
      );
      return acc.concat(userWonChallenges);
    }, []);

    // Extract unique user IDs
    const userIds = Array.from(
      new Set([
        ...wonChallenges.map(c => c.challengedBy.toString()),
        ...wonChallenges.map(c => c.challenging.toString()),
      ]),
    );

    // Fetch usernames for these user IDs
    const users = await registerUser
      .find({ _id: { $in: userIds } })
      .select('username _id');
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.username;
      return map;
    }, {});

    // Add usernames to won challenges
    const wonChallengesWithUsernames = wonChallenges.map(challenge => ({
      ...challenge._doc,
      challengedByUsername: userMap[challenge.challengedBy.toString()],
      challengingUsername: userMap[challenge.challenging.toString()],
    }));

    return wonChallengesWithUsernames;
  } catch (err) {
    throw new Error(err.message || 'Error fetching won challenges');
  }
}

async function getLostChallenges(userId) {
  try {
    // Fetch challenges related to the user
    const challenges = await challengeSchema.find({
      $or: [
        { 'challenges.challengedBy': userId },
        { 'challenges.challenging': userId },
      ],
    });

    // Filter lost challenges
    const lostChallenges = challenges.reduce((acc, challenge) => {
      const userLostChallenges = challenge.challenges.filter(
        c =>
          c.status === 'lost' &&
          (c.challengedBy.toString() === userId.toString() ||
            c.challenging.toString() === userId.toString()),
      );
      return acc.concat(userLostChallenges);
    }, []);

    // Extract unique user IDs
    const userIds = Array.from(
      new Set([
        ...lostChallenges.map(c => c.challengedBy.toString()),
        ...lostChallenges.map(c => c.challenging.toString()),
      ]),
    );

    // Fetch usernames for these user IDs
    const users = await registerUser
      .find({ _id: { $in: userIds } })
      .select('username _id');
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.username;
      return map;
    }, {});

    // Add usernames to lost challenges
    const lostChallengesWithUsernames = lostChallenges.map(challenge => ({
      ...challenge._doc,
      challengedByUsername: userMap[challenge.challengedBy.toString()],
      challengingUsername: userMap[challenge.challenging.toString()],
    }));

    return lostChallengesWithUsernames;
  } catch (err) {
    throw new Error(err.message || 'Error fetching lost challenges');
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
