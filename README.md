# NetPulse

On-premises infrastructure monitoring API and UI. Persistent storage uses local SQLite on Node.js 24+. Real collector, discovery and diagnostic integrations are still incomplete; unsupported operations return 501.

```sh
npm ci
# Configure NETPULSE_DB and NETPULSE_ADMIN_PASSWORD before first startup.
npm start
```

Default address: http://127.0.0.1:8787. The default database is `./netpulse.sqlite`; production should set `NETPULSE_DB=/var/lib/netpulse/netpulse.sqlite` with a pre-created, restricted directory. There is no memory fallback or demo reseeding.

See [persistence and deployment](docs/PERSISTENCE.md) for the schema contract, bootstrap, retention, secrets, backup/restore and migration limitations. [Architecture](docs/ARCHITECTURE.md) records the broader deployment plan.

```sh
npm test
npm run build
```
