import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthenticatedDbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferredPace: string | null;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: AuthenticatedDbUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = decodedToken.email || `${decodedToken.uid}@member.local`;
    const displayName =
      typeof decodedToken.name === 'string' && decodedToken.name.trim()
        ? decodedToken.name
        : email.split('@')[0];
    const avatarUrl =
      typeof decodedToken.picture === 'string' ? decodedToken.picture : null;

    const dbUser = await getOrCreateUser({
      uid: decodedToken.uid,
      email,
      displayName,
      avatarUrl,
    });

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = decodedToken.email || `${decodedToken.uid}@member.local`;
    const displayName =
      typeof decodedToken.name === 'string' && decodedToken.name.trim()
        ? decodedToken.name
        : email.split('@')[0];
    const avatarUrl =
      typeof decodedToken.picture === 'string' ? decodedToken.picture : null;

    req.dbUser = await getOrCreateUser({
      uid: decodedToken.uid,
      email,
      displayName,
      avatarUrl,
    });
  } catch {
    // Proceed as unauthenticated visitor when optional token is expired/invalid
  }

  next();
};
