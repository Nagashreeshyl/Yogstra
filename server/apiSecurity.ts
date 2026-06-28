type VercelRequest = {
  method?: string
  headers?: Record<string, string | string[] | undefined>
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  send: (body: string) => void
  setHeader: (name: string, value: string) => void
}

const PRODUCTION_ORIGINS = new Set(['https://yogstra.vercel.app'])

const DEV_ORIGINS = new Set(['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'])

function isProduction() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

function allowedOrigins(): Set<string> {
  if (!isProduction()) {
    return new Set([...PRODUCTION_ORIGINS, ...DEV_ORIGINS])
  }
  return PRODUCTION_ORIGINS
}

export function extractBearerToken(req: VercelRequest) {
  const header = req.headers?.authorization ?? req.headers?.Authorization
  const value = Array.isArray(header) ? header[0] : header
  return value?.startsWith('Bearer ') ? value.slice(7) : undefined
}

export function clientIp(req: VercelRequest) {
  const forwarded = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0]?.trim() || 'unknown'
}

export function applySecurityHeaders(res: VercelResponse, origin?: string) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (origin && allowedOrigins().has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
}

export function isAllowedOrigin(req: VercelRequest) {
  const originHeader = req.headers?.origin
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader
  if (!origin) return true
  return allowedOrigins().has(origin)
}

export function handleApiPreflight(
  req: VercelRequest,
  res: VercelResponse,
  options?: { skipOriginCheck?: boolean },
): 'continue' | 'done' {
  const originHeader = req.headers?.origin
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader

  applySecurityHeaders(res, origin)

  if (req.method === 'OPTIONS') {
    if (!options?.skipOriginCheck && origin && !isAllowedOrigin(req)) {
      res.status(403).json({ error: 'Forbidden origin.' })
      return 'done'
    }
    res.status(204).send('')
    return 'done'
  }

  if (!options?.skipOriginCheck && !isAllowedOrigin(req)) {
    res.status(403).json({ error: 'Forbidden origin.' })
    return 'done'
  }

  return 'continue'
}

type RateBucket = { count: number; resetAt: number }

const rateBuckets = new Map<string, RateBucket>()

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = rateBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) {
    return false
  }

  bucket.count += 1
  return true
}

export function enforceRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  route: string,
  limit: number,
  windowMs: number,
): boolean {
  const key = `${route}:${clientIp(req)}`
  if (checkRateLimit(key, limit, windowMs)) return true
  res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
  return false
}
