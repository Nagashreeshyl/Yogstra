import { Link } from 'react-router-dom'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { GraduationCap, BookOpen } from 'lucide-react'

export function RoleSelectionPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background">
      <PageContainer width="default" className="!py-8">
        <PageHeader
          title="Welcome to Yogstra"
          description="Tell us who you are"
          className="justify-center text-center mb-10 [&_h1]:text-center [&_p]:mx-auto"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/auth/student"
            className="flex flex-col items-center p-10 rounded-[16px] border border-border hover:border-primary hover:bg-primary/10/30 transition-colors"
          >
            <GraduationCap size={44} className="text-primary mb-4" strokeWidth={1.5} />
            <h2 className="font-heading text-xl font-medium mb-2">I am a Student</h2>
            <p className="text-sm text-muted-foreground text-center">
              Find teachers and track your yoga journey
            </p>
          </Link>

          <Link
            to="/auth/teacher"
            className="flex flex-col items-center p-10 rounded-[16px] border border-border hover:border-primary hover:bg-primary/10/30 transition-colors"
          >
            <BookOpen size={44} className="text-primary mb-4" strokeWidth={1.5} />
            <h2 className="font-heading text-xl font-medium mb-2">I am a Teacher</h2>
            <p className="text-sm text-muted-foreground text-center">
              Share your expertise and grow your students
            </p>
          </Link>
        </div>

        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-8">
          ← Back to Yogstra
        </Link>
      </PageContainer>
    </div>
  )
}
