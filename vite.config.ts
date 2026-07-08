import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createLiveKitToken } from './server/livekitToken.js'
import { assertAuthenticatedUser } from './server/supabaseAdmin.js'
import { assertLiveKitRoomAccess } from './server/orderValidation.js'

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? (JSON.parse(data) as Record<string, unknown>) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function livekitTokenDevMiddleware() {
  return {
    name: 'livekit-token-dev-api',
    configureServer(server: {
      middlewares: {
        use: (
          path: string,
          handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void,
        ) => void
      }
    }) {
      server.middlewares.use('/api/livekit-token', (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        void (async () => {
          try {
            const authHeader = req.headers.authorization
            const bearer =
              typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : ''
            const user = await assertAuthenticatedUser(bearer)
            const body = await readJsonBody(req)
            const roomName = String(body.roomName ?? '').trim()
            if (!roomName) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'roomName is required.' }))
              return
            }

            await assertLiveKitRoomAccess(roomName, bearer, user)

            const participantName = String(body.participantName ?? '').trim() || 'Participant'
            const result = await createLiveKitToken({
              roomName,
              participantName,
              participantId: user.userId,
            })
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not create video token.'
            const status =
              message.includes('Authentication') ||
              message.includes('Invalid session') ||
              message.includes('access to this video room')
                ? 401
                : message.includes('required')
                  ? 400
                  : 500
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: message }))
          }
        })().catch(() => {
          next()
        })
      })
    },
  }
}

function yogstraBuildVersion() {
  const buildId = Date.now().toString(36)
  return {
    name: 'yogstra-build-version',
    transformIndexHtml(html: string) {
      return html.replaceAll('%YOGSTRA_BUILD_ID%', buildId)
    },
    closeBundle() {
      writeFileSync(resolve(process.cwd(), 'dist/build-id.txt'), buildId, 'utf8')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  if (mode === 'production') {
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter(
      (key) => !env[key]?.trim(),
    )
    if (missing.length) {
      throw new Error(
        `Production build missing required env: ${missing.join(', ')}. ` +
          'Set them in Vercel project settings or .env.local before building.',
      )
    }
  }

  return {
    plugins: [react(), tailwindcss(), livekitTokenDevMiddleware(), yogstraBuildVersion()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/index-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          manualChunks(id) {
            if (id.includes('node_modules/@livekit') || id.includes('node_modules/livekit-client')) {
              return 'livekit'
            }
            if (id.includes('node_modules/@supabase')) {
              return 'supabase'
            }
            if (id.includes('node_modules/qrcode')) {
              return 'qrcode'
            }
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
