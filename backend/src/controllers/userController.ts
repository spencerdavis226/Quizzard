import { Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

// Get current user's profile
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
};

// Update user profile (username, email)
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { username, email } = req.body;
  if (!username && !email) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  // Use a typed object for updates
  const updates: Partial<{ username: string; email: string }> = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');
  if (!updatedUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(updatedUser);
};

// Change user password
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res
      .status(400)
      .json({ error: 'Both current and new passwords are required' });
    return;
  }
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
};

// Delete user account
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const deletedUser = await User.findByIdAndDelete(req.user.id);
  if (!deletedUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ message: 'Account deleted successfully' });
};

// Update user game stats (mana, mageMeter)
export const updateUserStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { mana, mageMeter } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (mana !== undefined) user.mana = mana;
  if (mageMeter !== undefined) user.mageMeter = mageMeter;
  await user.save();
  res.json({
    message: 'User stats updated successfully',
    user: { mana: user.mana, mageMeter: user.mageMeter },
  });
};

// Get user game stats - uses userId from params, not authentication
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ error: 'Invalid user ID format' });
    return;
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ mana: user.mana, mageMeter: user.mageMeter });
};

// Add a friend to user's friend list
export const addFriend = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { username } = req.body;
  const user = await User.findById(req.user.id);
  const friend = await User.findOne({ username });
  if (!user || !friend) {
    res.status(404).json({ error: 'Friend not found' });
    return;
  }
  if (friend._id.equals(user._id)) {
    res.status(400).json({ error: 'You cannot add yourself as a friend' });
    return;
  }
  if (user.friends.includes(friend._id)) {
    res.status(400).json({ error: 'Already friends' });
    return;
  }
  user.friends.push(friend._id);
  await user.save();
  res.json({ message: 'Friend added successfully', user });
};

// Remove a friend from user's friend list
export const removeFriend = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { username } = req.body;
  const user = await User.findById(req.user.id);
  const friend = await User.findOne({ username });
  if (!user || !friend) {
    res.status(404).json({ error: 'Friend not found' });
    return;
  }
  if (!user.friends.includes(friend._id)) {
    res.status(400).json({ error: 'Not friends' });
    return;
  }
  user.friends = user.friends.filter((f) => !f.equals(friend._id));
  await user.save();
  res.json({ message: 'Friend removed successfully', user });
};

// Get list of user's friends with details
export const getFriendsList = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await User.findById(req.user.id).populate(
    'friends',
    '-password'
  );
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ friends: user.friends });
};
