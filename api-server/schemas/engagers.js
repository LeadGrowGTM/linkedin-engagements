const { z } = require('zod');

const engagerQuerySchema = z.object({
  parent_profile: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
  min_score: z.coerce.number().int().min(0).max(100).optional(),
  lead_status: z.enum(['hot', 'warm', 'cold']).optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  webhook: z.string().url().optional(),
  include_data: z.enum(['true', 'false']).optional().default('false'),
});

module.exports = { engagerQuerySchema };
