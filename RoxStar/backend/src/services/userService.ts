import User from '../models/User.js';

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  const { passwordHash, ...safeUser } = user as Record<string, unknown> & { passwordHash?: string };
  return safeUser;
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
