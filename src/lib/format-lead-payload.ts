export interface LeadData {
  profile_url: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  headline?: string | null
  about?: string | null
  company_name?: string | null
  company_linkedin_url?: string | null
  company_website?: string | null
  company_industry?: string | null
  company_size?: string | null
  location?: string | null
  connections?: number | null
  followers?: number | null
  skills?: unknown
  experiences?: unknown
  experience?: unknown // DB has both columns
  educations?: unknown
  updates?: unknown
  licenseAndCertificates?: unknown
  honorsAndAwards?: unknown
  languages?: unknown
  volunteerAndAwards?: unknown
  organizations?: unknown
  totalTenureMonths?: string | null
  totalTenureDays?: string | null
  urn?: string | null
  public_identifier?: string | null
  parent_profile?: string | null
  created_at?: string | null
  last_enriched_at?: string | null
  raw_data?: unknown
  engagement_type?: string | null
  engagement_value?: string | null
}

export function formatLeadPayload(lead: LeadData) {
  // Extract email from raw_data if available
  const rawData = lead.raw_data as Record<string, unknown> | null
  const email = rawData?.email || rawData?.emailAddress || null

  return {
    // Identifiers
    linkedin_url: lead.profile_url,
    urn: lead.urn,
    public_identifier: lead.public_identifier,

    // Basic info
    full_name: lead.full_name,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email,
    headline: lead.headline,
    about: lead.about,
    location: lead.location,
    connections: lead.connections,
    followers: lead.followers,

    // Company
    company_name: lead.company_name,
    company_linkedin_url: lead.company_linkedin_url,
    company_website: lead.company_website,
    company_industry: lead.company_industry,
    company_size: lead.company_size,

    // Career data
    skills: lead.skills,
    experiences: lead.experiences || lead.experience,
    educations: lead.educations,
    licenseAndCertificates: lead.licenseAndCertificates,
    honorsAndAwards: lead.honorsAndAwards,
    languages: lead.languages,
    volunteerAndAwards: lead.volunteerAndAwards,
    organizations: lead.organizations,
    updates: lead.updates,

    // Tenure
    totalTenureMonths: lead.totalTenureMonths,
    totalTenureDays: lead.totalTenureDays,

    // Engagement data
    engagement_type: lead.engagement_type,
    engagement_value: lead.engagement_value,

    // Metadata
    parent_profile: lead.parent_profile,
    created_at: lead.created_at,
    last_enriched_at: lead.last_enriched_at,
    raw_data: lead.raw_data,
    pushed_at: new Date().toISOString(),
  }
}
