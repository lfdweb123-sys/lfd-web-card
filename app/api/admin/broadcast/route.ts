import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { sendCustomEmail } from '@/lib/brevo';
import { sendPushToUser } from '@/lib/push';
import { z } from 'zod';

const Schema = z.object({
  target: z.enum(['all', 'selected']),
  userIds: z.array(z.string()).optional(),
  channels: z.array(z.enum(['email', 'push'])).min(1),
  subject: z.string().max(150).optional(),
  emailBody: z.string().max(5000).optional(),
  pushTitle: z.string().max(100).optional(),
  pushBody: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { target, userIds, channels, subject, emailBody, pushTitle, pushBody } = parsed.data;
    if (channels.includes('email') && (!subject || !emailBody))
      return NextResponse.json({ success: false, error: "Sujet et message requis pour l'email." }, { status: 400 });
    if (channels.includes('push') && (!pushTitle || !pushBody))
      return NextResponse.json({ success: false, error: 'Titre et message requis pour la notification push.' }, { status: 400 });

    let usersSnap: FirebaseFirestore.QuerySnapshot;
    if (target === 'all') {
      usersSnap = await adminDb.collection('users').where('role', '==', 'user').get();
    } else {
      if (!userIds || userIds.length === 0)
        return NextResponse.json({ success: false, error: 'Aucun utilisateur sélectionné.' }, { status: 400 });
      // Firestore 'in' est limité à 30 valeurs par requête — on découpe si besoin.
      const chunks: string[][] = [];
      for (let i = 0; i < userIds.length; i += 30) chunks.push(userIds.slice(i, i + 30));
      const snaps = await Promise.all(chunks.map(chunk =>
        adminDb.collection('users').where('__name__', 'in', chunk).get()
      ));
      const docs = snaps.flatMap(s => s.docs);
      usersSnap = { docs, size: docs.length } as FirebaseFirestore.QuerySnapshot;
    }

    let emailsSent = 0;
    let pushesSent = 0;

    await Promise.allSettled(usersSnap.docs.map(async (doc) => {
      const u = doc.data();
      if (channels.includes('email') && u.email) {
        await sendCustomEmail({ email: u.email, name: u.displayName || u.email, subject: subject!, bodyHtml: emailBody! });
        emailsSent++;
      }
      if (channels.includes('push')) {
        await sendPushToUser(doc.id, { title: pushTitle!, body: pushBody!, data: { url: '/dashboard' } });
        pushesSent++;
      }
    }));

    return NextResponse.json({ success: true, data: { totalUsers: usersSnap.size, emailsSent, pushesSent } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
