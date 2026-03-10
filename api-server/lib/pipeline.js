const { supabase } = require('./supabase');
const { scrapePosts, scrapeReactions, scrapeComments, enrichProfile } = require('./apify');

// ── Deduplication logic (replaces n8n Part 2 JavaScript node) ──────────

function deduplicateEngagers(reactionItems, commentItems, parentProfileUrl) {
  const uniqueProfiles = new Map();

  const addOrUpdate = (profileUrl, contactInfo, engagement) => {
    if (!profileUrl) return; // skip private profiles

    if (!uniqueProfiles.has(profileUrl)) {
      uniqueProfiles.set(profileUrl, { contact: contactInfo, engagements: [] });
    }

    const existing = uniqueProfiles.get(profileUrl);
    for (const key in contactInfo) {
      if (contactInfo[key] && !existing.contact[key]) {
        existing.contact[key] = contactInfo[key];
      }
    }
    if (engagement) existing.engagements.push(engagement);
  };

  // Process reactions
  for (const item of reactionItems) {
    if (item.reactor && item.reactor.profile_url) {
      addOrUpdate(item.reactor.profile_url, {
        name: item.reactor.name,
        headline: item.reactor.headline,
        profileUrl: item.reactor.profile_url,
        urn: item.reactor.urn || null,
      }, {
        type: 'reaction',
        value: item.reaction_type || 'UNKNOWN',
      });
    }
  }

  // Process comments
  for (const item of commentItems) {
    if (item.comments && Array.isArray(item.comments)) {
      for (const comment of item.comments) {
        if (comment.author && comment.author.profileUrl) {
          addOrUpdate(comment.author.profileUrl, {
            name: comment.author.name,
            headline: null,
            profileUrl: comment.author.profileUrl,
            urn: comment.author.urn || null,
          }, {
            type: 'comment',
            value: comment.text || '',
          });
        }
      }
    }
  }

  // Filter out the monitored profile itself
  uniqueProfiles.delete(parentProfileUrl);

  return Array.from(uniqueProfiles.values()).map(profile => ({
    parent: parentProfileUrl,
    ...profile,
  }));
}

// ── Map Apify enrichment response to enriched_profiles columns ──────────

function mapEnrichedProfile(apifyData, engager) {
  return {
    profile_url: apifyData.profileUrl || engager.contact.profileUrl,
    first_name: apifyData.firstName || null,
    last_name: apifyData.lastName || null,
    full_name: apifyData.fullName || engager.contact.name || null,
    headline: apifyData.headline || engager.contact.headline || null,
    company_name: apifyData.company_name || null,
    company_linkedin_url: apifyData.company_linkedin_url || null,
    company_website: apifyData.company_website || null,
    company_size: apifyData.company_size || null,
    company_industry: apifyData.company_industry || null,
    location: apifyData.location || null,
    connections: apifyData.connections || null,
    followers: apifyData.followers || null,
    skills: apifyData.skills || null,
    public_identifier: apifyData.publicIdentifier || null,
    totalTenureMonths: apifyData.totalTenureMonths || null,
    totalTenureDays: apifyData.totalTenureDays || null,
    urn: apifyData.urn || engager.contact.urn || null,
    updates: apifyData.updates || null,
    experience: apifyData.experiences || null,
    about: apifyData.about || null,
    educations: apifyData.educations || null,
    licenseAndCertificates: apifyData.licenseAndCertificates || null,
    honorsAndAwards: apifyData.honorsAndAwards || null,
    languages: apifyData.languages || null,
    volunteerAndAwards: apifyData.volunteerAndAwards || null,
    organizations: apifyData.organizations || null,
    parent_profile: engager.parent,
    engagement_type: engager.engagements[0]?.type || null,
    engagement_value: engager.engagements[0]?.value || null,
    raw_data: apifyData,
  };
}

// ── Save posts to DB (extracted from /api/scrape/direct) ──────────

async function savePosts(posts, profileUrl) {
  const saved = [];
  for (const post of posts) {
    if (!post.url) continue;

    const postId = post.urn ? post.urn.split(':').pop() : null;
    const postedAt = post.postedAtTimestamp
      ? new Date(post.postedAtTimestamp).toISOString()
      : null;

    const record = {
      post_url: post.url,
      profile_url: post.inputUrl || profileUrl,
      post_text: post.text || null,
      posted_at_timestamp: postedAt,
      post_id: postId,
      status: 'PENDING',
    };

    const { data: existing } = await supabase
      .from('linkedin_posts')
      .select('id')
      .eq('post_url', post.url)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('linkedin_posts')
        .update({ post_text: record.post_text, posted_at_timestamp: postedAt, updated_at: new Date().toISOString() })
        .eq('post_url', post.url);
    } else {
      await supabase.from('linkedin_posts').insert(record);
    }

    saved.push(record);
  }
  return saved;
}

// ── Process engagers for a set of posts (replaces n8n Parts 2 + 3) ──────────

async function processEngagers({ postUrls, profileUrl } = {}) {
  const result = {
    posts_processed: 0,
    engagers_found: 0,
    engagers_enriched: 0,
    engagers_skipped: 0,
    engagements_saved: 0,
    errors: [],
  };

  // Step 1: Get posts to process
  let posts;
  if (postUrls && postUrls.length > 0) {
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .in('post_url', postUrls);
    if (error) throw error;
    posts = data || [];
  } else if (profileUrl) {
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .eq('profile_url', profileUrl)
      .in('status', ['PENDING', 'PROCESSING']);
    if (error) throw error;
    posts = data || [];
  } else {
    // All PENDING posts
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .eq('status', 'PENDING');
    if (error) throw error;
    posts = data || [];
  }

  if (posts.length === 0) {
    return result;
  }

  // Mark posts as PROCESSING
  const postUrlList = posts.map(p => p.post_url);
  await supabase
    .from('linkedin_posts')
    .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
    .in('post_url', postUrlList);

  // Step 2: For each post, scrape reactions + comments
  for (const post of posts) {
    try {
      const parentProfile = post.profile_url;
      console.log(`Processing post: ${post.post_url}`);

      // Scrape reactions and comments in parallel
      const [reactionsResult, commentsResult] = await Promise.allSettled([
        scrapeReactions(post.post_url),
        scrapeComments(post.post_url),
      ]);

      const reactions = reactionsResult.status === 'fulfilled' ? reactionsResult.value : [];
      const comments = commentsResult.status === 'fulfilled' ? commentsResult.value : [];

      if (reactionsResult.status === 'rejected') {
        result.errors.push(`Reactions failed for ${post.post_url}: ${reactionsResult.reason.message}`);
      }
      if (commentsResult.status === 'rejected') {
        result.errors.push(`Comments failed for ${post.post_url}: ${commentsResult.reason.message}`);
      }

      // Deduplicate engagers
      const engagers = deduplicateEngagers(reactions, comments, parentProfile);
      result.engagers_found += engagers.length;
      console.log(`Found ${engagers.length} unique engagers for post`);

      // Step 3: Dedup against existing enriched_profiles
      for (const engager of engagers) {
        const urn = engager.contact.urn;
        const engagerProfileUrl = engager.contact.profileUrl;

        if (!urn && !engagerProfileUrl) {
          result.errors.push(`Skipping engager with no URN or profileUrl: ${engager.contact.name}`);
          continue;
        }

        // Check if already enriched
        let alreadyExists = false;
        if (urn) {
          const { data: existing } = await supabase
            .from('enriched_profiles')
            .select('profile_url')
            .eq('urn', urn)
            .eq('parent_profile', parentProfile)
            .maybeSingle();
          alreadyExists = !!existing;
        }

        // Step 4: Enrich new engagers
        if (!alreadyExists) {
          try {
            const lookupId = urn || engagerProfileUrl;
            console.log(`Enriching: ${engager.contact.name} (${lookupId})`);
            const enriched = await enrichProfile(lookupId);

            if (enriched) {
              const record = mapEnrichedProfile(enriched, engager);
              const { error: insertError } = await supabase
                .from('enriched_profiles')
                .upsert(record, { onConflict: 'profile_url' });

              if (insertError) {
                result.errors.push(`Insert failed for ${engager.contact.name}: ${insertError.message}`);
              } else {
                result.engagers_enriched++;
              }
            } else {
              result.errors.push(`No enrichment data for ${engager.contact.name}`);
            }
          } catch (err) {
            result.errors.push(`Enrichment failed for ${engager.contact.name}: ${err.message}`);
          }
        } else {
          result.engagers_skipped++;
        }

        // Step 5: Save post_engagements (for both new and existing)
        try {
          const resolvedProfileUrl = engager.contact.profileUrl || engagerProfileUrl;
          if (resolvedProfileUrl) {
            const { error: engError } = await supabase
              .from('post_engagements')
              .upsert({
                engager_profile_url: resolvedProfileUrl,
                post_url: post.post_url,
                post_text: post.post_text || null,
                monitored_profile_url: parentProfile,
                engagement_type: engager.engagements[0]?.type || null,
              }, { onConflict: 'engager_profile_url,post_url' });

            if (!engError) result.engagements_saved++;
          }
        } catch (err) {
          result.errors.push(`Engagement save failed: ${err.message}`);
        }
      }

      // Step 6: Mark post as processed
      await supabase
        .from('linkedin_posts')
        .update({ status: 'PROCESSED - 1', updated_at: new Date().toISOString() })
        .eq('post_url', post.post_url);

      result.posts_processed++;
    } catch (err) {
      result.errors.push(`Post processing failed for ${post.post_url}: ${err.message}`);
    }
  }

  // Cap errors
  if (result.errors.length > 20) {
    const total = result.errors.length;
    result.errors = result.errors.slice(0, 20);
    result.errors.push(`... and ${total - 20} more`);
  }

  return result;
}

// ── Full pipeline: scrape posts → scrape engagers → enrich ──────────

async function runFullPipeline(profileUrl, { limit = 5, minDate } = {}) {
  console.log(`Running full pipeline for ${profileUrl}`);

  // Step 1: Scrape posts
  const rawPosts = await scrapePosts(profileUrl, { limit, minDate });
  const savedPosts = await savePosts(rawPosts, profileUrl);
  console.log(`Scraped and saved ${savedPosts.length} posts`);

  if (savedPosts.length === 0) {
    return {
      posts_scraped: 0,
      posts_processed: 0,
      engagers_found: 0,
      engagers_enriched: 0,
      engagers_skipped: 0,
      engagements_saved: 0,
      errors: [],
    };
  }

  // Step 2: Process engagers for those posts
  const postUrls = savedPosts.map(p => p.post_url);
  const engagerResult = await processEngagers({ postUrls });

  return {
    posts_scraped: savedPosts.length,
    ...engagerResult,
  };
}

module.exports = { processEngagers, runFullPipeline, savePosts, deduplicateEngagers };
