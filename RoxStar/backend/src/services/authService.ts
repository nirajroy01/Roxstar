import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const toSafeUser = (user: { _id: { toString(): string }; email: string; name: string; avatar?: string }) => ({
  userId: user._id.toString(),
  email: user.email,
  name: user.name,
  ...(user.avatar ? { avatar: user.avatar } : {}),
});

export const registerUser = async (name: string, email: string, password: string) => {
  const cleanName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  if (!cleanName || cleanName.length > 100 || !normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== 'string' || password.length < 8) {
    throw new Error('Provide a name, valid email, and password of at least 8 characters');
  }
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: cleanName, email: normalizedEmail, passwordHash });

  return {
    user: toSafeUser(user),
    token: jwt.sign({ userId: user._id.toString(), email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    }),
  };
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return {
    user: toSafeUser(user),
    token: jwt.sign({ userId: user._id.toString(), email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    }),
  };
};
