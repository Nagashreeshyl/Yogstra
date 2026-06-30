import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AppErrorBoundary } from './components/error/AppErrorBoundary'
import { logActivity } from './services/activityLog'
import {
  isStaleAssetScript,
  isStaleChunkError,
  reloadOnceForStaleChunk,
} from './utils/chunkReload'

window.addEventListener('unhandledrejection', (event) => {
  if (isStaleChunkError(event.reason) && reloadOnceForStaleChunk()) {
    event.preventDefault()
    return
  }
  void logActivity({
    action: 'error',
    status: 'error',
    errorMessage: event.reason instanceof Error ? event.reason.message : String(event.reason),
    metadata: { type: 'unhandledrejection' },
  })
})

window.addEventListener('error', (event) => {
  if (
    (isStaleAssetScript(event) || isStaleChunkError(event.message)) &&
    reloadOnceForStaleChunk()
  ) {
    event.preventDefault()
    return
  }
  void logActivity({
    action: 'error',
    status: 'error',
    errorMessage: event.message,
    metadata: { type: 'window.error', filename: event.filename },
  })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
