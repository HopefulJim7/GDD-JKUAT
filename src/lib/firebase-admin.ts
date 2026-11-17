import 'dotenv/config';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing VITE_FIREBASE_PROJECT_ID. See .env.example and README.md.');
  }
  initializeApp({ projectId });
}

export const adminAuth = getAuth();
