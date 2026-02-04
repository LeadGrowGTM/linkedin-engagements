// Run the full scraping pipeline: Posts first, then Engagers.
//
// Usage:
//   node scripts/run-all.js
//
// Or schedule via cron:
//   0 */6 * * * cd /path/to/repo && node scripts/run-all.js >> logs/scrape.log 2>&1

const { scrapePosts } = require('./scrape-posts');
const { scrapeEngagers } = require('./scrape-engagers');

async function main() {
  const start = Date.now();
  console.log('='.repeat(60));
  console.log(`Scrape pipeline started at ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  console.log('\n--- Step 1: Scrape Posts ---\n');
  const postsResult = await scrapePosts();

  console.log('\n--- Step 2: Scrape Engagers & Enrich ---\n');
  const engagersResult = await scrapeEngagers();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('Pipeline complete.');
  console.log(`  Posts scraped: ${postsResult.scraped} (${postsResult.inserted} new, ${postsResult.updated} updated)`);
  console.log(`  Engagers found: ${engagersResult.engagers} across ${engagersResult.posts} post(s)`);
  console.log(`  Profiles enriched: ${engagersResult.enriched}`);
  console.log(`  Elapsed: ${elapsed}s`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
