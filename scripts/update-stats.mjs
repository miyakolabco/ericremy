// Updates stats.json with Spotify data.
//   followers        -> official Spotify Web API (reliable)
//   monthlyListeners -> best-effort scrape of the public artist page (fragile)
// Fails safe: any value it can't fetch keeps its previous value in stats.json.

import { readFile, writeFile } from 'node:fs/promises';

const ARTIST_ID  = '1qwmFKnxnOwavv7ePQv8qQ';   // Eric Remy
const STATS_PATH = 'stats.json';

const id     = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (!id || !secret) {
  console.error('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET');
  process.exit(1);
}

async function getToken() {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error('Token request failed: ' + r.status);
  return (await r.json()).access_token;
}

async function getFollowers(token) {
  const r = await fetch(`https://api.spotify.com/v1/artists/${ARTIST_ID}`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!r.ok) throw new Error('Artist request failed: ' + r.status);
  const data = await r.json();
  return data?.followers?.total ?? null;
}

async function getMonthlyListeners() {
  // Not exposed by the official API — scrape the public artist page.
  try {
    const r = await fetch(`https://open.spotify.com/artist/${ARTIST_ID}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' }
    });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/([\d.,\u00a0\s]+?)\s*monthly listeners/i);
    if (!m) return null;
    const n = parseInt(m[1].replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

const stats = JSON.parse(await readFile(STATS_PATH, 'utf8'));

try {
  const token = await getToken();
  const followers = await getFollowers(token);
  if (followers != null) stats.spotifyFollowers = followers;
} catch (e) {
  console.error('Followers update skipped:', e.message);   // keep previous value
}

const ml = await getMonthlyListeners();
if (ml != null) {
  stats.spotifyMonthlyListeners = ml;
} else {
  console.error('Monthly listeners not found — kept previous value.');
}

stats.updated = new Date().toISOString().slice(0, 10);
await writeFile(STATS_PATH, JSON.stringify(stats, null, 2) + '\n');
console.log('Wrote stats.json:', JSON.stringify(stats));
