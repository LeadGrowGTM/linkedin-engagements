/**
 * Part 1: Scrape Posts
 *
 * Fetches enabled profiles from linkedin_profiles, scrapes their recent posts
 * via Apify, and inserts/updates them in linkedin_posts with status PENDING.
 */

const { supabase } = require('./lib/supabase');
const { runActor } = require('./lib/apify');

async function scrapePosts() {
  console.log('[Part 1] Fetching enabled profiles...');

  const { data: profiles, error } = await supabase
    .from('linkedin_profiles')
    .select('profile_url')
    .eq('is_enabled', true);

  if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
  if (!profiles?.length) {
    console.log('[Part 1] No enabled profiles found.');
    return { scraped: 0, inserted: 0, updated: 0 };
  }

  console.log(`[Part 1] Found ${profiles.length} enabled profile(s).`);

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalScraped = 0;

  for (const profile of profiles) {
    console.log(`[Part 1] Scraping posts for: ${profile.profile_url}`);

    let items;
    try {
      items = await runActor('supreme_coder~linkedin-post', {
        deepScrape: true,
        limitPerSource: 3,
        rawData: false,
        urls: [profile.profile_url],
      });
    } catch (err) {
      console.error(`[Part 1] Apify error for ${profile.profile_url}: ${err.message}`);
      continue;
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`[Part 1] No posts returned for ${profile.profile_url}`);
      continue;
    }

    // Filter out reposts
    const posts = items.filter((item) => item.post_type !== 'repost');
    console.log(`[Part 1] ${posts.length} non-repost(s) found (${items.length} total).`);
    totalScraped += posts.length;

    for (const post of posts) {
      const postUrl = post.url;
      if (!postUrl) continue;

      const postId = post.urn ? post.urn.split(':').pop() : null;
      const postedAt = post.postedAtTimestamp
        ? new Date(post.postedAtTimestamp).toISOString()
        : null;

      // Check if post already exists
      const { data: existing } = await supabase
        .from('linkedin_posts')
        .select('id')
        .eq('post_url', postUrl)
        .maybeSingle();

      if (existing) {
        // Update existing post
        const { error: updateErr } = await supabase
          .from('linkedin_posts')
          .update({
            post_text: post.text || null,
            posted_at_timestamp: postedAt,
            post_id: postId,
            updated_at: new Date().toISOString(),
          })
          .eq('post_url', postUrl);

        if (updateErr) {
          console.error(`[Part 1] Update failed for ${postUrl}: ${updateErr.message}`);
        } else {
          totalUpdated++;
        }
      } else {
        // Insert new post
        const { error: insertErr } = await supabase
          .from('linkedin_posts')
          .insert({
            post_url: postUrl,
            profile_url: post.inputUrl || profile.profile_url,
            post_text: post.text || null,
            posted_at_timestamp: postedAt,
            post_id: postId,
            status: 'PENDING',
          });

        if (insertErr) {
          console.error(`[Part 1] Insert failed for ${postUrl}: ${insertErr.message}`);
        } else {
          totalInserted++;
        }
      }
    }
  }

  const result = { scraped: totalScraped, inserted: totalInserted, updated: totalUpdated };
  console.log('[Part 1] Done.', result);
  return result;
}

// Run directly or export for use by run-all.js / API server
if (require.main === module) {
  scrapePosts()
    .then((result) => {
      console.log('[Part 1] Complete:', JSON.stringify(result));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Part 1] Fatal:', err);
      process.exit(1);
    });
}

module.exports = { scrapePosts };
