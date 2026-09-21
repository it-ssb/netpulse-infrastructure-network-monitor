# NetPulse: production monitoring implementation prompt guide

Reviewed: 2026-09-21. This guide describes proposed work; it does not certify the application as production-ready.

## Current code assessment

The current application is a React dashboard with a Hono API, a Cloudflare Durable Object implementation, and an in-memory fallback. It is a useful UI prototype, but real device collection is absent.

Source references are relative to this document. Line numbers refer to the reviewed snapshot and will change during implementation.

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Measurements are generated | `src/index.ts:471` and `:1865`, `stepSimulation()` | CPU, memory, latency, last-seen, and uptime do not represent device observations. |
| Viewing the dashboard mutates metrics | `src/index.ts:732`; `public/app.jsx:263` | Collection depends on browser requests and viewer count. |
| Add-device probing is fabricated | `src/index.ts:846` | Device identification uses IP suffixes; measurements are random. |
| Diagnostic output is fabricated | `src/index.ts:1208`, `:1252`, `:1282` | Ping, port scan, and traceroute do not verify connectivity. |
| Discovery inserts predefined devices | `src/index.ts:1322` | It does not discover network inventory. |
| No configured persistent binding | `wrangler.json`; `src/index.ts:1926` | Requests use memory storage; state is not reliably durable. |
| Authentication is unsafe | `src/index.ts:4`, `:458`, `:514`, `:587`, `:696` | Default credentials, known demo token, plaintext passwords, weak session tokens, and no administrative role enforcement. |
| Monitoring data is exposed through bypass paths | Summary middleware exemption and `src/index.ts:1902` | Summary is public; the Durable Object WebSocket path bypasses API authentication. |
| Rules are stored but not evaluated | `src/index.ts:1458` | There is no autonomous threshold/notification pipeline. |
| Settings updates mishandle omitted values | `src/index.ts:1529` | Partial updates can overwrite fields or disable authentication. |
| Backup/restore is incomplete | `src/index.ts:1563`, `:1596` | SQL restore deletes several datasets but restores only nodes and ports; export omits other important tables. |
| SQL history has no retention cleanup | `src/index.ts:1865` | History grows with every summary request. |
| Frontend depends on external runtime tooling | `public/index.html` | React dependencies, Tailwind, Babel, and fonts load externally; there is no production frontend bundle. |
| No test/typecheck scripts | `package.json` | Build success is not evidence of runtime correctness. |

Verification during this review: `npm run build` passed its Wrangler packaging dry run and reported `No bindings found`. No real-device or production load testing was performed during this review. An earlier isolated local check in this conversation also demonstrated fabricated ping success for a nonexistent hostname.

## Comparison with OpManager

This compares capabilities, not feature-count parity or licensing equivalence. OpManager editions and add-ons differ. Discovery/templates are documented in [Getting Started with Discovery](https://www.manageengine.com/network-monitoring/help/getting-started-discovery.html) and [Discover Networks](https://www.manageengine.com/network-monitoring/help/discover-networks.html).

| Capability | OpManager reference capability | Current NetPulse | Build stage |
| --- | --- | --- | --- |
| Discovery and inventory | Credential-based discovery and device templates | Predefined discovery and guessed classification | 8 |
| Availability/performance | Device and interface monitoring | Random measurements | 5–7 |
| Fault management | Thresholds, failures, SNMP traps, notifications, escalation | Stored alerts and manual fault simulation | 9, 12 |
| Operational UI | Dashboards and monitoring history | Reusable dashboard shell with simulated data | 10 |
| Topology/dependencies | Network views and dependency configuration | Hardcoded links | 11 |
| Server/virtual infrastructure | Server and virtualization monitoring | Sample server records | 12 |
| Reporting | Availability/performance reporting | No reliable measured history on which to base reports | 11 |
| Distributed operations | Central/probe capabilities in relevant editions | One global object or isolated memory state | 13 |
| Access control | User and role management | Role fields without enforced permission boundaries | 4 |
| Traffic/configuration management | NetFlow and configuration-management capabilities via relevant modules/add-ons | Not implemented | Optional extensions |

The [administrator guide](https://www.manageengine.com/network-monitoring/help/administrator-guide.html) documents fault handling, notification profiles, escalation, central/probe administration, and user management. The [feature overview](https://www.manageengine.com/network-monitoring/features.html) describes the broader monitoring scope. Treat NetFlow and configuration management as separate projects; see [add-ons](https://www.manageengine.com/network-monitoring/help/enable-add-ons.html) and [traffic analysis](https://www.manageengine.com/network-monitoring/network-traffic-analysis.html).

## Proposed architecture and initial scope

For an on-premises first release, the proposed default is:

```text
LAN devices -- ICMP / TCP / HTTP / SNMP --> Local collector service
                                                    |
                                            authenticated HTTPS
                                                    |
React UI <--> Hono API <--> PostgreSQL <--> background alert worker
                                               |
                                      notification delivery worker
```

Keep React and Hono. Move the production API to a supported Node.js runtime for this on-premises path; replace Cloudflare-specific persistence with a repository layer and PostgreSQL. Package services for a Linux VM with a reproducible deployment. The development workstation can remain Windows. Use a separate collector process with durable local buffering and narrowly scoped network permissions.

This is a proposed architecture, not an instruction to silently rewrite the app. Step 1 must resolve deployment requirements. If Cloudflare hosting is required, retain Workers, configure durable storage, and use the same outbound LAN collector architecture. Do not implement both persistence backends by default, or treat Wrangler development mode as the final on-premises service.

Provisional pilot scope: one organization, one site, up to 100 devices, IPv4 discovery, read-only monitoring, ICMP/TCP/HTTP availability, and selected SNMP profiles. These are planning assumptions, not measured capacity claims. Windows discovery, IPv6, virtual infrastructure, and multiple sites need explicit acceptance cases when included.

Example initial collection settings: availability every 15 seconds; SNMP every 30 seconds; discovery manually or on a much longer schedule. Verify device load before adopting these intervals. Dashboard freshness is collection interval plus processing/delivery delay; a fast refresh does not guarantee fresh source data.

## How to use the prompts

Run the shared instruction followed by one numbered prompt at a time. Inspect that stage's evidence before advancing. This guide asks for implementations, not just plans. Failed prerequisites should be repaired before dependent work proceeds. Keep a progress file so a new session can resume without reconstructing the project.

Hardware access, production credentials, and an approved deployment environment must come from the operator. When unavailable, implement and test against isolated fixtures, clearly mark real-device acceptance as pending, and continue independent work. Never claim that fixtures establish compatibility with physical equipment.

### Shared instruction — paste at the start of an implementation session

```text
Work in netpulse-infrastructure-network-monitor. Read applicable repository instructions,
docs/PRODUCTION_MONITORING_PROMPT_GUIDE.md, and any existing implementation progress file.
Implement only the selected stage and necessary prerequisites. Preserve unrelated user work.
Inspect the current code first: this guide is a baseline, not proof the code is unchanged.

Use maintained libraries and verify runtime compatibility from official documentation.
Production metrics must originate from actual checks or authenticated telemetry. Never
substitute random, hardcoded, or guessed measurements for unavailable data. Keep demo
fixtures isolated from production storage and disabled in production.

Enforce permissions server-side. Never embed or log real passwords, SNMP secrets, tokens,
or credential-bearing URLs. Do not scan arbitrary networks or operate physical equipment
outside the supplied test targets. Implement local and isolated tests without waiting for
hardware credentials; identify any remaining hardware-dependent validation explicitly.

Complete relevant tests, migrations, documentation, and the stage's acceptance criteria.
Do not claim completion from compilation alone or deploy publicly as part of implementation.
Update docs/IMPLEMENTATION_PROGRESS.md with changes, exact checks run, results, remaining
risks, and the next stage. Report incomplete acceptance criteria honestly. Do not mark the
whole application production-ready until the final release gate passes.
```

### Step 1 — Establish requirements and choose one deployment architecture

```text
Audit the current implementation and produce docs/ARCHITECTURE.md and a prioritized backlog.
Map existing routes/components to reusable UI, real CRUD, simulation, and missing services.

Establish deployment location (on-premises or Cloudflare plus collector), target OS, initial
device count, site count, supported vendors/models, retention, polling intervals, notification
channels, identity requirements, and recovery objectives. Ask only for decisions that block
architecture; document provisional defaults for the rest. Do not request secrets in chat.

Use the guide's on-premises architecture as a proposal, and record the final choice in an
architecture decision record. Define service boundaries, collector identity, device identity,
data ownership, trust boundaries, ports, migrations, and upgrade strategy. Compare integrating
existing collectors with writing adapters; avoid reimplementing mature protocol stacks.
Define measurable pilot acceptance and separate later feature parity from the first release.
No architecture-changing source edits in this stage.
```

Acceptance: one unambiguous deployment path, supported-device matrix, explicit assumptions, and measurable pilot targets. Unanswered mandatory decisions remain documented blockers.

### Step 2 — Separate the code and remove production simulation

```text
Implement the chosen service structure. Extract route handlers, domain services, storage
access, and shared validated API schemas from src/index.ts. Build the React frontend with
bundled dependencies and compiled CSS rather than CDN scripts and runtime Babel. Preserve
useful existing screens. Add type checking and focused API/browser test infrastructure.

Remove simulation from all production request paths. GET requests must never create metrics.
Unavailable capabilities must return an explicit unsupported/not-configured result, and the
UI must display unknown/empty states. Put sample inventory and simulated faults behind a
separate development-only fixture mechanism. Remove misleading live/SNMP/stream claims.
Document configuration and provide a secret-free environment example.
```

Acceptance: frontend builds without external runtime dependencies; fresh production state has no invented devices; repeated dashboard reads do not change telemetry; demo and production datasets cannot mix.

### Step 3 — Implement durable storage and safe migrations

```text
Implement the selected persistent backend and remove automatic memory fallback in production.
Model sites, collectors, credential references, devices, interfaces, monitor definitions,
measurements, state transitions, users, sessions, rules, incidents, notifications, and audit
events. Keep configuration separate from telemetry and encrypted secrets separate from DTOs.

Use stable unique IDs, site-scoped identities, timestamps with clear units, indexed history
queries, referential integrity, versioned migrations, and transactional inventory changes.
Define observed_at, received_at, quality, source, units, and counter/gauge semantics.
Define retention and a bounded-label policy; partition/aggregate when justified by workload.

Fix partial settings updates, not-found handling, and backup/restore completeness. Validate
imports before altering live data and make replacement atomic. Remove default reseeding when
the operator intentionally empties inventory. Provide database integration tests.
```

Acceptance: restart preserves data; invalid import leaves data unchanged; restore recovers documented datasets; missing records return controlled errors; omitted settings remain unchanged; storage failure never switches to demo mode.

### Step 4 — Secure users, sessions, credentials, and administrative actions

```text
Replace default credentials and known demo tokens with secure first-run administrator setup.
Use suitable salted password hashing, cryptographically secure sessions, expiration,
revocation, login throttling, and session invalidation on password/security changes.
For a same-origin browser UI prefer secure HttpOnly cookies with appropriate SameSite and
CSRF protection. If another design is chosen, document its token-storage and CSRF/XSS model.

Enforce administrator/operator/viewer permissions on every API and streaming connection.
Viewer is read-only; define exactly which actions an operator may perform. Remove public
summary access and production authentication-disable bypasses. Add OIDC/MFA integration if
required by the selected release scope. Protect bootstrap against simultaneous requests.

Encrypt stored device credentials with separately managed keys; support rotation, redaction,
and least-privilege access. Audit security and configuration changes. Ensure backup exports
have an explicit encrypted-secret policy. Test denied actions, not just successful login.
```

Acceptance: anonymous and viewer mutations are rejected; demo credentials/tokens fail; expired/revoked sessions fail; secrets never appear in device JSON or logs; password changes invalidate applicable sessions.

### Step 5 — Build a continuously running collector with real basic checks

```text
Implement a local collector service independent of browser activity. Add real ICMP, TCP,
and HTTP checks through supported libraries/system APIs; never interpolate targets into a
shell command. Where subprocesses are needed, use validated arguments without a shell and
bounded execution. ICMP permission errors must remain errors, not reported device outages.

Implement scheduling, concurrency limits, per-check deadlines, cancellation, retry/backoff,
configuration reload, collector heartbeat, and graceful shutdown. Restrict targets to the
configured site ranges; enforce scope after DNS resolution and redirects where applicable.
Do not turn the API into an arbitrary network proxy. Do not use a blanket private-IP ban
because authorized private LAN devices are the intended targets.

Distinguish check failure, authentication failure, unsupported capability, collector failure,
and stale data. Include local spool storage with explicit size/age limits and overflow alerts.
Provide service installation/startup instructions and isolated reachable/unreachable targets.
```

Acceptance: checks continue with the browser closed; timeouts are bounded; invalid/unresolvable targets never report invented success; restart behavior and concurrency limits are tested.

### Step 6 — Connect collector ingestion to the dashboard: first real vertical slice

```text
Implement one-time collector enrollment and scoped, rotatable collector credentials. Add
versioned authenticated batch-ingestion and configuration endpoints. A collector may report
only for its assigned site/devices; browser users cannot impersonate collectors.

Validate schema, timestamps, payload sizes, metric names/units, and identities. Implement
idempotent batch retries, bounded clock-skew handling, late samples, and out-of-order delivery.
Derive current state from the newest valid observation, not the most recently received packet.
Persist acknowledgement before removing samples from the collector spool.

Connect one actual check to a device detail screen and historical chart. Expose collector
health and sample freshness. Define a durable outage/recovery state machine with configurable
failure and recovery counts. Late replay must not create misleading new outage incidents.
```

Acceptance: one supplied real device produces measured history; duplicate uploads do not duplicate samples; collector isolation is tested; a temporary API outage buffers and replays data; stale telemetry does not appear healthy. If no hardware is available, leave that part pending.

### Step 7 — Add SNMP device and interface monitoring

```text
Add read-only SNMP polling using a maintained protocol implementation. Prefer SNMPv3 with
authentication/privacy, with explicitly configured v2c support for legacy devices. Separate
timeouts, access denial, missing OIDs, unsupported profiles, and actual zero readings.

Discover system identity, sysObjectID, uptime, and interfaces. Create versioned device profiles
with documented OIDs, units, transformations, and supported vendor/model evidence. Implement
interface operational/admin state, speed, 64-bit octet counters, errors, and discards. Derive
bits/second from successive counters and actual elapsed time. Handle reboot/discontinuity,
counter wrap, ifIndex changes, interface disappearance, and unknown speed correctly.

Add CPU/memory/temperature/PoE only for tested profiles. Preserve unknown metrics for unsupported
devices. Provide protocol fixtures and a hardware validation worksheet; compare measured
values with an independent device query. Do not report SNMPv3 support from a version string alone.
```

Acceptance: counter-rate math passes reset/wrap tests; one supported physical switch is verified; wrong credentials fail clearly; unsupported metrics remain unknown; no write operations are issued.

### Step 8 — Implement bounded discovery and inventory reconciliation

```text
Replace predefined discovery with asynchronous scan jobs run by the assigned collector.
Validate CIDRs and enforce configured network scope, maximum range, rate/concurrency limits,
cancellation, deadlines, progress, and audit logs. Support the address families declared in
the pilot requirements; explicitly reject unsupported ones. Do not assume all networks are /24.

Identify devices from observed protocol responses and match profiles using evidence. Keep
credential checks bounded. Reconcile existing inventory with site-scoped stable identities;
do not treat IP or MAC as a universally permanent unique identity. Preserve manual metadata.
Rediscovery must not duplicate devices or delete temporarily unreachable ones. Make import
into active monitoring an explicit policy, and show discovery provenance and last observation.
```

Acceptance: a repeat scan produces no duplicates; out-of-scope requests are rejected; cancellation works; unreachable and unidentified hosts do not receive guessed vendors or metrics.

### Step 9 — Implement incidents, maintenance, and reliable notifications

```text
Implement background rule evaluation over real observations and staleness. Support consecutive
failures, sustained thresholds, recovery hysteresis, warning/critical severity, and versioned
rule changes. Keep acknowledgement separate from recovery. Persist the state needed to resume
evaluation safely after restart and avoid duplicate active incidents.

Add maintenance windows, dependency suppression, and distinct collector-down incidents.
Define missing-data behavior and delayed/replayed-data policy. Implement notification routing,
SMTP and/or the chosen webhook channel, a durable delivery outbox, retries, delivery history,
and deduplication. Define whether recovery notifications wait for failed opening notifications.
Prevent webhook configuration from bypassing the deployment's allowed destination policy.
Add escalation schedules if included in the pilot; notifications use operator-configured test
destinations during validation, never hardcoded example recipients.
```

Acceptance: a controlled failure creates one incident/initial notification; acknowledgement does not fabricate recovery; recovery closes it; restart does not duplicate it; failed delivery retries; maintenance and collector outages behave as specified.

### Step 10 — Complete the monitoring UI using measured data

```text
Connect dashboard summaries, inventory, device detail, interfaces, discovery, and incidents to
the real APIs. Display sample age, source, units, collection interval, collector health, and
unsupported/stale states. Preserve graph gaps instead of interpolating unavailable data as
healthy. Add time range selection, server-side aggregation, pagination, and accessible errors.

Use bounded polling or authenticated SSE/WebSockets; collection must remain independent of
transport and browser count. Add reconnect behavior and authorization tests. Distinguish
changing browser refresh settings from changing collector schedules. Disable unimplemented
camera playback and switch controls with an accurate explanation. Add browser integration tests.
```

Acceptance: two viewers see consistent device state without changing sampling rate; disconnect/reconnect works; loading, empty, unauthorized, stale, and partial-failure states are covered.

### Step 11 — Build observed topology and trustworthy reports

```text
Replace hardcoded topology with observed LLDP/CDP/interface relationships for supported
devices, plus separately labeled manual links. Store source, confidence, timestamps, and link
aging. Distinguish physical topology from operator-defined monitoring dependencies. Validate
dependency cycles and use dependency suppression without erasing underlying incidents.

Calculate availability and outage duration from persisted state transitions and coverage.
Define treatment of unknown time, maintenance, collector downtime, timezone boundaries, and
missing samples. Publish numerator/denominator and coverage rather than assuming unobserved
time was healthy. Add measured interface/CPU trends and asynchronous CSV/PDF report exports
with authorization, time limits, and bounded resource usage.
```

Acceptance: link changes follow observations; manual links are distinguishable; report calculations pass known timelines including missing data and daylight-saving boundaries; reports contain no fixed SLA values.

### Step 12 — Extend protocol coverage toward OpManager functionality

```text
Implement the next approved integration as a bounded substage, not all integrations at once:
(a) authenticated host-agent/Windows monitoring for CPU, memory, filesystem, services, processes;
(b) SNMP traps/syslog ingestion with validation, rate limits, normalization, and retention;
(c) hypervisor/cloud API monitoring with read-only accounts and tested version compatibility;
(d) camera/NVR health through supported APIs and real stream checks.

For each integration add a capability manifest, credentials model, normalized schema, tests,
operator setup instructions, and real-environment evidence. Do not expose arbitrary remote
command execution as a shortcut. Traps complement periodic checks; they do not replace them.
If camera playback is required, use an authenticated media gateway with compatible browser
delivery rather than placing RTSP credentials in the frontend. Treat playback separately from
device availability. Mark unsupported products/versions explicitly.
```

Acceptance: each declared integration has a repeatable end-to-end test and an explicit supported-version matrix. Unimplemented submodules remain outside the release claim.

### Step 13 — Prepare deployment, recovery, capacity, and multiple sites

```text
Package the selected production services with reproducible builds, supported pinned dependency
versions, health/readiness checks, HTTPS configuration, durable volumes, secrets injection,
resource limits, and startup ordering. Add CI typecheck, tests, build, migration checks, and
dependency/security review. Document upgrades and rollback including schema compatibility.

Implement scheduled encrypted backups and restore into a clean environment; define key
recovery separately from backups. Add retention/rollup jobs, API pagination, structured logs,
request IDs, queue lag, ingestion lag, collector health, and notification failure metrics.

Test the agreed workload and a declared overload case. Report sample rate, active interfaces,
label cardinality, CPU/RAM/disk use, query latency, queue growth, and data-loss behavior. Derive
capacity claims from results. For multiple sites, add scoped collectors, overlapping subnet
support, durable assignments, and authorization isolation. If collector failover is required,
use leases/fencing and test takeover without duplicate checks or incidents. One global object
or one process is not evidence of distributed availability.
```

Acceptance: clean installation works; backup restoration meets agreed recovery objectives; load tests meet recorded targets; secrets are absent from artifacts; outage and disk-full behavior are documented and tested. Multiple-site/HA claims require their own tests.

### Step 14 — Execute the release gate and produce a readiness report

```text
Audit the implemented system against this guide and the agreed scope. Inspect code and run
tests; do not rely on previous completion summaries. Verify no production metrics originate
from random generators, hardcoded inventory, or fabricated diagnostics.

Run an authorized pilot: enroll a collector; discover known devices; compare measurements
against device queries; close all browsers; disconnect/reconnect a test device; observe one
outage and recovery; interrupt collector/API connectivity; replay buffered telemetry; restart
services; rotate credentials; deny viewer mutations; restore backup on a clean system; and
exercise notification failure and retention. Record timestamps and sanitized evidence.

Write docs/PRODUCTION_READINESS.md with supported scope, exact build/version, results,
remaining defects, capacity measurements, recovery results, operational runbooks, and release
recommendation. Classify every criterion as passed, failed, or not tested. Real-device tests
that could not run remain not tested. Do not call the product production-ready while critical
security, durability, collection, alerting, or recovery gates fail.
Prepare deployment artifacts and a rollout/rollback plan; execution of an actual production
rollout requires the operator's deployment instruction and configured environment.
```

Acceptance: evidence supports the declared production scope. Similarity to OpManager's interface is never a substitute for these checks.

## Optional projects after the monitoring foundation

- Flow analysis: NetFlow/IPFIX/sFlow collectors, exporter configuration, traffic aggregation, storage sizing, and explicit sampling semantics. SNMP bandwidth counters do not identify individual conversations.
- Network configuration management: configuration backup/diff, encrypted storage, vendor adapters, controlled approvals, and tested restore procedures. Keep device writes separate from monitoring credentials.
- IPAM/switch-port management: reconcile observed addresses, DHCP/DNS sources, VLANs, and interface attachment data; do not infer these relationships from IP suffixes.
- Application observability: logs, traces, application instrumentation, service maps, and separate retention/capacity requirements. This is a broader scope than network availability.
- Advanced availability: redundant collectors, database recovery/failover, delivery-worker coordination, and external monitoring of NetPulse itself.

Do not start all extensions together. Choose based on operational requirements and implement each with its own protocol support, security model, and acceptance evidence.

## Practical checkpoints

1. After steps 1–4: maintainable and secure foundation; not yet a working monitor.
2. After steps 5–6: first real end-to-end measurement path; not yet a complete operational release.
3. After steps 7–10: network monitoring pilot with actual switch metrics and alerts.
4. After steps 11–14, with required integrations: candidate production release for its tested scope.
5. Optional modules expand functionality; they do not establish full OpManager parity automatically.
