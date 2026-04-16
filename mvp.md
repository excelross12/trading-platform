# Complete Zero-Cost Node.js Forex Trading Bot MVP Blueprint (Vercel Hosting)

## Executive Summary
Full personal forex bot platform as Next.js webapp with MT5 integration—**100% free setup/testing** on unlimited demos. [web:22][web:31][web:34][web:36] Vercel free tier hosts global dashboard; EMA/RSI trend algorithm drives auto-trading. Deploy in 1 day, 24/7 via crons. Targets Sharpe >1 in backtests. No codes, pure blueprint. Scale to live later (user-funded). [web:1]

## MVP Scope
- Trade 3-5 majors (EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD).
- Features: Auto-signals, dashboard monitoring, backtesting, risk mgmt.
- Constraints: Demo-only; serverless + optional free VPS for MT5.

## Free Stack & Prereqs (0 Cost)
| Component | Tool/Source | Notes |
|-----------|-------------|-------|
| Runtime | Node.js 20+ | nodejs.org |
| Broker | MT5 Demo (FBS/XM/HFM) | Unlimited virtual $ |
| Bridge | MTsocketAPI EA/DLL | mtsocketapi.com (free) |
| Data | TraderMade API/CSV | Free key, 1000 req/day |
| Hosting | Vercel Hobby | Unlimited deploys, 100GB BW |
| DB | Vercel Postgres/KV | 512MB free |
| VPS Opt. | Oracle Always Free | ARM VM for MT5 proxy |

**Setup**: Install local MT5+EA → GitHub repo → Vercel connect.

## Architecture Diagram (Text)
Browser (Global) ↔ Vercel (Next.js UI + API/Cron)
↓ Env Vars/Webhooks
TraderMade Free API ← Quotes/Data
↓ Socket Proxy
Local/Oracle VPS MT5 ← Orders/Executions
↓ Persist
Vercel Postgres ← Trades/Logs/Metrics

- **Flow**: Cron polls quotes → Strategy signals → Proxy to MT5 → Log results → Real-time dashboard.

## Core Trading Algorithm
- **Strategy**: EMA(8/21) crossover + RSI(14, >50 buy/<50 sell) + ADX(14)>25 trend filter. [web:1]
- **Risk Rules**:
  | Rule | Param |
  |------|--------|
  | Position Size | 1% equity |
  | Stop Loss | 1.5x ATR(14) |
  | Take Profit | 2x ATR(14) |
  | Max Open | 1 per pair |
  | Daily DD | Halt at 5% |
- Outputs: {action: 'buy/sell/hold', sl_offset, tp_offset, size}.

## MVP Components Breakdown
### 1. Frontend Dashboard (Next.js Pages)
- **Home**: Live equity curve (Chart.js), current positions, PnL summary.
- **Trades**: Paginated log table (action, entry, PnL, time).
- **Backtest**: CSV upload, run sim, metrics table (Sharpe, Win%, MaxDD).
- **Settings**: Edit pairs/risk/timezone; start/stop toggle.
- Real-time: Socket.io pushes trades/alerts.

### 2. API Routes (/api/*)
- `quotes/[pair]`: Fetch live OHLCV (TraderMade/MT5).
- `signals`: Run algo on data → JSON signal.
- `execute`: Webhook to MT5 proxy (order_send).
- `backtest`: POST CSV → Simulated trades/metrics.
- `trades`: GET/POST to Postgres.
- `cron/trade`: 5min schedule: poll → signal → execute → log.

### 3. Lib Modules
- `strategy.ts`: Algo core + indicators (technicalindicators lib).
- `mt5-proxy.ts`: Socket client to localhost:77.
- `backtester.ts`: Event-driven sim (slippage 1pip, comm 2pips).
- `db.ts`: Postgres queries (trades insert/select).

### 4. Config & State
- `config.json`: Pairs array, risk_pct, sessions (London/NY).
- Env: Vercel dashboard (keys, DB URL).

## File Structure (Vercel Deploy)



## Implementation & Deploy Plan
1. **Init (1hr)**: `npx create-next-app@latest --ts` → Add deps.
2. **Core Logic (4hr)**: Strategy → API → DB.
3. **UI (3hr)**: Pages + charts.
4. **Integrate (2hr)**: TraderMade → MT5 proxy test.
5. **Test (2hr)**: Backtest CSV → Local demo trades.
6. **Deploy (30min)**:
   - Git push → Vercel import.
   - Env vars set.
   - Custom domain (free Vercel subdomain).
7. **Prod Harden (1hr)**: Oracle VPS proxy + ngrok tunnel if needed.

**Total Timeline**: 13-15 hours solo.

## Testing Matrix
| Test Type | Scope | Success Criteria |
|-----------|-------|------------------|
| Unit | Strategy func | 100 test cases pass |
| Backtest | 5yrs data | Sharpe>1, 1000+ trades |
| Integration | End-to-end | 50 demo trades, no errors |
| Load | 5min cron | <5s latency |
| Uptime | Vercel | 99% via analytics |

## Monitoring & Ops
- Vercel Dashboard: Logs, analytics, crons.
- Alerts: Slack/Discord webhook on DD>3%.
- Backup: Postgres snapshots to GitHub.

## Risks & Mitigation
- Free Limits: Monitor TraderMade quota; fallback CSV.
- Socket Drops: Retry logic + VPS redundancy.
- Demo Bias: Paper trade 1mo before live.
- Maint: Bi-weekly metric reviews.

## Path to Production
1. MVP validated on demo.
2. Fund broker ($100-500).
3. Vercel Pro + qualified free VPS (e.g., deposit bonus).

**Launch Command**: GitHub → Vercel → Live dashboard URL. Zero cost, full MVP ready.