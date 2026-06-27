export function AdminSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Settings</h1>
      <div className="max-w-lg border border-border rounded-sm p-6 space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Platform Name</p>
          <p className="text-charcoal/70">Yogstra</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Support Email</p>
          <p className="text-charcoal/70">support@yogstra.com</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Verification SLA</p>
          <p className="text-charcoal/70">12–24 hours</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Default Currency</p>
          <p className="text-charcoal/70">INR (₹)</p>
        </div>
      </div>
    </div>
  )
}
