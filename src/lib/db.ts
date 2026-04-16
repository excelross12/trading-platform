// ── Vercel Postgres — parameterized queries only ──────────────────────────
// ⚠️ SECURITY: Never interpolate user input into SQL. Use $1/$2 params only.

import { sql } from '@vercel/postgres'
import type { Trade, NewTrade, EquitySnapshot } from '@/types'

// ── Schema migration (run once at startup) ────────────────────────────────

export async function runMigrations(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id          SERIAL PRIMARY KEY,
      pair        VARCHAR(10)    NOT NULL,
      action      VARCHAR(4)     NOT NULL CHECK (action IN ('buy','sell')),
      entry_price DECIMAL(18,5)  NOT NULL,
      exit_price  DECIMAL(18,5),
      sl_price    DECIMAL(18,5)  NOT NULL,
      tp_price    DECIMAL(18,5)  NOT NULL,
      lot_size    DECIMAL(10,4)  NOT NULL,
      pnl         DECIMAL(12,4),
      status      VARCHAR(10)    NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','closed','cancelled')),
      opened_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
      closed_at   TIMESTAMPTZ,
      ticket_id   VARCHAR(50),
      notes       TEXT
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_trades_pair      ON trades(pair)
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_trades_opened_at ON trades(opened_at DESC)
  `
  await sql`
    CREATE TABLE IF NOT EXISTS equity_snapshots (
      id          SERIAL PRIMARY KEY,
      equity      DECIMAL(14,2) NOT NULL,
      balance     DECIMAL(14,2) NOT NULL,
      margin      DECIMAL(14,2),
      snapshot_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS idx_equity_snapshots_at
      ON equity_snapshots(snapshot_at DESC)
  `
}

// ── Trades ────────────────────────────────────────────────────────────────

export async function insertTrade(t: NewTrade): Promise<Trade> {
  const { rows } = await sql<Trade>`
    INSERT INTO trades
      (pair, action, entry_price, exit_price, sl_price, tp_price, lot_size, pnl, status, closed_at, ticket_id, notes)
    VALUES
      (${t.pair}, ${t.action}, ${t.entry_price}, ${t.exit_price ?? null},
       ${t.sl_price}, ${t.tp_price}, ${t.lot_size}, ${t.pnl ?? null},
       ${t.status ?? 'open'}, ${t.closed_at ?? null}, ${t.ticket_id ?? null}, ${t.notes ?? null})
    RETURNING *
  `
  return rows[0]
}

export async function getTrades({
  pair,
  status,
  limit = 50,
  offset = 0,
}: {
  pair?:   string
  status?: string
  limit?:  number
  offset?: number
}): Promise<{ trades: Trade[]; total: number }> {
  // ✦ Dynamic filter — still parameterized via conditional SQL
  const { rows: trades } = pair && status
    ? await sql<Trade>`SELECT * FROM trades WHERE pair=${pair} AND status=${status} ORDER BY opened_at DESC LIMIT ${limit} OFFSET ${offset}`
    : pair
    ? await sql<Trade>`SELECT * FROM trades WHERE pair=${pair} ORDER BY opened_at DESC LIMIT ${limit} OFFSET ${offset}`
    : status
    ? await sql<Trade>`SELECT * FROM trades WHERE status=${status} ORDER BY opened_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql<Trade>`SELECT * FROM trades ORDER BY opened_at DESC LIMIT ${limit} OFFSET ${offset}`

  const { rows: countRows } = pair
    ? await sql<{ count: string }>`SELECT COUNT(*) as count FROM trades WHERE pair=${pair}`
    : await sql<{ count: string }>`SELECT COUNT(*) as count FROM trades`

  return { trades, total: parseInt(countRows[0].count, 10) }
}

export async function updateTradeStatus(
  id: number,
  updates: Partial<Pick<Trade, 'status' | 'exit_price' | 'pnl' | 'closed_at'>>,
): Promise<Trade> {
  const { exit_price, pnl, status, closed_at } = updates
  const { rows } = await sql<Trade>`
    UPDATE trades SET
      status      = COALESCE(${status ?? null}, status),
      exit_price  = COALESCE(${exit_price ?? null}, exit_price),
      pnl         = COALESCE(${pnl ?? null}, pnl),
      closed_at   = COALESCE(${closed_at ?? null}, closed_at)
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0]
}

export async function getOpenTradesByPair(pair: string): Promise<Trade[]> {
  const { rows } = await sql<Trade>`
    SELECT * FROM trades WHERE pair=${pair} AND status='open' ORDER BY opened_at DESC
  `
  return rows
}

// ── Equity Snapshots ──────────────────────────────────────────────────────

export async function insertEquitySnapshot(
  equity: number,
  balance: number,
  margin?: number,
): Promise<EquitySnapshot> {
  const { rows } = await sql<EquitySnapshot>`
    INSERT INTO equity_snapshots (equity, balance, margin)
    VALUES (${equity}, ${balance}, ${margin ?? null})
    RETURNING *
  `
  return rows[0]
}

export async function getEquityCurve(limit = 200): Promise<EquitySnapshot[]> {
  const { rows } = await sql<EquitySnapshot>`
    SELECT * FROM equity_snapshots ORDER BY snapshot_at DESC LIMIT ${limit}
  `
  return rows.reverse() // chronological order for charting
}

export async function getLatestEquity(): Promise<EquitySnapshot | null> {
  const { rows } = await sql<EquitySnapshot>`
    SELECT * FROM equity_snapshots ORDER BY snapshot_at DESC LIMIT 1
  `
  return rows[0] ?? null
}
