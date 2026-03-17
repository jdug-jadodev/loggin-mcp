import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../utils/jwt';
import { SupabaseRevokedTokenRepositoryAdapter } from '../repository/adapter/SupabaseRevokedTokenRepositoryAdapter';
import { UnauthorizedError } from '../../application/exception/UnauthorizedError';
import { TokenExpiredError } from '../../application/exception/TokenExpiredError';
import { InvalidTokenError } from '../../application/exception/InvalidTokenError';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Expected: Bearer <token>');
    }

    const token = authHeader.substring(7);

    if (!token || token.trim().length === 0) {
      throw new UnauthorizedError('Token cannot be empty');
    }

    const payload = verifyToken(token) as { userId: string; email: string };

    req.userId = payload.userId;
    req.email = payload.email;

    // Check if token has been revoked (jti)
    const jti = (payload as any).jti;
    if (jti) {
      try {
        const revokedRepo = new SupabaseRevokedTokenRepositoryAdapter();
        const revoked = await revokedRepo.isRevoked(jti);
        if (revoked) {
          throw new UnauthorizedError('Token has been revoked');
        }
      } catch (err) {
        // If DB error, log and treat as server error
        if ((err as any).message && (err as any).message.includes('Error checking revoked token')) {
          console.error('Revoked token check failed', err);
          res.status(500).json({ status: 'error', message: 'Internal server error', code: 'INTERNAL_ERROR' });
          return;
        }
        throw err;
      }
    }

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        status: 'error',
        message: error.message,
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if ((error as any)?.name === 'TokenExpiredError') {
      const tokenExpiredError = new TokenExpiredError('Token has expired');
      res.status(401).json({
        status: 'error',
        message: tokenExpiredError.message,
        code: 'TOKEN_EXPIRED',
        timestamp: tokenExpiredError.timestamp
      });
      return;
    }

    if ((error as any)?.name === 'JsonWebTokenError' || (error as any)?.message?.includes('invalid')) {
      const invalidTokenError = new InvalidTokenError('Invalid authentication token');
      res.status(401).json({
        status: 'error',
        message: invalidTokenError.message,
        code: 'INVALID_TOKEN',
        timestamp: invalidTokenError.timestamp
      });
      return;
    }

    console.error('Unexpected auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};
