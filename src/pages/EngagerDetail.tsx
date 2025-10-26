import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Building2, MapPin, Users, Award, Briefcase, GraduationCap, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export default function EngagerDetail() {
  const { profileUrl } = useParams<{ profileUrl: string }>()
  const decodedUrl = profileUrl ? decodeURIComponent(profileUrl) : ''

  const { data: engager, isLoading } = useQuery({
    queryKey: ['engager-detail', decodedUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enriched_profiles')
        .select('*')
        .eq('profile_url', decodedUrl)
        .single()

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-center h-64">
          <p className="text-navy-500">Loading engager details...</p>
        </div>
      </div>
    )
  }

  if (!engager) {
    return (
      <div className="space-y-8">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Card className="p-12">
          <div className="text-center">
            <p className="text-navy-500">Engager not found</p>
          </div>
        </Card>
      </div>
    )
  }

  // Parse experience data
  const experiences = Array.isArray(engager.experience) ? engager.experience : []
  const educations = Array.isArray(engager.educations) ? engager.educations : []
  const skills = Array.isArray(engager.skills) ? engager.skills : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <a
          href={engager.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          View LinkedIn Profile
        </a>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-3xl font-bold">
              {engager.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div>
                <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">
                  {engager.full_name || engager.first_name || 'Unknown'}
                </h1>
                <p className="mt-2 text-lg text-navy-600 dark:text-navy-300">
                  {engager.headline || 'No headline'}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                {engager.location && (
                  <div className="flex items-center gap-2 text-navy-600 dark:text-navy-400">
                    <MapPin className="h-4 w-4" />
                    {engager.location}
                  </div>
                )}
                {engager.connections && (
                  <div className="flex items-center gap-2 text-navy-600 dark:text-navy-400">
                    <Users className="h-4 w-4" />
                    {engager.connections.toLocaleString()} connections
                  </div>
                )}
                {engager.followers && (
                  <div className="flex items-center gap-2 text-navy-600 dark:text-navy-400">
                    <TrendingUp className="h-4 w-4" />
                    {engager.followers.toLocaleString()} followers
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {engager.company_name && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Company</p>
                <p className="text-base text-navy-900 dark:text-navy-50">{engager.company_name}</p>
              </div>
            )}
            {engager.company_industry && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Industry</p>
                <p className="text-base text-navy-900 dark:text-navy-50">{engager.company_industry}</p>
              </div>
            )}
            {engager.company_size && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Company Size</p>
                <p className="text-base text-navy-900 dark:text-navy-50">{engager.company_size} employees</p>
              </div>
            )}
            {engager.company_website && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Website</p>
                <a
                  href={engager.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {engager.company_website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Engagement Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {engager.parent_profile && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Engaged With</p>
                <a
                  href={engager.parent_profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View Profile
                </a>
              </div>
            )}
            {engager.created_at && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">First Engagement</p>
                <p className="text-base text-navy-900 dark:text-navy-50">{formatDate(engager.created_at)}</p>
              </div>
            )}
            {engager.last_enriched_at && (
              <div>
                <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Last Updated</p>
                <p className="text-base text-navy-900 dark:text-navy-50">{formatDate(engager.last_enriched_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* About */}
      {engager.about && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-navy-700 dark:text-navy-300 whitespace-pre-wrap">
              {engager.about}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experiences.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-primary-600 pl-4">
                  <h3 className="font-semibold text-navy-900 dark:text-navy-50">
                    {exp.title || exp.position}
                  </h3>
                  <p className="text-navy-600 dark:text-navy-400">
                    {exp.company_name || exp.company}
                  </p>
                  {exp.duration && (
                    <p className="text-sm text-navy-500 dark:text-navy-500">
                      {exp.duration}
                    </p>
                  )}
                  {exp.description && (
                    <p className="mt-2 text-sm text-navy-700 dark:text-navy-300">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {educations.map((edu: any, index: number) => (
                <div key={index} className="border-l-2 border-purple-600 pl-4">
                  <h3 className="font-semibold text-navy-900 dark:text-navy-50">
                    {edu.school || edu.school_name}
                  </h3>
                  {edu.degree && (
                    <p className="text-navy-600 dark:text-navy-400">{edu.degree}</p>
                  )}
                  {edu.field_of_study && (
                    <p className="text-sm text-navy-500 dark:text-navy-500">
                      {edu.field_of_study}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 30).map((skill: any, index: number) => {
                const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill
                return (
                  <Badge key={index} variant="secondary">
                    {skillName}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
