// lib/auth-middleware.ts
import { adminAuth } from './firebase-admin';
import { NextRequest } from 'next/server';

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      role: (decoded.role as string) || 'user',
    };
  } catch {
    return null;
  }
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

// Rate limiting simple en mémoire (production: utiliser Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
