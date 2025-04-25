import User from '../models/User';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PipelineStage } from 'mongoose';

// Query parameters interface
interface LeaderboardQuery {
  sortBy?: 'mana' | 'mageMeter';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Leaderboard pipeline options interface
interface LeaderboardPipelineOptions {
  friendIds?: string[] | import('mongoose').Types.ObjectId[];
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

// Validate leaderboard sorting parameters
const validateSortingParams = (
  sortBy: string,
  sortOrder: string
): { valid: boolean; message?: string } => {
  const validSortFields = ['mana', 'mageMeter'];
  const validSortOrders = ['asc', 'desc'];

  if (!validSortFields.includes(sortBy)) {
    return {
      valid: false,
      message: `Invalid sortBy field. Valid options: ${validSortFields.join(
        ', '
      )}`,
    };
  }

  if (!validSortOrders.includes(sortOrder)) {
    return {
      valid: false,
      message: `Invalid sortOrder. Valid options: ${validSortOrders.join(
        ', '
      )}`,
    };
  }

  return { valid: true };
};

// Build the MongoDB aggregation pipeline for leaderboards
const buildLeaderboardPipeline = (
  options: LeaderboardPipelineOptions
): PipelineStage[] => {
  const { friendIds, sortBy, sortOrder, page, limit } = options;
  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const pipeline: PipelineStage[] = [];

  // Filter by friends if provided
  if (friendIds && friendIds.length > 0) {
    pipeline.push({
      $match: { _id: { $in: friendIds } },
    });
  }

  // Common pipeline stages
  pipeline.push(
    // Join with scores collection to get quiz data
    {
      $lookup: {
        from: 'scores',
        localField: '_id',
        foreignField: 'user',
        as: 'scores',
      },
    },
    // Add totalQuizzes field
    { $addFields: { totalQuizzes: { $size: '$scores' } } },
    // Sort by specified field
    { $sort: { [sortBy]: sortDirection } },
    // Pagination
    { $skip: (page - 1) * limit },
    { $limit: limit },
    // Project only needed fields
    {
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

// Get global leaderboard (accessible to all users)
export const getGlobalLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get and validate query parameters with defaults
    const sortBy = (req.query.sortBy || 'mana') as string;
    const sortOrder = (req.query.sortOrder || 'desc') as string;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const validation = validateSortingParams(sortBy, sortOrder);

    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    // Build and execute pipeline
    const pipeline = buildLeaderboardPipeline({
      sortBy,
      sortOrder,
      page,
      limit,
    });

    const leaderboard = await User.aggregate(pipeline);
    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Global leaderboard error:', error);
    res.status(500).json({
      error: 'Error fetching global leaderboard',
    });
  }
};

// Get friends leaderboard (requires authentication)
export const getFriendLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get and validate query parameters with defaults
    const sortBy = (req.query.sortBy as string) || 'mana';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const validation = validateSortingParams(sortBy, sortOrder);

    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    // Get current user and their friends
    const userId = req.user.id;
    const user = await User.findById(userId).populate('friends');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Include both user and their friends in the leaderboard
    const friendIds = [user._id, ...user.friends.map((friend) => friend._id)];

    // Build and execute pipeline
    const pipeline = buildLeaderboardPipeline({
      friendIds,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    const leaderboard = await User.aggregate(pipeline);
    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Friend leaderboard error:', error);
    res.status(500).json({ error: 'Error fetching friend leaderboard' });
  }
};
