import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Modal } from '../ui/Modal'

export function RoleSelectionModal() {
  const { showRoleModal, setShowRoleModal } = useApp()
  const navigate = useNavigate()

  const selectRole = (role: 'student' | 'teacher') => {
    setShowRoleModal(false)
    if (role === 'student') {
      navigate('/auth/student')
    } else {
      navigate('/auth/teacher')
    }
  }

  return (
    <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} className="max-w-2xl">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl font-medium mb-2">Welcome to Yogstra</h2>
        <p className="text-charcoal/60">Tell us who you are</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => selectRole('student')}
          className="flex flex-col items-center p-8 border border-border rounded-sm hover:border-teal hover:bg-teal-soft/30 transition-colors cursor-pointer text-left"
        >
          <GraduationCap size={40} className="text-teal mb-4" strokeWidth={1.5} />
          <h3 className="font-heading text-lg font-medium mb-2">I am a Student</h3>
          <p className="text-sm text-charcoal/60 text-center">
            Find teachers and track your yoga journey
          </p>
        </button>

        <button
          onClick={() => selectRole('teacher')}
          className="flex flex-col items-center p-8 border border-border rounded-sm hover:border-teal hover:bg-teal-soft/30 transition-colors cursor-pointer text-left"
        >
          <BookOpen size={40} className="text-teal mb-4" strokeWidth={1.5} />
          <h3 className="font-heading text-lg font-medium mb-2">I am a Teacher</h3>
          <p className="text-sm text-charcoal/60 text-center">
            Share your expertise and grow your students
          </p>
        </button>
      </div>
    </Modal>
  )
}
