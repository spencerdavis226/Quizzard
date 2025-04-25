import { Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

// Helper to validate user ID from request
const validateUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Type for profile update fields
type ProfileUpdate = {
  username?: string;
  email?: string;
};

// Get current user's profile
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user profile (username, email)
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const { username, email } = req.body;

    // Check for valid update fields
    if (!username && !email) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // Create update object with provided fields
    const updates: ProfileUpdate = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    // Find and update user document
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Change user password
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const { currentPassword, newPassword } = req.body;

    // Validate password inputs
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ error: 'Both current and new passwords are required' });
      return;
    }

    // Find user and verify current password
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Update password and save (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user account
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user game stats (mana, mageMeter)
export const updateUserStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const { mana, mageMeter } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update stats if provided
    if (mana !== undefined) user.mana = mana;
    if (mageMeter !== undefined) user.mageMeter = mageMeter;
    await user.save();

    res.status(200).json({
      message: 'User stats updated successfully',
      user: {
        mana: user.mana,
        mageMeter: user.mageMeter,
      },
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ error: 'Error updating user stats' });
  }
};

// Get user game stats - uses userId from params, not authentication
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate the userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      mana: user.mana,
      mageMeter: user.mageMeter,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Error fetching user stats' });
  }
};

// Add a friend to user's friend list
export const addFriend = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.body;
    const userId = validateUserId(req);

    // Get current user and friend to be added
    const user = await User.findByIdOrThrow(userId);
    const friend = await User.findByUsernameOrThrow(username);

    // Can't add yourself as a friend
    if (friend._id.equals(user._id)) {
      res.status(400).json({ error: 'You cannot add yourself as a friend' });
      return;
    }

    // Check if already friends
    if (user.friends.includes(friend._id)) {
      res.status(400).json({ error: 'Already friends' });
      return;
    }

    // Add friend and save
    user.friends.push(friend._id);
    await user.save();

    res.status(200).json({ message: 'Friend added successfully', user });
  } catch (error) {
    console.error('Error adding friend:', error);
    if (
      error instanceof Error &&
      (error.message === 'User not found' ||
        error.message === 'Friend not found')
    ) {
      res.status(404).json({ error: 'Friend not found' });
    } else {
      res.status(500).json({ error: 'Error adding friend' });
    }
  }
};

// Remove a friend from user's friend list
export const removeFriend = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { username } = req.body;
  try {
    const userId = validateUserId(req);
    const user = await User.findByIdOrThrow(userId);
    const friend = await User.findByUsernameOrThrow(username);

    // Check if friend exists in user's list
    if (!user.friends.includes(friend._id)) {
      res.status(400).json({ error: 'Not friends' });
      return;
    }

    // Remove friend and save
    user.friends = user.friends.filter((f) => !f.equals(friend._id));
    await user.save();

    res.status(200).json({ message: 'Friend removed successfully', user });
  } catch (error) {
    console.error('Error removing friend:', error);
    if (
      error instanceof Error &&
      (error.message === 'User not found' ||
        error.message === 'Friend not found')
    ) {
      res.status(404).json({ error: 'Friend not found' });
    } else {
      res.status(500).json({ error: 'Error removing friend' });
    }
  }
};

// Get list of user's friends with details
export const getFriendsList = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const user = await User.findById(userId).populate('friends', '-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ friends: user.friends });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ error: 'Error fetching friends list' });
  }
};
