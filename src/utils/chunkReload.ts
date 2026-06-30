const RELOAD_KEY = 'yogstra:chunk-reload-at'
const RELOAD_COOLDOWN_MS = 8_000

export const STALE_CHUNK_PATTERN =
  /failed to fetch dynamically imported module|loading chunk \d+ failed|importing a module script failed|expected a javascript-or-wasm module script|mime type of "text\/html"|mime type \('text\/plain'\)|refused to apply style|net::err_aborted|404.*\/assets\//i

export function isStaleChunkError(reason: unknown): boolean {
  if (reason instanceof Error && STALE_CHUNK_PATTERN.test(reason.message)) return true
  const msg = typeof reason === 'string' ? reason : String(reason ?? '')
  return STALE_CHUNK_PATTERN.test(msg)
}

export function isStaleAssetScript(event: ErrorEvent): boolean {
  if (event.filename?.includes('/assets/')) return true
  const target = event.target
  if (target instanceof HTMLLinkElement && target.href.includes('/assets/')) return true
  if (target instanceof HTMLScriptElement && target.src.includes('/assets/')) return true
  return false
}

async function purgeClientCaches(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

function navigateWithCacheBust(): void {
  const url = new URL(window.location.href)
  url.searchParams.set('_refresh', String(Date.now()))
  window.location.replace(url.toString())
}

/** Hard-reload once when a post-deploy chunk mismatch is detected. */
export function reloadOnceForStaleChunk(): boolean {
  const lastReload = sessionStorage.getItem(RELOAD_KEY)
  if (lastReload && Date.now() - Number(lastReload) < RELOAD_COOLDOWN_MS) return false
  sessionStorage.setItem(RELOAD_KEY, String(Date.now()))

  void purgeClientCaches().finally(navigateWithCacheBust)
  return true
}

export function clearStaleChunkReloadFlag(): void {
  sessionStorage.removeItem(RELOAD_KEY)
}

export async function purgeServiceWorkersOnLoad(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}
