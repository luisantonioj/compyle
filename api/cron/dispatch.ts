// compyle - daily digest cron (Vercel serverless)
// Fires at 00:00 UTC = 08:00 PHT.
// Reads push subscriptions from Firestore with service-account credentials,
// then delivers notifications via Web Push + VAPID.
//
// Required Vercel env vars:
//   FIREBASE_PROJECT_ID      - Firebase project ID
//   FIREBASE_CLIENT_EMAIL    - Service account client email
//   FIREBASE_PRIVATE_KEY     - Service account private key
//   VITE_VAPID_PUBLIC_KEY    - VAPID public key
//   VAPID_PRIVATE_KEY        - VAPID private key
//   CRON_SECRET              - shared secret in Authorization: Bearer <secret>

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSign } from 'node:crypto';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:luis_antonio_jopia@dlsl.edu.ph',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? 'compyle-3cac5';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FsDoc = {
  name: string;
  fields: Record<string, { stringValue?: string }>;
};

const base64url = (input: string | Buffer) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsignedJwt = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256').update(unsignedJwt).sign(privateKey);
  const assertion = `${unsignedJwt}.${base64url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const json = await response.json() as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description ?? json.error ?? 'Failed to get Firebase service token');
  }

  return json.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accessToken = await getAccessToken();
  const r = await fetch(`${FS_BASE}/device_tokens`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) {
    return res.status(502).json({ error: 'Failed to read device tokens', detail: await r.text() });
  }

  const json = (await r.json()) as { documents?: FsDoc[] };
  const docs = json.documents ?? [];
  const results: string[] = [];

  for (const fsDoc of docs) {
    const uid = fsDoc.name.split('/').pop()!;
    const subStr = fsDoc.fields.subscription?.stringValue;
    const summary = fsDoc.fields.daily_summary?.stringValue ?? 'Your day is ready';

    if (!subStr) continue;

    try {
      const sub = JSON.parse(subStr) as webpush.PushSubscription;
      await webpush.sendNotification(
        sub,
        JSON.stringify({ title: 'Good morning', body: summary }),
      );
      results.push(`ok:${uid}`);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      results.push(status === 410 ? `expired:${uid}` : `err:${uid}:${(err as Error).message}`);
    }
  }

  return res.json({ ok: true, sent: results.filter((r) => r.startsWith('ok')).length, results });
}
