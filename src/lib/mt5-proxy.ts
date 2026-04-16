// ── MT5 Socket Proxy — connects to MTsocketAPI EA on localhost:77 ─────────
// ✦ Auto-retry with exponential backoff on disconnect
// ⚠️ This runs server-side only (API routes / cron)

import * as net from 'net'
import type { MT5Order, MT5Response } from '@/types'

const HOST = process.env.MT5_PROXY_HOST ?? 'localhost'
const PORT = parseInt(process.env.MT5_PROXY_PORT ?? '77', 10)

const MAX_RETRIES   = 3
const RETRY_BASE_MS = 500
const TIMEOUT_MS    = 8000

// ── Low-level socket send/recv ────────────────────────────────────────────

function sendCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    let response = ''
    let settled  = false

    const done = (err?: Error) => {
      if (settled) return
      settled = true
      socket.destroy()
      if (err) reject(err)
      else resolve(response.trim())
    }

    socket.setTimeout(TIMEOUT_MS)
    socket.connect(PORT, HOST, () => {
      socket.write(command + '\n')
    })
    socket.on('data',    (d) => { response += d.toString() })
    socket.on('end',     () => done())
    socket.on('error',   (e) => done(e))
    socket.on('timeout', () => done(new Error('MT5 proxy timeout')))
  })
}

// ── Retry wrapper ─────────────────────────────────────────────────────────

async function sendWithRetry(command: string, attempt = 1): Promise<string> {
  try {
    return await sendCommand(command)
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err
    const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1)
    await new Promise((r) => setTimeout(r, delay))
    return sendWithRetry(command, attempt + 1)
  }
}

// ── MT5 command builders ──────────────────────────────────────────────────

export async function placeOrder(order: MT5Order): Promise<MT5Response> {
  const cmd = `ORDER_SEND|${order.symbol}|${order.action.toUpperCase()}|${order.volume}|${order.sl}|${order.tp}`
  try {
    const raw = await sendWithRetry(cmd)
    // ✦ MTsocketAPI response: "OK|ticket_id" or "ERR|message"
    if (raw.startsWith('OK|')) {
      return { ok: true, ticket_id: raw.split('|')[1] }
    }
    return { ok: false, error: raw.replace('ERR|', '') }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function closeOrder(ticket: number): Promise<MT5Response> {
  const cmd = `ORDER_CLOSE|${ticket}`
  try {
    const raw = await sendWithRetry(cmd)
    if (raw.startsWith('OK')) return { ok: true }
    return { ok: false, error: raw.replace('ERR|', '') }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function getAccountInfo(): Promise<{
  equity: number
  balance: number
  margin: number
} | null> {
  try {
    const raw = await sendWithRetry('ACCOUNT_INFO')
    // Expected: "equity|balance|margin"
    const parts = raw.split('|').map(Number)
    if (parts.length < 3 || parts.some(isNaN)) return null
    return { equity: parts[0], balance: parts[1], margin: parts[2] }
  } catch {
    return null
  }
}

export async function isConnected(): Promise<boolean> {
  try {
    const raw = await sendCommand('PING')
    return raw === 'PONG'
  } catch {
    return false
  }
}
