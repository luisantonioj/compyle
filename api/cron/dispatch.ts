// compyle — daily digest cron (Vercel serverless)
// Fires at 00:00 UTC = 08:00 PHT.
// Reads push subscriptions + pre-computed summaries from the public `device_tokens`
// Firestore collection (no admin auth required), then delivers via Web Push + VAPID.
//
// Required Vercel env vars:
//   VITE_FIREBASE_API_KEY    — Firebase Web API key (used to call public Firestore REST)
//   VITE_VAPID_PUBLIC_KEY    — VAPID public key  (from: npx web-push generate-vapid-keys)
//   VAPID_PRIVATE_KEY        — VAPID private key (same command, keep secret)
//   CRON_SECRET              — shared secret; Vercel injects it as Authorization: Bearer …

import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:luis_antonio_jopia@dlsl.edu.ph',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const PROJECT_ID = 'compyle-3cac5';
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FsDoc = {
  name: string;
  fields: Record<string, { stringValue?: string }>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'VITE_FIREBASE_API_KEY not configured' });

  // device_tokens is publicly readable — no Authorization header needed.
  const r    = await fetch(`${FS_BASE}/device_tokens?key=${apiKey}`);
  const json = (await r.json()) as { documents?: FsDoc[] };
  const docs = json.documents ?? [];

  const results: string[] = [];

  for (const fsDoc of docs) {
    const uid     = fsDoc.name.split('/').pop()!;
    const subStr  = fsDoc.fields.subscription?.stringValue;
    const summary = fsDoc.fields.daily_summary?.stringValue ?? 'Your day is ready';

    if (!subStr) continue;

    try {
      const sub = JSON.parse(subStr) as webpush.PushSubscription;
      await webpush.sendNotification(
        sub,
        JSON.stringify({ title: 'Good morning ✨', body: summary }),
      );
      results.push(`ok:${uid}`);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      // 410 = subscription expired/unregistered — harmless, user will re-subscribe next time
      results.push(status === 410 ? `expired:${uid}` : `err:${uid}:${(err as Error).message}`);
    }
  }

  return res.json({ ok: true, sent: results.filter((r) => r.startsWith('ok')).length, results });
}
