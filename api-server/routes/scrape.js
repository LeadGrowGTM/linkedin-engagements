const { Router } = require('express');
const { fork } = require('child_process');
const path = require('path');

const router = Router();

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const child = fork(scriptPath, [], { silent: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        resolve({ success: false, output: stdout, error: stderr || `Exit code ${code}` });
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// POST /api/scrape/posts - Trigger Part 1 (post scraping)
router.post('/posts', async (req, res, next) => {
  try {
    // Fire and forget -- respond immediately, script runs in background
    const child = fork(path.join(SCRIPTS_DIR, 'scrape-posts.js'), [], { silent: true, detached: true });
    child.unref();

    res.json({
      success: true,
      message: 'Post scraping workflow triggered',
      workflow: 'Part 1 - Scrape Posts',
      triggered_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scrape/engagers - Trigger Part 2+3 (engager scraping + enrichment)
router.post('/engagers', async (req, res, next) => {
  try {
    const child = fork(path.join(SCRIPTS_DIR, 'scrape-engagers.js'), [], { silent: true, detached: true });
    child.unref();

    res.json({
      success: true,
      message: 'Engager scraping workflow triggered',
      workflow: 'Part 2+3 - Scrape Engagers & Enrich',
      triggered_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
