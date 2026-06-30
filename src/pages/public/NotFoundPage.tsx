import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="public-site min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover"
      >
        Back to home
      </Link>
    </div>
  )
}
