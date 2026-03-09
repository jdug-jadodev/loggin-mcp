import { Request, Response, NextFunction } from 'express';
import { SupabaseUserRepositoryAdapter } from '../repository/adapter/SupabaseUserRepositoryAdapter';
import { ForbiddenError } from '../../application/exception/ForbiddenError';

const userRepository = new SupabaseUserRepositoryAdapter();

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      const err = new ForbiddenError('User not authenticated for admin check');
      res.status(403).json({ status: 'error', message: err.message, code: 'FORBIDDEN', timestamp: err.timestamp });
      return;
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      const err = new ForbiddenError('User not found');
      res.status(403).json({ status: 'error', message: err.message, code: 'FORBIDDEN', timestamp: err.timestamp });
      return;
    }

    if (user.role !== 'admin') {
      const err = new ForbiddenError('Access denied. Admin privileges required');
      res.status(403).json({ status: 'error', message: err.message, code: 'FORBIDDEN', timestamp: err.timestamp });
      return;
    }

    req.userRole = 'admin';
    next();
  } catch (error) {
    console.error('Admin middleware error', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR', timestamp: new Date().toISOString() });
  }
};
