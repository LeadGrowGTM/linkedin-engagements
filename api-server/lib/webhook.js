async function deliverToWebhook(url, payload, { maxRetries = 2, delayMs = 1000 } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        return { success: true, status: response.status };
      }

      // Don't retry 4xx
      if (response.status >= 400 && response.status < 500) {
        return { success: false, status: response.status, error: `HTTP ${response.status}` };
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  return { success: false, error: lastError };
}

function formatLeadPayload(engager, leadScore) {
  const rawData = engager.raw_data || {};
  const email = rawData.email || rawData.emailAddress || null;

  return {
    linkedin_url: engager.profile_url,
    urn: engager.urn,
    public_identifier: engager.public_identifier,
    full_name: engager.full_name,
    first_name: engager.first_name,
    last_name: engager.last_name,
    email,
    headline: engager.headline,
    about: engager.about,
    location: engager.location,
    connections: engager.connections,
    followers: engager.followers,
    company_name: engager.company_name,
    company_linkedin_url: engager.company_linkedin_url,
    company_website: engager.company_website,
    company_industry: engager.company_industry,
    company_size: engager.company_size,
    skills: engager.skills,
    experiences: engager.experiences || engager.experience,
    educations: engager.educations,
    licenseAndCertificates: engager.licenseAndCertificates,
    honorsAndAwards: engager.honorsAndAwards,
    languages: engager.languages,
    volunteerAndAwards: engager.volunteerAndAwards,
    organizations: engager.organizations,
    updates: engager.updates,
    totalTenureMonths: engager.totalTenureMonths,
    totalTenureDays: engager.totalTenureDays,
    engagement_type: engager.engagement_type,
    engagement_value: engager.engagement_value,
    parent_profile: engager.parent_profile,
    created_at: engager.created_at,
    last_enriched_at: engager.last_enriched_at,
    raw_data: engager.raw_data,
    lead_score: leadScore.lead_score,
    lead_status: leadScore.lead_status,
    pushed_at: new Date().toISOString(),
  };
}

module.exports = { deliverToWebhook, formatLeadPayload };
