const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (or restrict to your dashboard domain)
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'clay-proxy',
    message: 'POST to /push with Clay webhook URL in body or CLAY_WEBHOOK_URL env var'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Main proxy endpoint
app.post('/push', async (req, res) => {
  try {
    // Get Clay webhook URL from request body or environment variable
    const clayWebhookUrl = req.body._clayWebhookUrl || process.env.CLAY_WEBHOOK_URL;

    if (!clayWebhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'No Clay webhook URL provided. Set CLAY_WEBHOOK_URL env var or include _clayWebhookUrl in body.'
      });
    }

    // Remove the internal field before forwarding
    const payload = { ...req.body };
    delete payload._clayWebhookUrl;

    console.log(`Proxying to Clay: ${clayWebhookUrl}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(clayWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`Clay response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error('Clay error:', responseText);
      return res.status(response.status).json({
        success: false,
        error: `Clay returned ${response.status}: ${responseText}`
      });
    }

    // Try to parse response as JSON, otherwise return as text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText || 'OK';
    }

    res.json({
      success: true,
      message: 'Lead pushed to Clay successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal proxy error'
    });
  }
});

// Batch push endpoint (for multiple leads)
app.post('/push/batch', async (req, res) => {
  try {
    const { leads, _clayWebhookUrl } = req.body;
    const clayWebhookUrl = _clayWebhookUrl || process.env.CLAY_WEBHOOK_URL;

    if (!clayWebhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'No Clay webhook URL provided'
      });
    }

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No leads provided. Send { leads: [...], _clayWebhookUrl: "..." }'
      });
    }

    console.log(`Batch pushing ${leads.length} leads to Clay`);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const lead of leads) {
      try {
        const response = await fetch(clayWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          errors.push(`Lead ${lead.linkedin_url || 'unknown'}: HTTP ${response.status}`);
        }
      } catch (error) {
        failCount++;
        errors.push(`Lead ${lead.linkedin_url || 'unknown'}: ${error.message}`);
      }
    }

    const success = failCount === 0;
    const message = success
      ? `Pushed ${successCount} leads to Clay`
      : `Pushed ${successCount} leads, ${failCount} failed`;

    res.json({
      success,
      message,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit errors returned
    });

  } catch (error) {
    console.error('Batch proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal proxy error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Clay proxy server running on port ${PORT}`);
  console.log(`CLAY_WEBHOOK_URL: ${process.env.CLAY_WEBHOOK_URL ? 'Set' : 'Not set (will use per-request URL)'}`);
  console.log(`ALLOWED_ORIGIN: ${process.env.ALLOWED_ORIGIN || '*'}`);
});
