// Lead scoring algorithm and utilities

export interface LeadScoreComponents {
  connectionsScore: number
  followersScore: number
  companySizeScore: number
  seniorityScore: number
  totalScore: number
}

export type LeadCategory = 'hot' | 'warm' | 'cold'

interface CompanySizeWeights {
  [key: string]: number
}

const COMPANY_SIZE_WEIGHTS: CompanySizeWeights = {
  '1-10': 0.3,
  '11-50': 0.5,
  '51-200': 0.7,
  '201-500': 0.8,
  '501-1000': 0.85,
  '1001-5000': 0.9,
  '5001-10000': 0.95,
  '10001+': 1.0,
}

const SENIORITY_KEYWORDS: { [key: string]: number } = {
  'founder': 1.0,
  'co-founder': 1.0,
  'ceo': 1.0,
  'chief': 0.95,
  'president': 0.95,
  'owner': 0.9,
  'vp': 0.85,
  'vice president': 0.85,
  'director': 0.75,
  'head of': 0.7,
  'manager': 0.5,
  'lead': 0.45,
  'senior': 0.4,
  'principal': 0.6,
}

export function calculateLeadScore(engager: {
  connections?: number | null
  followers?: number | null
  company_size?: string | null
  headline?: string | null
}): LeadScoreComponents {
  // Connections score (0-30 points)
  const connectionsScore = Math.min(((engager.connections || 0) / 500) * 30, 30)

  // Followers score (0-20 points)
  const followersScore = Math.min(((engager.followers || 0) / 1000) * 20, 20)

  // Company size score (0-30 points)
  let companySizeScore = 0
  if (engager.company_size) {
    const weight = COMPANY_SIZE_WEIGHTS[engager.company_size] || 0.5
    companySizeScore = weight * 30
  }

  // Seniority score based on headline (0-20 points)
  let seniorityScore = 0
  if (engager.headline) {
    const headlineLower = engager.headline.toLowerCase()
    for (const [keyword, weight] of Object.entries(SENIORITY_KEYWORDS)) {
      if (headlineLower.includes(keyword)) {
        seniorityScore = Math.max(seniorityScore, weight * 20)
      }
    }
  }

  const totalScore = Math.round(
    connectionsScore + followersScore + companySizeScore + seniorityScore
  )

  return {
    connectionsScore,
    followersScore,
    companySizeScore,
    seniorityScore,
    totalScore,
  }
}

export function getLeadCategory(score: number): LeadCategory {
  if (score >= 70) return 'hot'
  if (score >= 40) return 'warm'
  return 'cold'
}

export function getLeadCategoryColor(category: LeadCategory): string {
  switch (category) {
    case 'hot':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
    case 'warm':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
    case 'cold':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
  }
}

export function getLeadCategoryIcon(category: LeadCategory): string {
  switch (category) {
    case 'hot':
      return '🔥'
    case 'warm':
      return '⭐'
    case 'cold':
      return '📊'
  }
}

export function getLeadCategoryLabel(category: LeadCategory): string {
  switch (category) {
    case 'hot':
      return 'Hot Lead'
    case 'warm':
      return 'Warm Lead'
    case 'cold':
      return 'Cold Lead'
  }
}

// Analyze seniority from headline
export function getSeniorityLevel(headline?: string | null): string {
  if (!headline) return 'Unknown'
  
  const headlineLower = headline.toLowerCase()
  
  if (
    headlineLower.includes('ceo') ||
    headlineLower.includes('founder') ||
    headlineLower.includes('chief') ||
    headlineLower.includes('president')
  ) {
    return 'Executive'
  }
  
  if (
    headlineLower.includes('vp') ||
    headlineLower.includes('vice president') ||
    headlineLower.includes('director')
  ) {
    return 'Senior'
  }
  
  if (
    headlineLower.includes('manager') ||
    headlineLower.includes('lead') ||
    headlineLower.includes('head of')
  ) {
    return 'Mid-level'
  }
  
  if (headlineLower.includes('senior')) {
    return 'Senior'
  }
  
  return 'Entry/Mid-level'
}

