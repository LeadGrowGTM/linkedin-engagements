const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = 'https://api.apify.com/v2/acts';

function requireToken() {
  if (!APIFY_TOKEN) throw new Error('APIFY_TOKEN not configured');
  return APIFY_TOKEN;
}

async function callApify(actorId, input, timeoutSec = 120) {
  const token = requireToken();
  const url = `${APIFY_BASE}/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Apify ${actorId} failed (${res.status}): ${text.slice(0, 300)}`);
  }

  return res.json();
}

// Part 1: Scrape posts from a profile
async function scrapePosts(profileUrl, { limit = 3, minDate } = {}) {
  const input = {
    deepScrape: true,
    limitPerSource: Math.min(limit, 10),
    rawData: false,
    urls: [profileUrl],
  };
  if (minDate) input.scrapeUntil = minDate;

  const items = await callApify('supreme_coder~linkedin-post', input);

  const minDateObj = minDate ? new Date(minDate) : null;
  return (items || [])
    .filter(item => item.post_type !== 'repost')
    .filter(item => {
      if (!minDateObj || !item.postedAtTimestamp) return true;
      return new Date(item.postedAtTimestamp) >= minDateObj;
    })
    .slice(0, limit);
}

// Part 2: Scrape reactions for a post
async function scrapeReactions(postUrl) {
  const items = await callApify('apimaestro~linkedin-post-reactions', {
    post_url: postUrl,
    reaction_type: 'ALL',
  });
  return items || [];
}

// Part 2: Scrape comments for a post
async function scrapeComments(postUrl) {
  const COMMENTS_URL = process.env.COMMENTS_PROXY_URL
    || 'https://lglinkedinscraper.up.railway.app/comments';

  const res = await fetch(COMMENTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postUrl }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Comments scrape failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  // The proxy returns an array of items, each with a comments[] array
  return Array.isArray(data) ? data : [data];
}

// Part 3: Enrich a single profile
async function enrichProfile(urn) {
  const items = await callApify('apimaestro~linkedin-profile-detail', {
    includeEmail: true,
    username: urn,
  });
  return (items && items[0]) || null;
}

module.exports = { scrapePosts, scrapeReactions, scrapeComments, enrichProfile };
