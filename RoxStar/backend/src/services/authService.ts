import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const registerUser = async (name: string, email: string, password: string) => {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: normalizedEmail, passwordHash });

  return {
    user: user.toJSON(),
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
    user: user.toJSON(),
    token: jwt.sign({ userId: user._id.toString(), email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    }),
  };
};
