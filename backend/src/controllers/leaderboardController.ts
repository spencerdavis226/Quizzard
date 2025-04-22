import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Get global leaderboard
export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await User.aggregate([
      {
        // Join the 'scores' collection with the 'users' collection based on user ID
        $lookup: {
          from: 'scores',
          localField: '_id',
          foreignField: 'user',
          as: 'scores',
        },
      },
      {
        // Add a new field 'totalQuizzes' that counts the number of quizzes a user has taken
        $addFields: {
          totalQuizzes: { $size: '$scores' },
        },
      },
      {
        // Filter users who have taken at least 10 quizzes
        $match: {
          totalQuizzes: { $gte: 10 },
        },
      },
      {
        // Sort users by 'mana' and 'mageMeter' in descending order
        $sort: { mana: -1, mageMeter: -1 },
      },
      {
        // Select specific fields to include in the output
        $project: {
          username: 1,
          mana: 1,
          mageMeter: 1,
          totalQuizzes: 1,
        },
      },
    ]);

    // Send the leaderboard data as a JSON response
    res.status(200).json(leaderboard);
  } catch (error) {
    // Handle errors and send a 500 status with an error message
    res
      .status(500)
      .json({ message: 'Error fetching global leaderboard', error });
  }
};

// Get friend leaderboard
export const getFriendLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Get the authenticated user's ID
    const userId = req.user.id;

    // Find the user by ID and populate their friends
    const user = await User.findById(userId).populate('friends');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Extract the IDs of the user's friends
    const friendIds = user.friends.map((friend) => friend._id);

    const leaderboard = await User.aggregate([
      {
        // Match only the friends of the user
        $match: {
          _id: { $in: friendIds },
        },
      },
      {
        // Join the 'scores' collection with the 'users' collection based on user ID
        $lookup: {
          from: 'scores',
          localField: '_id',
          foreignField: 'user',
          as: 'scores',
        },
      },
      {
        // Add a new field 'totalQuizzes' that counts the number of quizzes a user has taken
        $addFields: {
          totalQuizzes: { $size: '$scores' },
        },
      },
      {
        // Filter users who have taken at least 10 quizzes
        $match: {
          totalQuizzes: { $gte: 10 },
        },
      },
      {
        // Sort users by 'mana' and 'mageMeter' in descending order
        $sort: { mana: -1, mageMeter: -1 },
      },
      {
        // Select specific fields to include in the output
        $project: {
          username: 1,
          mana: 1,
          mageMeter: 1,
          totalQuizzes: 1,
        },
      },
    ]);

    // Send the leaderboard data as a JSON response
    res.status(200).json(leaderboard);
  } catch (error) {
    // Pass the error to the next middleware for centralized error handling
    next(error);
  }
};
