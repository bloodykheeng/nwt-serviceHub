// Supabase Edge Function — sends FCM notifications via Firebase HTTP v1 API
// Called from the app via: supabase.functions.invoke('send-push-notification', { body: { tokens, title, body, data } })

const PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!;
const CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
const PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

// ─── Build & sign a JWT, then exchange it for an FCM OAuth2 access token ─────

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemBody = PRIVATE_KEY.replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signingInput}.${encodedSig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const { access_token } = await res.json();
  return access_token;
}

// ─── Send one FCM message ─────────────────────────────────────────────────────

async function sendOne(
  accessToken: string,
  token: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data,
          android: { notification: { sound: 'default', priority: 'HIGH' } },
          apns: { payload: { aps: { sound: 'default' } } },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.warn(`FCM failed for token ${token.slice(0, 20)}...:`, err);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { tokens, title, body, data = {} } = await req.json() as {
      tokens: string[];
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };

    if (!tokens?.length || !title || !body) {
      return new Response(JSON.stringify({ error: 'tokens, title and body are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // FCM data values must all be strings
    const stringData: Record<string, string> = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    const accessToken = await getAccessToken();

    // Send in parallel batches of 50
    const BATCH = 50;
    for (let i = 0; i < tokens.length; i += BATCH) {
      await Promise.allSettled(
        tokens.slice(i, i + BATCH).map((t) => sendOne(accessToken, t, title, body, stringData))
      );
    }

    return new Response(JSON.stringify({ success: true, sent: tokens.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('send-push-notification error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
