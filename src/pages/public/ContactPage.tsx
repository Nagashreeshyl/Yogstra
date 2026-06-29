import { Mail, MapPin, MessageSquare } from 'lucide-react'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'

export function ContactPage() {
  return (
    <PageContainer width="wide" className="py-10 sm:py-14">
      <PageHeader
        title="Contact"
        description="Questions about academies, competitions, or enterprise plans? We're here to help."
        className="mb-12"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <form
          className="rounded-[20px] border border-border bg-elevated p-6 sm:p-8 space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input label="Name" required />
          <Input label="Email" type="email" required />
          <Input label="Subject" required />
          <Textarea label="Message" rows={5} required />
          <Button type="submit" className="w-full">
            Send message
          </Button>
        </form>

        <div className="space-y-6">
          {[
            { icon: Mail, title: 'Email', text: 'hello@yogstra.com' },
            { icon: MessageSquare, title: 'Support', text: 'support@yogstra.com — Help Center responses within 24h' },
            { icon: MapPin, title: 'Office', text: 'Bengaluru, India' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[16px] border border-border bg-elevated p-5 flex gap-4">
              <Icon size={22} className="text-accent shrink-0" />
              <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
