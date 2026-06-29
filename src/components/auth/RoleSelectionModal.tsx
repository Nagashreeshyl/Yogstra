import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function RoleSelectionModal() {
  const { showRoleModal, setShowRoleModal } = useApp()
  const navigate = useNavigate()

  const goToJourneys = () => {
    setShowRoleModal(false)
    navigate('/auth/get-started')
  }

  const goToLogin = () => {
    setShowRoleModal(false)
    navigate('/auth/login')
  }

  return (
    <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} className="max-w-md">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl font-semibold mb-2">Join Yogstra</h2>
        <p className="text-muted-foreground text-sm">
          The operating system for yoga academies &amp; competitions
        </p>
      </div>

      <div className="space-y-3">
        <Button className="w-full" onClick={goToJourneys}>
          Get Started
        </Button>
        <Button variant="secondary" className="w-full" onClick={goToLogin}>
          Log in
        </Button>
      </div>
    </Modal>
  )
}
