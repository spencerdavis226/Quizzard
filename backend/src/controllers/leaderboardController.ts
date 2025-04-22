import User from '../models/User';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PipelineStage } from 'mongoose';

// Query parameters interface
interface LeaderboardQuery {
  sortBy?: 'mana' | 'mageMeter';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Validate sorting parameters
const validateSortingParams = (
  sortBy: string,
  sortOrder: string
): { valid: boolean; message?: string } => {
  const validSortFields = ['mana', 'mageMeter'];
  const validSortOrders = ['asc', 'desc'];

  if (!validSortFields.includes(sortBy)) {
    return {
      valid: false,
      message: `Invalid sortBy field. Valid options are: ${validSortFields.join(
        ', '
      )}`,
    };
  }

  if (!validSortOrders.includes(sortOrder)) {
    return {
      valid: false,
      message: `Invalid sortOrder. Valid options are: ${validSortOrders.join(
        ', '
      )}`,
    };
  }

  return { valid: true };
};

// Build the aggregation pipeline
const buildLeaderboardPipeline = (options: {
  friendIds?: string[];
  sortBy: string;
  sortOrder: string;
  page?: number;
  limit?: number;
}): PipelineStage[] => {
  const { friendIds, sortBy, sortOrder, page = 1, limit = 10 } = options;
  const sortDirection = sortOrder === 'desc' ? -1 : 1;

  const pipeline: PipelineStage[] = [];

  if (friendIds) {
    pipeline.push({
      // Match only the friends of the user
      $match: {
        _id: { $in: friendIds },
      },
    });
  }

  pipeline.push(
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
      // Sort dynamically based on the sortBy and sortOrder parameters
      $sort: { [sortBy]: sortDirection },
    },
    {
      // Skip documents for pagination
      $skip: (page - 1) * limit,
    },
    {
      // Limit the number of documents for pagination
      $limit: limit,
    },
    {
      // Select specific fields to include in the output
      $project: {
        username: 1,
        mana: 1,
        mageMeter: 1,
        totalQuizzes: 1,
      },
    }
  );

  return pipeline;
};

// GET GLOBAL LEADERBOARD
export const getGlobalLeaderboard = async (
  req: Request<{}, {}, {}, LeaderboardQuery>,
  res: Response
): Promise<void> => {
  try {
    const {
      sortBy = 'mana',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    // Validate sorting parameters
    const validation = validateSortingParams(sortBy, sortOrder);
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    // Build the aggregation pipeline
    const pipeline = buildLeaderboardPipeline({
      sortBy,
      sortOrder,
      page: Number(page),
      limit: Number(limit),
    });

    // Execute the aggregation pipeline
    const leaderboard = await User.aggregate(pipeline);

    // Send the leaderboard data as a JSON response
    res.status(200).json(leaderboard);
  } catch (error) {
    // Handle errors and send a 500 status with an error message
    res
      .status(500)
      .json({ message: 'Error fetching global leaderboard', error });
  }
};

// GET FRIEND LEADERBOARD
export const getFriendLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const {
      sortBy = 'mana',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    // Validate sorting parameters
    const validation = validateSortingParams(
      sortBy as string,
      sortOrder as string
    );
    if (!validation.valid) {
      res.status(400).json({ message: validation.message });
      return;
    }

    // Get the authenticated user's ID and their friends
    const userId = req.user.id;
    const user = await User.findById(userId).populate('friends');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Convert ObjectId to string before passing to the pipeline
    const friendIds = user.friends.map((friend) => friend._id.toString());

    // Build the aggregation pipeline
    const pipeline = buildLeaderboardPipeline({
      friendIds,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      page: Number(page),
      limit: Number(limit),
    });

    // Execute the aggregation pipeline
    const leaderboard = await User.aggregate(pipeline);

    // Send the leaderboard data as a JSON response
    res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
};
