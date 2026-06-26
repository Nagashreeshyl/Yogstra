import { Link } from 'react-router-dom'
import { GraduationCap, BookOpen } from 'lucide-react'

export function RoleSelectionPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 bg-cream">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl font-semibold mb-2">Welcome to Yogstra</h1>
          <p className="text-charcoal/60">Tell us who you are</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/auth/student"
            className="flex flex-col items-center p-10 border border-border rounded-sm hover:border-teal hover:bg-teal-soft/30 transition-colors"
          >
            <GraduationCap size={44} className="text-teal mb-4" strokeWidth={1.5} />
            <h2 className="font-heading text-xl font-medium mb-2">I am a Student</h2>
            <p className="text-sm text-charcoal/60 text-center">
              Find teachers and track your yoga journey
            </p>
          </Link>

          <Link
            to="/auth/teacher"
            className="flex flex-col items-center p-10 border border-border rounded-sm hover:border-teal hover:bg-teal-soft/30 transition-colors"
          >
            <BookOpen size={44} className="text-teal mb-4" strokeWidth={1.5} />
            <h2 className="font-heading text-xl font-medium mb-2">I am a Teacher</h2>
            <p className="text-sm text-charcoal/60 text-center">
              Share your expertise and grow your students
            </p>
          </Link>
        </div>

        <Link to="/" className="block text-center text-sm text-charcoal/50 hover:text-charcoal mt-8">
          ← Back to Yogstra
        </Link>
      </div>
    </div>
  )
}
