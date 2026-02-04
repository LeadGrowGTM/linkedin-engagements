const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  console.error('Missing APIFY_TOKEN in .env');
  process.exit(1);
}

const APIFY_BASE = 'https://api.apify.com/v2/acts';

/**
 * Run an Apify actor synchronously and return the dataset items.
 * Uses run-sync-get-dataset-items for simplicity (blocks until done).
 */
async function runActor(actorId, input, { timeoutSecs = 300 } = {}) {
  const url = `${APIFY_BASE}/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeoutSecs}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Apify ${actorId} failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.json();
}

module.exports = { runActor };
