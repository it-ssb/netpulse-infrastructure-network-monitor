# NetPulse persistence

ADR-002 selects **local SQLite on Node.js 24+**, resolving ADR-001's SQLite/PostgreSQL alternative. Run one API service per database on local disk. Startup opens the configured file, enables foreign keys, WAL and FULL synchronous commits, and applies versioned migrations before listening. Database errors never switch to memory. The in-memory database used to validate restores is isolated and cannot serve application requests.

## Deployment

```sh
npm ci
# Create this directory with ownership restricted to the service account first.
export NETPULSE_DB=/var/lib/netpulse/netpulse.sqlite
export NETPULSE_ADMIN_PASSWORD='a-long-unique-bootstrap-password'
npm start
```

The bootstrap password creates an administrator only when no users exist. Remove the environment variable afterward. There is no default password or inventory seed. Node listens on 127.0.0.1:8787; configure HOST/PORT deliberately for your deployment. Keep the database, WAL and backups accessible only to the service account. Cloudflare/Wrangler deployment is superseded by this local runtime.

`npm test` runs isolated file-backed SQLite integration tests; `npm run build` type-checks the API.

## Data contract

- All timestamps, including legacy names `created_at`, `last_seen`, `timestamp` and `expires_at`, are UTC Unix **milliseconds**. Poll intervals and aggregate bucket/resolution fields also use milliseconds.
- Devices use UUID IDs and `(site_id, ip)` identity. Interfaces use stable IDs and `(node_id, port_number)` identity; ifIndex changes must be reconciled by collectors rather than blindly reassigned. Collector names and credential names are unique within a site. Foreign keys prevent cross-site credential/collector assignment and dangling inventory links.
- `nodes`, `switch_ports`, camera configuration, monitor definitions, sites, collectors, rules and settings contain configuration/current state. Measurement history, transitions and aggregate tables contain telemetry. Existing API names map devices to `nodes`, interfaces to `switch_ports`, incidents to `alerts`, and audit events to `audit_logs`.
- `observed_at` is the collector's observation time; `received_at` is assigned by the API when ingesting. Quality is `good`, `stale`, `error` or `unknown`; unsuccessful samples have null values, never invented zeroes. Source is the bounded protocol enum `icmp`, `snmp`, `agent`, `manual`; the monitor supplies collector identity, units and counter/gauge semantics on history reads.
- Gauges are finite numeric point samples. Counters are unsigned 64-bit cumulative integers encoded as decimal strings to preserve precision. A decreasing counter indicates reset/wrap; consumers must invalidate that delta and must not average cumulative counters. Counter rate derivation is not implemented. Units and semantics cannot change once a monitor has history; create a new identity.
- Ingestion accepts observations from the last seven days with up to five minutes of future clock skew. History uses an indexed monitor/time range, exclusive `to`, descending ordering and a maximum 1,000 rows. Use the earliest returned observation as the next `to` (equal-time observations require a narrower collector query if more than 1,000 share the same timestamp).
- Labels are deliberately not free-form JSON. Twelve registered metric names, nine units, four sources and four quality values are allowed. Each device/interface has at most one monitor per metric. Interfaces are capped at 4,096 per device. Hostnames, IPs, messages, user IDs and request IDs must never become metric names or labels. New metric names require a reviewed schema migration.

## Retention and capacity

Hourly maintenance builds idempotent gauge count/sum/min/max rollups at one-minute and one-hour resolutions. Raw samples (including exact counters) remain for seven days, with up to one extra hour for complete bucket retention; minute rollups remain 30 days and hourly rollups 365 days. Counters currently have **raw-only retention**; derived rates must be introduced before claiming long-term traffic reporting. Transitions, audit events and resolved incidents expire after 365 days; active incidents remain. Expired sessions are removed. Incident deletion cascades to notifications.

At 250 devices with just one 15-second monitor, raw history is roughly 10 million rows/week; interface metrics multiply that substantially. SQLite has no native partitioning. Gauge rollups and indexed pruning are implemented; partitioning is deferred until measured ingest/query/disk costs justify PostgreSQL. Current synchronous aggregation scans retained raw data and blocks the API while running: benchmark actual monitor/interface cardinality before production rollout. Backup JSON is also memory-bound; RTO/RPO targets have not been established by load or recovery testing.

## Secrets and backup/restore

Ordinary device DTOs contain only `credential_id`. `credential_references` holds metadata; `encrypted_secrets` holds AES-256-GCM ciphertext, nonce, authentication tag and external key identifier. Store methods require a 32-byte key supplied by the caller; keys are never stored in the database or snapshots. AAD binds ciphertext to credential identity. The operator must escrow external keys separately. Passwords use salted scrypt hashes. Backup endpoints require an authenticated administrator even if general authentication is disabled.

`GET /api/system/export` returns a versioned consistent snapshot of **every application table**, including telemetry, rollups, configuration, users, sessions, encrypted secrets, discovery, incidents, notifications and audit events. This is a privileged recovery artifact containing password hashes and bearer sessions; it is not an ordinary DTO. Protect it accordingly. `POST /api/system/import` accepts exactly that format. All tables/columns/types/checks/foreign keys and singleton settings are validated in an isolated staging database before live data changes. Live replacement uses one transaction and rolls back on failure. Do not use partial snapshots as replacement backups.

Migrations reside in `migrations/`, with `PRAGMA user_version` recording the committed version. Empty inventory remains empty across restart. Unknown versions and pre-versioned prototype databases fail closed. Legacy Worker snapshots are incomplete (notably users, sessions and credentials) and are intentionally rejected; this release does not automatically convert them. Preserve the original store and explicitly convert/reconcile it before cutover. Restore requires the matching external encryption keys to recover secret plaintext.
