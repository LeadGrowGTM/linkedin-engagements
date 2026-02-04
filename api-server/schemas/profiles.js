const { z } = require('zod');

const createProfileSchema = z.object({
  profile_url: z.string().min(1).refine(
    url => url.includes('linkedin.com/in/'),
    { message: 'Must be a valid LinkedIn profile URL (contains linkedin.com/in/)' }
  ),
  webhooks: z.array(z.string().url()).optional().default([]),
  description: z.string().max(1000).optional().default(''),
  category: z.string().optional().nullable().default(null),
  is_enabled: z.boolean().optional().default(true),
});

const updateProfileSchema = z.object({
  webhooks: z.array(z.string().url()).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().optional().nullable(),
  is_enabled: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

module.exports = { createProfileSchema, updateProfileSchema };
