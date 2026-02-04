/**
 * Part 2+3: Scrape Engagers & Enrich Profiles
 *
 * Phase A (Part 2): Fetch PENDING posts, scrape reactions + comments via Apify,
 *   merge and deduplicate engagers.
 * Phase B (Part 3): Enrich new engagers via Apify profile detail, save to
 *   enriched_profiles and post_engagements.
 */

const { supabase } = require('./lib/supabase');
const { runActor } = require('./lib/apify');

// ---------------------------------------------------------------------------
// Phase A: Get engagers from reactions + comments
// ---------------------------------------------------------------------------

async function fetchPendingPosts() {
  const { data: posts, error } = await supabase
    .from('linkedin_posts')
    .select('*')
    .eq('status', 'PENDING');

  if (error) throw new Error(`Failed to fetch posts: ${error.message}`);
  if (!posts?.length) return [];

  const now = Date.now();
  const HOURS_48 = 48 * 60 * 60 * 1000;
  const HOURS_500 = 500 * 60 * 60 * 1000;

  return posts.filter((post) => {
    const createdAt = new Date(post.created_at).getTime();
    const postedAt = post.posted_at_timestamp
      ? new Date(post.posted_at_timestamp).getTime()
      : 0;
    return (now - createdAt) >= HOURS_48 || (postedAt && (now - postedAt) <= HOURS_500);
  });
}

/**
 * Deduplicate engagers from reactions + comments.
 * Returns a Map keyed by profileUrl with aggregated engagements.
 */
function deduplicateEngagers(reactions, comments, parentProfile, postUrl) {
  const profileMap = new Map();

  function addEngager(profileUrl, name, headline, urn, engagementType, engagementValue) {
    if (!profileUrl) return;
    const key = profileUrl;
    if (!profileMap.has(key)) {
      profileMap.set(key, {
        parent: parentProfile,
        post_url: postUrl,
        contact: { name, headline, profileUrl, urn },
        engagements: [],
      });
    }
    profileMap.get(key).engagements.push({ type: engagementType, value: engagementValue || '' });
  }

  // Process reactions
  for (const item of reactions) {
    if (item.reactionType && item.actor) {
      addEngager(
        item.actor.linkedinUrl,
        item.actor.name,
        item.actor.position,
        item.actor.id,
        'reaction',
        item.reactionType
      );
    }
  }

  // Process comments (new format: top-level with commentary field)
  for (const item of comments) {
    if (item.commentary && item.actor) {
      addEngager(
        item.actor.linkedinUrl,
        item.actor.name,
        item.actor.position,
        item.actor.id,
        'comment',
        item.commentary
      );

      // Process replies
      if (Array.isArray(item.replies)) {
        for (const reply of item.replies) {
          if (reply.actor) {
            addEngager(
              reply.actor.linkedinUrl,
              reply.actor.name,
              reply.actor.position,
              reply.actor.id,
              'comment_reply',
              reply.commentary || ''
            );
          }
        }
      }
    }

    // Old format: comments array inside each item
    if (Array.isArray(item.comments)) {
      for (const comment of item.comments) {
        if (comment.author) {
          addEngager(
            comment.author.linkedinUrl || comment.author.url,
            comment.author.name,
            comment.author.headline,
            comment.author.id,
            'comment',
            comment.text || ''
          );
        }
      }
    }
  }

  return profileMap;
}

// ---------------------------------------------------------------------------
// Phase B: Enrich profiles and save
// ---------------------------------------------------------------------------

async function enrichAndSave(engagerMap) {
  let enriched = 0;
  let skipped = 0;
  let engagementsSaved = 0;

  for (const [, engager] of engagerMap) {
    const { contact, parent, post_url, engagements } = engager;
    const urn = contact.urn;

    // Check if already enriched for this parent profile
    const { data: existing } = await supabase
      .from('enriched_profiles')
      .select('profile_url')
      .eq('urn', urn)
      .eq('parent_profile', parent)
      .maybeSingle();

    let profileUrl = existing?.profile_url;

    if (!existing) {
      // Enrich via Apify
      console.log(`  Enriching: ${contact.name || urn}`);
      try {
        const items = await runActor('apimaestro~linkedin-profile-detail', {
          includeEmail: true,
          username: urn,
        });

        const profile = Array.isArray(items) && items.length > 0 ? items[0] : null;
        if (!profile) {
          console.warn(`  No enrichment data for ${urn}, skipping.`);
          skipped++;
          continue;
        }

        const basicInfo = profile.basic_info || {};
        const locationFull = basicInfo.location
          ? (typeof basicInfo.location === 'string' ? basicInfo.location : basicInfo.location.full || '')
          : '';

        const row = {
          profile_url: basicInfo.profile_url || contact.profileUrl,
          first_name: basicInfo.first_name || null,
          last_name: basicInfo.last_name || null,
          full_name: basicInfo.fullname || contact.name || null,
          headline: basicInfo.headline || contact.headline || null,
          company_name: basicInfo.current_company || null,
          company_linkedin_url: basicInfo.current_company_url || null,
          location: locationFull || null,
          connections: basicInfo.connection_count || null,
          followers: basicInfo.follower_count || null,
          skills: basicInfo.top_skills || null,
          public_identifier: basicInfo.public_identifier || null,
          urn: basicInfo.urn || urn,
          experience: profile.experience || null,
          about: basicInfo.about || null,
          educations: profile.education || null,
          parent_profile: parent,
          engagement_type: engagements[0]?.type || null,
          engagement_value: engagements[0]?.value || null,
          last_enriched_at: new Date().toISOString(),
        };

        const { error: insertErr } = await supabase
          .from('enriched_profiles')
          .insert(row);

        if (insertErr) {
          console.error(`  Insert failed for ${urn}: ${insertErr.message}`);
          skipped++;
          continue;
        }

        profileUrl = row.profile_url;
        enriched++;
      } catch (err) {
        console.error(`  Enrichment error for ${urn}: ${err.message}`);
        skipped++;
        continue;
      }
    } else {
      skipped++;
    }

    // Save engagements to post_engagements
    if (profileUrl) {
      // Fetch post text for denormalization
      const { data: postData } = await supabase
        .from('linkedin_posts')
        .select('post_text, profile_url')
        .eq('post_url', post_url)
        .maybeSingle();

      const { error: engErr } = await supabase
        .from('post_engagements')
        .insert({
            engager_profile_url: profileUrl,
            post_url: post_url,
            post_text: postData?.post_text || null,
            monitored_profile_url: postData?.profile_url || parent,
            engagement_type: engagements[0]?.type || 'like',
            engagement_value: engagements[0]?.value || null,
            engaged_at: new Date().toISOString(),
        });

      if (engErr) {
        // Ignore duplicate key errors (engagement already recorded)
        if (!engErr.message.includes('duplicate key')) {
          console.error(`  Engagement save failed: ${engErr.message}`);
        }
      } else {
        engagementsSaved++;
      }
    }
  }

  return { enriched, skipped, engagementsSaved };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function scrapeEngagers() {
  console.log('[Part 2+3] Fetching PENDING posts...');

  const posts = await fetchPendingPosts();
  if (posts.length === 0) {
    console.log('[Part 2+3] No qualifying posts found.');
    return { posts: 0, engagers: 0, enriched: 0 };
  }

  console.log(`[Part 2+3] ${posts.length} post(s) to process.`);

  let totalEngagers = 0;
  let totalEnriched = 0;

  for (const post of posts) {
    console.log(`\n[Part 2] Processing: ${post.post_url}`);

    // Set status to PROCESSING
    await supabase
      .from('linkedin_posts')
      .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
      .eq('post_url', post.post_url);

    // Fetch reactions and comments in parallel
    let reactions = [];
    let comments = [];

    const [reactionsResult, commentsResult] = await Promise.allSettled([
      runActor('harvestapi~linkedin-post-reactions', {
        maxItems: 20,
        posts: [post.post_url],
      }),
      runActor('harvestapi~linkedin-post-comments', {
        maxItems: 20,
        posts: [post.post_url],
      }),
    ]);

    if (reactionsResult.status === 'fulfilled') {
      reactions = Array.isArray(reactionsResult.value) ? reactionsResult.value : [];
      console.log(`  Reactions: ${reactions.length}`);
    } else {
      console.warn(`  Reactions failed: ${reactionsResult.reason?.message}`);
    }

    if (commentsResult.status === 'fulfilled') {
      comments = Array.isArray(commentsResult.value) ? commentsResult.value : [];
      console.log(`  Comments: ${comments.length}`);
    } else {
      console.warn(`  Comments failed: ${commentsResult.reason?.message}`);
    }

    // Deduplicate
    const engagerMap = deduplicateEngagers(reactions, comments, post.profile_url, post.post_url);
    console.log(`  Unique engagers: ${engagerMap.size}`);
    totalEngagers += engagerMap.size;

    // Phase B: Enrich and save
    if (engagerMap.size > 0) {
      console.log('[Part 3] Enriching and saving...');
      const result = await enrichAndSave(engagerMap);
      totalEnriched += result.enriched;
      console.log(`  Enriched: ${result.enriched}, Skipped: ${result.skipped}, Engagements: ${result.engagementsSaved}`);
    }

    // Mark post as processed
    await supabase
      .from('linkedin_posts')
      .update({ status: 'PROCESSED - 1', updated_at: new Date().toISOString() })
      .eq('post_url', post.post_url);

    console.log(`  Post marked PROCESSED - 1`);
  }

  const result = { posts: posts.length, engagers: totalEngagers, enriched: totalEnriched };
  console.log('\n[Part 2+3] Done.', result);
  return result;
}

if (require.main === module) {
  scrapeEngagers()
    .then((result) => {
      console.log('[Part 2+3] Complete:', JSON.stringify(result));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Part 2+3] Fatal:', err);
      process.exit(1);
    });
}

module.exports = { scrapeEngagers };
