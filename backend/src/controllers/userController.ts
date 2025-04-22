import { Request, Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// HELPER FUNCTION
// (Checks if userId exists in req, and that it's a string)
const validateUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// FETCH THE CURRENT USER'S PROFILE
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    // Find the user in the database
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

// UPDATE THE CURRENT USER'S PROFILE
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const { username, email } = req.body;

    // Validate the input
    if (!username && !email) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // Define updates
    // Partial allows us to update only some fields (username and/or email)
    const updates: Partial<{ username: string; email: string }> = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    // Check if the username or email already exists
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    // If the user is not found, return a 404 error
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

// CHANGE THE CURRENT USER'S PASSWORD
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const { currentPassword, newPassword } = req.body;

    // Validate that both passwords are provided
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ error: 'Both current and new passwords are required' });
      return;
    }

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if the current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Update the password
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook (in User.ts) to hash the new password
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE THE CURRENT USER'S ACCOUNT
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);

    // Find and delete the user in the database
    // (Mongoose will also remove the user from the friends list of other users)
    const deletedUser = await User.findByIdAndDelete(userId);

    // If the user is not found, return a 404 error
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

// UPDATE USER STATS (MANA AND MAGE METER)
export const updateUserStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);
    const { mana, mageMeter } = req.body;

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update the user's stats
    if (mana !== undefined) user.mana = mana;
    if (mageMeter !== undefined) user.mageMeter = mageMeter;
    await user.save();

    // Respond with a success message and the updated user
    res.status(200).json({ message: 'User stats updated successfully', user });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ message: 'Error updating user stats', error });
  }
};

// FETCH USER STATS (MANA AND MAGE METER)
export const getUserStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Return the user's stats
    res.status(200).json({ mana: user.mana, mageMeter: user.mageMeter });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats', error });
  }
};

// ADD A FRIEND
export const addFriend = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { username } = req.body;
  try {
    // Get user and friend objects
    const userId = validateUserId(req);
    const user = await User.findByIdOrThrow(userId);
    const friend = await User.findByUsernameOrThrow(username);

    // Check if friend is yourself
    if (friend._id.equals(user._id)) {
      res.status(400).json({ message: 'You cannot add yourself as a friend' });
      return;
    }

    // Check if friend already exists
    if (user.friends.includes(friend._id)) {
      res.status(400).json({ message: 'Already friends' });
      return;
    }

    // Add friend to user's friends list
    // (Mongoose will automatically handle the ObjectId reference)
    user.friends.push(friend._id);
    await user.save();
    res.status(200).json({ message: 'Friend added successfully', user });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ message: 'Error adding friend', error });
  }
};

// REMOVE A FRIEND
export const removeFriend = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { username } = req.body;
  try {
    // Get user and friend objects
    const userId = validateUserId(req);
    const user = await User.findByIdOrThrow(userId);
    const friend = await User.findByUsernameOrThrow(username);

    // Check if friend exists in user's friends list
    if (!user.friends.includes(friend._id)) {
      res.status(400).json({ message: 'Not friends' });
      return;
    }

    // Remove friend from user's friends list
    user.friends = user.friends.filter((f) => !f.equals(friend._id));
    await user.save();
    res.status(200).json({ message: 'Friend removed successfully', user });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error });
  }
};

// GET FRIENDS LIST
export const getFriendsList = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = validateUserId(req);

    // Find the user in the database and populate the friends list
    const user = await User.findById(userId).populate('friends', '-password');

    // If the user is not found, return a 404 error
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ friends: user.friends });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ message: 'Error fetching friends list', error });
  }
};
