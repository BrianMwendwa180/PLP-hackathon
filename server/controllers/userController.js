import User from '../models/User.js';
import UserModuleInteraction from '../models/UserModuleInteraction.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, organization, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { fullName, organization, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const trackModuleInteraction = async (req, res) => {
  try {
    const { moduleName } = req.body;
    const userId = req.user.userId;

    if (!moduleName) {
      return res.status(400).json({ message: 'Module name is required' });
    }

    // Find existing interaction or create new one
    const interaction = await UserModuleInteraction.findOneAndUpdate(
      { userId, moduleName },
      {
        $inc: { accessCount: 1 },
        lastAccessed: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Module interaction tracked successfully', interaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserModulePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all interactions for the user, sorted by accessCount descending
    const interactions = await UserModuleInteraction.find({ userId })
      .sort({ accessCount: -1, lastAccessed: -1 });

    // Return preferences as an array of module names with their access counts
    const preferences = interactions.map(interaction => ({
      moduleName: interaction.moduleName,
      accessCount: interaction.accessCount,
      lastAccessed: interaction.lastAccessed
    }));

    res.json({ preferences });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
