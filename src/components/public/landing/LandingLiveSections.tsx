import { Link } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  Calendar,
  MapPin,
  Trophy,
  Users,
} from 'lucide-react'
import type { LandingPageData } from '../../../services/landingService'
import { PublicSection } from '../PublicSection'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/Badge'
import { Avatar } from '../../ui/Avatar'
import { EmptyState } from '../../shell/EmptyState'
import { TERMS } from '../../../constants/terminology'
import { TeacherCard } from '../../teachers/TeacherCard'

type LandingLiveSectionsProps = {
  data: LandingPageData
}

function formatCompetitionDate(date: string | null) {
  if (!date) return 'Dates TBA'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDeadline(date: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function LandingLiveSections({ data }: LandingLiveSectionsProps) {
  const { coaches, academies, competitions, communityPosts } = data

  return (
    <>
      {/* Featured Coaches */}
      <PublicSection title="Featured Coaches" description="Verified coaches ready to guide your journey.">
        {coaches.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="Verified coaches will appear here as they join Yogstra."
            action={
              <Link to="/auth/teacher/register">
                <Button>Apply as Coach</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach) => (
                <TeacherCard key={coach.id} teacher={coach.teacher} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/teachers">
                <Button variant="secondary">Discover Coaches</Button>
              </Link>
            </div>
          </>
        )}
      </PublicSection>

      {/* Featured Academies */}
      <PublicSection title="Featured Academies" description="Professional institutions on Yogstra." className="bg-muted/30">
        {academies.length === 0 ? (
          <EmptyState
            icon={<Building2 size={24} />}
            title="No academies have been verified yet."
            action={
              <Link to="/auth/teacher/register">
                <Button>{TERMS.createAcademy}</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {academies.map((academy) => (
                <Link
                  key={academy.id}
                  to={`/academies/${academy.slug}`}
                  className="rounded-[20px] border border-border bg-elevated p-6 transition-all hover:border-accent/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {academy.logoUrl ? (
                      <img src={academy.logoUrl} alt="" className="h-12 w-12 rounded-[12px] object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-[12px] bg-accent/10 flex items-center justify-center">
                        <Building2 size={22} className="text-accent" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-semibold text-foreground">{academy.name}</p>
                      {(academy.city || academy.state) && (
                        <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
                          <MapPin size={13} />
                          {[academy.city, academy.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-[12px] bg-muted/50 px-2 py-2">
                      <p className="font-semibold text-foreground">{academy.programCount}</p>
                      <p className="text-muted-foreground">Programs</p>
                    </div>
                    <div className="rounded-[12px] bg-muted/50 px-2 py-2">
                      <p className="font-semibold text-foreground">{academy.teacherCount}</p>
                      <p className="text-muted-foreground">Teachers</p>
                    </div>
                    <div className="rounded-[12px] bg-muted/50 px-2 py-2">
                      <p className="font-semibold text-foreground">{academy.studentCount}</p>
                      <p className="text-muted-foreground">Students</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/academies">
                <Button variant="secondary">Browse Academies</Button>
              </Link>
            </div>
          </>
        )}
      </PublicSection>

      {/* Upcoming Competitions */}
      <PublicSection title="Upcoming Competitions" description="Register, prepare, and compete.">
        {competitions.length === 0 ? (
          <EmptyState
            icon={<Trophy size={24} />}
            title="No competitions are open for registration."
            action={
              <Link to="/competitions">
                <Button variant="secondary">View Competitions</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {competitions.map((competition) => (
                <article
                  key={competition.id}
                  className="rounded-[20px] border border-border bg-elevated overflow-hidden flex flex-col sm:flex-row"
                >
                  <div className="relative sm:w-40 shrink-0 h-32 sm:h-auto bg-gradient-to-br from-primary/90 to-primary">
                    {competition.bannerUrl ? (
                      <img src={competition.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Trophy size={32} className="text-primary-foreground/80" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {competition.registrationOpen && (
                        <Badge variant="primary" className="text-xs">Registration Open</Badge>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-foreground">{competition.name}</h3>
                    {competition.organizerName && (
                      <p className="text-xs text-muted-foreground mt-1">Organized by {competition.organizerName}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={13} />
                        {formatCompetitionDate(competition.startDate)}
                      </span>
                      {(competition.city || competition.state) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} />
                          {[competition.city, competition.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    {competition.registrationDeadline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Register by {formatDeadline(competition.registrationDeadline)}
                      </p>
                    )}
                    {competition.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {competition.categories.slice(0, 3).map((cat) => (
                          <Badge key={cat.id} variant="default" className="text-xs">{cat.name}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto pt-4 flex gap-2">
                      <Link to={`/competitions/${competition.slug}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full">View Details</Button>
                      </Link>
                      {competition.registrationOpen && (
                        <Link to={`/competitions/${competition.slug}`} className="flex-1">
                          <Button size="sm" className="w-full">Register</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/competitions">
                <Button variant="secondary">View All Competitions</Button>
              </Link>
            </div>
          </>
        )}
      </PublicSection>

      {/* Community */}
      <PublicSection title="Community" description="Share progress, celebrate achievements, stay connected." className="bg-muted/30" centered>
        {communityPosts.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={24} />}
            title="The community is waiting for its first story."
            action={
              <Link to="/auth/get-started">
                <Button>Join Community</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto mb-8">
              {communityPosts.map((post) => (
                <div key={post.id} className="rounded-[12px] overflow-hidden bg-elevated border border-border aspect-square">
                  {post.image ? (
                    <img src={post.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : post.video ? (
                    <video src={post.video} className="w-full h-full object-cover" muted />
                  ) : (
                    <div className="w-full h-full p-3 flex flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar src={post.studentAvatar} name={post.studentName} size={24} />
                        <span className="text-xs font-medium truncate">{post.studentName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-4 text-left">{post.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Link to="/community">
              <Button variant="secondary">Join Community</Button>
            </Link>
          </>
        )}
      </PublicSection>
    </>
  )
}
