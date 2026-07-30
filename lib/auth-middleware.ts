// lib/auth-middleware.ts
import { adminAuth, adminDb } from './firebase-admin';
import { NextRequest } from 'next/server';

export interface AuthUser { uid: string; email: string; role: string; }

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(header.split(' ')[1]);
    
    // Le claim peut être absent si le token est ancien → fallback Firestore
    let role = (decoded.role as string) || 'user';
    if (role !== 'admin') {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') role = 'admin';
    }
    
    return { uid: decoded.uid, email: decoded.email || '', role };
  } catch { return null; }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await verifyAuth(req);
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}

export async function requireReferrer(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== 'referrer' && user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}

const rl = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max = 10, ms = 60000): boolean {
  const now = Date.now();
  const e = rl.get(key);
  if (!e || now > e.reset) { rl.set(key, { count: 1, reset: now + ms }); return true; }
  if (e.count >= max) return false;
  e.count++; return true;
}