# VCardAfrica — Guide de déploiement complet

## Stack technique
- **Frontend / Backend** : Next.js 14 (App Router) sur Vercel
- **Base de données** : Firebase Firestore
- **Auth** : Firebase Auth
- **Cartes virtuelles** : Pagocards API
- **Paiement** : LFD Payment Gateway

---

## 1. Prérequis

- Compte [Firebase](https://console.firebase.google.com)
- Compte [Pagocards](https://pagocards.com) avec API activée
- Compte [LFD Gateway](https://paymentgateway.lfdweb.com) avec clé API
- Compte [Vercel](https://vercel.com)

---

## 2. Firebase — Configuration

### 2.1 Créer le projet
1. Firebase Console → Nouveau projet
2. Activer **Authentication** → Email/Password
3. Activer **Firestore** en mode production

### 2.2 Clés client (Frontend)
Firebase Console → Paramètres du projet → Vos applications → Web app

### 2.3 Clés Admin (Backend)
Firebase Console → Paramètres → Comptes de service → Générer une nouvelle clé privée

### 2.4 Déployer les règles Firestore
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 2.5 Créer le premier admin
Après inscription d'un utilisateur, dans Firestore → `users/{uid}` → modifier `role` à `admin`,
puis dans Firebase Console → Authentication → Utilisateurs → Custom claims :
```json
{ "role": "admin" }
```
Ou utiliser la route admin dans le code pour promouvoir un user existant.

---

## 3. Pagocards — Configuration

### 3.1 Récupérer les clés
Dashboard Pagocards → API Keys → copier `publickey` et `secretkey`

### 3.2 Configurer le Webhook
Dashboard Pagocards → Webhooks → ajouter :
```
URL : https://votre-app.vercel.app/api/webhook/pagocards
Events : cardTokenization.deliverActivationCode, cardAuthentication.created
```

### 3.3 Points importants
- **Mastercard** : frais de création à vérifier dans votre dashboard
- **Visa** : $3 USD d'initial load **obligatoire** par carte (prélevés sur votre wallet Pagocards)
- **Rechargement** : frais de $1 + 1% du montant USD (prélevés sur votre wallet Pagocards)
- Assurez-vous d'avoir un solde suffisant dans votre wallet Pagocards avant de lancer

---

## 4. LFD Payment Gateway — Configuration

### 4.1 Récupérer la clé API
Dashboard LFD → API Keys → copier la clé `gw_...`

### 4.2 Configurer le Webhook
Dashboard LFD → Webhooks → ajouter :
```
URL : https://votre-app.vercel.app/api/webhook/payment
Events : payment.completed, payment.failed
```

⚠️ **Important** : le webhook LFD utilise `metadata.transactionId` pour identifier vos transactions.
Ce mécanisme est déjà implémenté dans le code.

---

## 5. Déploiement Vercel

### 5.1 Installer les variables d'environnement
Dans Vercel Dashboard → Settings → Environment Variables, ajouter **toutes** les variables du fichier `.env.example` :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Clé Firebase client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domaine Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID du projet |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `FIREBASE_ADMIN_PROJECT_ID` | ID du projet |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email du service account |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clé privée (avec `\n`) |
| `PAGOCARDS_PUBLIC_KEY` | Clé publique Pagocards |
| `PAGOCARDS_SECRET_KEY` | Clé secrète Pagocards |
| `GATEWAY_API_KEY` | Clé LFD Gateway |
| `GATEWAY_BASE_URL` | `https://paymentgateway.lfdweb.com` |
| `NEXT_PUBLIC_APP_URL` | URL Vercel de votre app |
| `CARD_CREATION_PRICE` | `5000` (en FCFA) |
| `CARD_RELOAD_MIN` | `1000` |
| `CARD_RELOAD_MAX` | `500000` |

### 5.2 Déployer
```bash
npm install
vercel --prod
```

---

## 6. Architecture des webhooks

```
Client → Paiement Mobile Money → LFD Gateway
                                      ↓
              POST /api/webhook/payment (votre serveur)
                                      ↓
              Retrouve transaction via metadata.transactionId
                                      ↓
         Si card_purchase → Pagocards POST /api/mastercard/createcard
         Si card_reload   → Pagocards POST /api/mastercard/fundcard
                                      ↓
              Met à jour Firestore (cards, transactions)


Pagocards → POST /api/webhook/pagocards (votre serveur)
               ↓
    cardTokenization.deliverActivationCode → notif Google/Apple Pay
    cardAuthentication.created             → notif 3DS à approuver
```

---

## 7. Flux utilisateur complet

```
1. Inscription  → /api/auth/register → Firestore users + Firebase Auth
2. Connexion    → Firebase Auth (client-side)
3. Achat carte  → /api/cards/buy → LFD generate-link → Paiement Mobile Money
4. Confirmation → /api/webhook/payment → Pagocards createcard → Firestore cards
5. Rechargement → /api/cards/reload → LFD generate-link → Paiement → fundcard
6. Gel/Dégel    → /api/cards/freeze → Pagocards block/unblock
7. 3DS          → /api/webhook/pagocards → notification → /api/cards/approve3ds
```

---

## 8. Structure du projet

```
vcard-platform/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── layout.tsx
│   ├── globals.css
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx          ← Dashboard utilisateur
│   ├── admin/page.tsx              ← Panel admin
│   └── api/
│       ├── auth/register/route.ts
│       ├── cards/
│       │   ├── buy/route.ts        ← Initie le paiement d'achat
│       │   ├── reload/route.ts     ← Initie le rechargement
│       │   ├── freeze/route.ts     ← Gel/Dégel via Pagocards
│       │   ├── approve3ds/route.ts ← Approuve un 3DS
│       │   └── me/route.ts         ← Cartes + transactions de l'user
│       ├── notifications/route.ts
│       ├── admin/
│       │   ├── stats/route.ts
│       │   └── users/route.ts
│       └── webhook/
│           ├── payment/route.ts    ← Webhook LFD → crée/recharge carte
│           └── pagocards/route.ts  ← Webhook Pagocards → 3DS, wallets
├── lib/
│   ├── firebase.ts                 ← Client Firebase
│   ├── firebase-admin.ts           ← Admin SDK (server only)
│   ├── pagocards.ts                ← Client Pagocards (tous endpoints)
│   ├── payment-gateway.ts          ← Client LFD
│   ├── auth-middleware.ts          ← Vérif JWT + rate limiting
│   └── validations.ts              ← Schémas Zod
├── hooks/useAuth.ts
├── types/index.ts
├── firestore.rules
├── firestore.indexes.json
├── .env.example
└── README.md
```

---

## 9. Vérifications avant mise en production

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Webhook LFD configuré : `/api/webhook/payment`
- [ ] Webhook Pagocards configuré : `/api/webhook/pagocards`
- [ ] Règles Firestore déployées
- [ ] Index Firestore déployés
- [ ] Wallet Pagocards approvisionné (pour les frais de création)
- [ ] Test d'un paiement complet en sandbox LFD
- [ ] Premier admin créé via Firestore

---

## 10. Support

- Pagocards : support@pagocards.com
- LFD Gateway : https://paymentgateway.lfdweb.com (support 24/7)
