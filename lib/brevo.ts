// lib/brevo.ts
// Brevo Transactional Email API
// Endpoint : POST https://api.brevo.com/v3/smtp/email
// Auth : header api-key

const BREVO_API_KEY = () => process.env.BREVO_API_KEY!;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@lfdweb.com';
const SENDER_NAME = 'LFD WEB CARD';

async function sendEmail(data: {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
}): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY(),
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: data.to.email, name: data.to.name || data.to.email }],
      subject: data.subject,
      htmlContent: data.htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[BREVO ERROR]', err);
    // On ne fait pas throw pour ne pas bloquer le webhook
  }
}

// ── Email : rechargement réussi ──────────────────────────────────
export async function sendReloadSuccessEmail(data: {
  email: string;
  name: string;
  amountXOF: number;
  amountUSD: number;
  last4: string;
  date: string;
}): Promise<void> {
  await sendEmail({
    to: { email: data.email, name: data.name },
    subject: '✅ Rechargement réussi — LFD WEB CARD',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rechargement réussi</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#111827,#1e3a5f);padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:#FF7A00;border-radius:10px;display:inline-block;vertical-align:middle;"></div>
                <span style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:1px;vertical-align:middle;">LFD WEB CARD</span>
              </div>
            </td>
          </tr>

          <!-- Icône succès -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#E6FFF0;border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <span style="font-size:32px;">✅</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0A0A0A;">Rechargement réussi !</h1>
              <p style="margin:0;font-size:15px;color:#5A6474;">Votre carte a bien été rechargée.</p>
            </td>
          </tr>

          <!-- Montant -->
          <tr>
            <td style="padding:32px 40px;">
              <div style="background:#F7F9FC;border-radius:16px;padding:24px;text-align:center;border:1px solid #E8ECF0;">
                <div style="font-size:36px;font-weight:800;color:#FF7A00;margin-bottom:4px;">
                  ${data.amountXOF.toLocaleString('fr-FR')} FCFA
                </div>
                <div style="font-size:14px;color:#5A6474;">≈ $${data.amountUSD} USD ajoutés à votre carte</div>
              </div>
            </td>
          </tr>

          <!-- Détails -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;border:1px solid #E8ECF0;">
                <tr style="background:#F7F9FC;">
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;border-bottom:1px solid #E8ECF0;">Carte</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#0A0A0A;text-align:right;border-bottom:1px solid #E8ECF0;">•••• •••• •••• ${data.last4}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;border-bottom:1px solid #E8ECF0;">Montant FCFA</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#0A0A0A;text-align:right;border-bottom:1px solid #E8ECF0;">${data.amountXOF.toLocaleString('fr-FR')} FCFA</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;border-bottom:1px solid #E8ECF0;">Montant USD</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#00C853;text-align:right;border-bottom:1px solid #E8ECF0;">+$${data.amountUSD}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;">Date</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#0A0A0A;text-align:right;">${data.date}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                style="display:inline-block;background:#FF7A00;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:14px;text-decoration:none;">
                Voir mon tableau de bord →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F9FC;padding:24px 40px;text-align:center;border-top:1px solid #E8ECF0;">
              <p style="margin:0;font-size:12px;color:#9BA3AF;">
                LFD WEB CARD · Carte virtuelle internationale<br />
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/legal/privacy" style="color:#9BA3AF;">Politique de confidentialité</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

// ── Email : rechargement échoué ──────────────────────────────────
export async function sendReloadFailedEmail(data: {
  email: string;
  name: string;
  amountXOF: number;
  last4: string;
  date: string;
}): Promise<void> {
  await sendEmail({
    to: { email: data.email, name: data.name },
    subject: '❌ Échec du rechargement — LFD WEB CARD',
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rechargement échoué</title>
</head>
<body style="margin:0;padding:0;background:#F7F9FC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#111827,#1e3a5f);padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:#FF7A00;border-radius:10px;display:inline-block;vertical-align:middle;"></div>
                <span style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:1px;vertical-align:middle;">LFD WEB CARD</span>
              </div>
            </td>
          </tr>

          <!-- Icône échec -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#FFF1F0;border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <span style="font-size:32px;">❌</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0A0A0A;">Rechargement échoué</h1>
              <p style="margin:0;font-size:15px;color:#5A6474;">
                Votre rechargement de <strong>${data.amountXOF.toLocaleString('fr-FR')} FCFA</strong> n'a pas abouti.
              </p>
            </td>
          </tr>

          <!-- Détails -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;border:1px solid #E8ECF0;">
                <tr style="background:#F7F9FC;">
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;border-bottom:1px solid #E8ECF0;">Carte</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#0A0A0A;text-align:right;border-bottom:1px solid #E8ECF0;">•••• •••• •••• ${data.last4}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;border-bottom:1px solid #E8ECF0;">Montant tenté</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#DC2626;text-align:right;border-bottom:1px solid #E8ECF0;">${data.amountXOF.toLocaleString('fr-FR')} FCFA</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#5A6474;">Date</td>
                  <td style="padding:14px 20px;font-size:13px;font-weight:600;color:#0A0A0A;text-align:right;">${data.date}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Raisons possibles -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:#FFF7ED;border-radius:16px;padding:20px;border:1px solid #FDDCB5;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#FF7A00;">Raisons possibles :</p>
                <ul style="margin:0;padding-left:18px;font-size:13px;color:#5A6474;line-height:1.8;">
                  <li>Solde Mobile Money insuffisant</li>
                  <li>Transaction annulée ou expirée</li>
                  <li>Problème réseau temporaire</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                style="display:inline-block;background:#FF7A00;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:14px;text-decoration:none;">
                Réessayer le rechargement →
              </a>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#5A6474;">
                Besoin d'aide ? Contactez-nous à
                <a href="mailto:support@lfdweb.com" style="color:#FF7A00;text-decoration:none;">support@lfdweb.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F9FC;padding:24px 40px;text-align:center;border-top:1px solid #E8ECF0;">
              <p style="margin:0;font-size:12px;color:#9BA3AF;">
                LFD WEB CARD · Carte virtuelle internationale<br />
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/legal/privacy" style="color:#9BA3AF;">Politique de confidentialité</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}