// Receives a correction proposed from a language, tool, or question page and
// opens a GitHub issue for it. Nothing submitted here is ever rendered on the
// site: the public surface stays fully curated, and a correction only ships
// after it goes through the dataset and the normal review gates.

const REPO = 'sanketmuchhala/LanguageLineage';

const LIMITS = {
  body: 8 * 1024,
  nodeId: 80,
  nodeName: 80,
  pagePath: 200,
  claim: 500,
  correction: 2000,
  evidenceUrl: 500,
  contact: 200,
};

// Best-effort only: serverless instances are not shared, so this throttles a
// single hot instance rather than the whole deployment. Turnstile is the real
// gate; this just makes the trivial case cheap to reject.
const RECENT = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (RECENT.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  hits.push(now);
  RECENT.set(ip, hits);
  if (RECENT.size > 5000) RECENT.clear();
  return hits.length > MAX_PER_WINDOW;
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

// User text goes into a markdown issue body, so fence it to stop it closing the
// block or injecting markup. Backticks in the input get neutralised.
function fence(text: string): string {
  return '```\n' + text.replace(/`/g, "'") + '\n```';
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function turnstileOk(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Not configured: fall through to the honeypot and rate limit rather than
  // rejecting every submission on a deployment that has no keys yet.
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return json(503, { error: 'Submissions are not configured on this deployment.' });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const raw = await request.text();
  if (raw.length > LIMITS.body) {
    return json(413, { error: 'Submission too large.' });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Malformed request.' });
  }

  // Honeypot: a real browser leaves this hidden field empty. Answer 200 so a
  // bot cannot tell it was caught.
  if (str(payload.website, 200) !== '') {
    return json(200, { ok: true });
  }

  const nodeId = str(payload.nodeId, LIMITS.nodeId);
  const nodeName = str(payload.nodeName, LIMITS.nodeName);
  const pagePath = str(payload.pagePath, LIMITS.pagePath);
  const claim = str(payload.claim, LIMITS.claim);
  const correction = str(payload.correction, LIMITS.correction);
  const evidenceUrl = str(payload.evidenceUrl, LIMITS.evidenceUrl);
  const contact = str(payload.contact, LIMITS.contact);

  if (!correction) {
    return json(400, { error: 'Tell us what should change.' });
  }
  if (!nodeName || !pagePath.startsWith('/')) {
    return json(400, { error: 'Missing page context.' });
  }
  if (evidenceUrl && !/^https:\/\/[^\s]+$/i.test(evidenceUrl)) {
    return json(400, { error: 'Evidence must be an https link.' });
  }

  if (!(await turnstileOk(str(payload.turnstileToken, 4096), ip))) {
    return json(403, { error: 'Could not verify that you are human.' });
  }
  if (rateLimited(ip)) {
    return json(429, { error: 'Too many submissions. Try again later.' });
  }

  const body = [
    `Proposed from [\`${pagePath}\`](https://www.languagelineage.org${pagePath}) via the site form.`,
    '',
    `**Node:** \`${nodeId || 'unknown'}\` (${nodeName})`,
    '',
    '**Current claim on the page**',
    claim ? fence(claim) : '_not supplied_',
    '',
    '**Proposed correction**',
    fence(correction),
    '',
    `**Evidence:** ${evidenceUrl ? `<${evidenceUrl}>` : '_none supplied_'}`,
    `**Contact:** ${contact ? '`' + contact.replace(/`/g, "'") + '`' : '_none supplied_'}`,
    '',
    '---',
    'Submitted anonymously through the website. Treat the content as unverified until checked against a source.',
  ].join('\n');

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'language-lineage-propose',
    },
    body: JSON.stringify({
      title: `Correction: ${nodeName}`.slice(0, 120),
      body,
      labels: ['correction', 'from-website'],
    }),
  });

  if (!res.ok) {
    // Never leak the upstream response: it can echo the token's scopes.
    console.error('GitHub issue creation failed', res.status);
    return json(502, { error: 'Could not file the correction. Please try again later.' });
  }

  const issue = (await res.json()) as { html_url?: string };
  return json(200, { ok: true, url: issue.html_url });
}
