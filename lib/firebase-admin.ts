import * as admin from 'firebase-admin';

function getPrivateKey(): string {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not set');
  // Vercel stocke la clé avec des \n littéraux — on les remplace
  return key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export default admin;
