import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { logActivity } from '../../services/activityLog'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
  errorKey: number
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorKey: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void logActivity({
      action: 'error',
      status: 'error',
      errorMessage: error.message,
      metadata: { componentStack: info.componentStack?.slice(0, 500) },
    })
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, errorKey: s.errorKey + 1 }))
  }

  render() {
    if (this.state.error) {
      return (
        <div className="public-site min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">Something went wrong</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-foreground">
            We hit an unexpected error
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Your session is still active. Try again or return home. If this keeps happening, use the
            feedback button to report it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover"
            >
              Try again
            </button>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border bg-elevated px-5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Back to home
            </Link>
          </div>
        </div>
      )
    }

    return <div key={this.state.errorKey}>{this.props.children}</div>
  }
}
