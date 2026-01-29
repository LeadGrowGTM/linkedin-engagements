# Clay Proxy Service

A simple CORS proxy for pushing leads from the LinkedIn Dashboard to Clay.

## Why?

Browsers block direct requests to external APIs (like Clay webhooks) due to CORS restrictions. This proxy runs server-side and forwards requests to Clay.

## Deploy to Railway

1. Create a new project in Railway
2. Connect this `clay-proxy` folder as a GitHub repo (or use the monorepo feature)
3. Set environment variables:
   - `CLAY_WEBHOOK_URL` - Your Clay webhook URL (optional, can also be sent per-request)
   - `ALLOWED_ORIGIN` - Your dashboard URL for security (e.g., `https://your-dashboard.railway.app`), or `*` for any origin
4. Deploy!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001, Railway sets this automatically) |
| `CLAY_WEBHOOK_URL` | No | Default Clay webhook URL. Can be overridden per-request. |
| `ALLOWED_ORIGIN` | No | CORS allowed origin. Default `*` (all origins). Set to your dashboard URL for security. |

## API Endpoints

### `GET /`
Health check, returns service info.

### `GET /health`
Health check for Railway/monitoring.

### `POST /push`
Push a single lead to Clay.

**Body:**
```json
{
  "linkedin_url": "https://linkedin.com/in/someone",
  "full_name": "John Doe",
  "headline": "CEO at Company",
  "company_name": "Company Inc",
  "_clayWebhookUrl": "https://app.clay.com/..."
}
```

Note: `_clayWebhookUrl` is optional if `CLAY_WEBHOOK_URL` env var is set. It will be stripped before forwarding to Clay.

### `POST /push/batch`
Push multiple leads to Clay.

**Body:**
```json
{
  "leads": [
    { "linkedin_url": "...", "full_name": "..." },
    { "linkedin_url": "...", "full_name": "..." }
  ],
  "_clayWebhookUrl": "https://app.clay.com/..."
}
```

## Local Development

```bash
cd clay-proxy
npm install
CLAY_WEBHOOK_URL=https://your-clay-webhook npm start
```

## Dashboard Configuration

After deploying, update your dashboard Settings:
- Set "Clay Webhook URL" to: `https://your-clay-proxy.railway.app/push`

The dashboard will automatically use `/push/batch` for bulk operations.
