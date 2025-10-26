export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  linkedin: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          color: string
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          color?: string
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          color?: string
          created_at?: string | null
        }
      }
      post_engagements: {
        Row: {
          id: number
          engager_profile_url: string
          post_url: string
          post_text: string | null
          monitored_profile_url: string
          engagement_type: string | null
          engaged_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          engager_profile_url: string
          post_url: string
          post_text?: string | null
          monitored_profile_url: string
          engagement_type?: string | null
          engaged_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          engager_profile_url?: string
          post_url?: string
          post_text?: string | null
          monitored_profile_url?: string
          engagement_type?: string | null
          engaged_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      linkedin_profiles: {
        Row: {
          id: number
          profile_url: string
          is_enabled: boolean | null
          created_at: string | null
          Webhook: string | null
          webhooks: Json | null
          description: string | null
          category: string | null
        }
        Insert: {
          id?: number
          profile_url: string
          is_enabled?: boolean | null
          created_at?: string | null
          Webhook?: string | null
          webhooks?: Json | null
          description?: string | null
          category?: string | null
        }
        Update: {
          id?: number
          profile_url?: string
          is_enabled?: boolean | null
          created_at?: string | null
          Webhook?: string | null
          webhooks?: Json | null
          description?: string | null
          category?: string | null
        }
      }
      linkedin_posts: {
        Row: {
          id: number
          post_url: string
          post_text: string | null
          profile_url: string | null
          posted_at_timestamp: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          post_url: string
          post_text?: string | null
          profile_url?: string | null
          posted_at_timestamp?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          post_url?: string
          post_text?: string | null
          profile_url?: string | null
          posted_at_timestamp?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      enriched_profiles: {
        Row: {
          profile_url: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          headline: string | null
          company_name: string | null
          company_linkedin_url: string | null
          company_website: string | null
          location: string | null
          connections: number | null
          followers: number | null
          experiences: Json | null
          skills: Json | null
          raw_data: Json | null
          created_at: string | null
          last_enriched_at: string | null
          public_identifier: string | null
          company_size: string | null
          company_industry: string | null
          updates: Json | null
          about: string | null
          experience: Json | null
          licenseAndCertificates: Json | null
          honorsAndAwards: Json | null
          languages: Json | null
          volunteerAndAwards: Json | null
          organizations: Json | null
          totalTenureMonths: string | null
          totalTenureDays: string | null
          urn: string | null
          educations: Json | null
          parent_profile: string | null
        }
        Insert: {
          profile_url: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          headline?: string | null
          company_name?: string | null
          company_linkedin_url?: string | null
          company_website?: string | null
          location?: string | null
          connections?: number | null
          followers?: number | null
          experiences?: Json | null
          skills?: Json | null
          raw_data?: Json | null
          created_at?: string | null
          last_enriched_at?: string | null
          public_identifier?: string | null
          company_size?: string | null
          company_industry?: string | null
          updates?: Json | null
          about?: string | null
          experience?: Json | null
          licenseAndCertificates?: Json | null
          honorsAndAwards?: Json | null
          languages?: Json | null
          volunteerAndAwards?: Json | null
          organizations?: Json | null
          totalTenureMonths?: string | null
          totalTenureDays?: string | null
          urn?: string | null
          educations?: Json | null
          parent_profile?: string | null
        }
        Update: {
          profile_url?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          headline?: string | null
          company_name?: string | null
          company_linkedin_url?: string | null
          company_website?: string | null
          location?: string | null
          connections?: number | null
          followers?: number | null
          experiences?: Json | null
          skills?: Json | null
          raw_data?: Json | null
          created_at?: string | null
          last_enriched_at?: string | null
          public_identifier?: string | null
          company_size?: string | null
          company_industry?: string | null
          updates?: Json | null
          about?: string | null
          experience?: Json | null
          licenseAndCertificates?: Json | null
          honorsAndAwards?: Json | null
          languages?: Json | null
          volunteerAndAwards?: Json | null
          organizations?: Json | null
          totalTenureMonths?: string | null
          totalTenureDays?: string | null
          urn?: string | null
          educations?: Json | null
          parent_profile?: string | null
        }
      }
    }
  }
}

