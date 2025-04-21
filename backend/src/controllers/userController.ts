import { Request, Response } from 'express';
import User from '../models/User';

// Define a custom request type that includes the `user` property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

// Fetch the current user's profile
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request object (set by authMiddleware)
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find the user by ID using 'userId' gathered from the request
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return the user profile without the password
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update the current user's username and email
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract fields to update from the request body
    const { username, email } = req.body;

    if (!username && !email) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // Prepare the updates object
    const updates: Partial<{ username: string; email: string }> = {};
    if (username) updates.username = username;
    if (email) updates.email = email;

    // Update the user in the database
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

// Change the current user's password
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract current and new passwords from the request body
    const { currentPassword, newPassword } = req.body;

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

    // Verify the current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Update the password and save the user
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete the current user's account
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request object (set by authMiddleware)
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find the user by ID and delete the account
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

// Update mana and mageMeter for a user
export const updateUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, mana, mageMeter } = req.body;

  try {
    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update the user's stats
    user.mana = mana;
    user.mageMeter = mageMeter;
    await user.save();

    res.status(200).json({ message: 'User stats updated successfully', user });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ message: 'Error updating user stats', error });
  }
};

// Fetch mana and mageMeter for a user
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;

  try {
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
