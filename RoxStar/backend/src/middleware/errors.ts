import { NextFunction, Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(error);
  res.status(500).json({ message: error.message || 'Server error' });
};
