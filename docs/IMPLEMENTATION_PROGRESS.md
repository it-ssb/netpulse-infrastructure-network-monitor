# NetPulse - Implementation Progress & Stage Status

## Current Overview
* **Active Stage**: Stage 0 / Stage 1 Prerequisites (Architecture & System Audit)
* **Target OS**: AlmaLinux 9.8 (On-Premises Linux Deployment)
* **Status**: Completed Stage 0 baseline audit, ADR-001 recording, route/component mapping matrix, collector architecture specification, and technical backlog establishment.

---

## Completed Tasks in Current Stage

1. **System & Repository Audit**:
   - Inspected current prototype implementation across `src/index.ts` (API routes, Durable Object SQLite store, and mock simulation) and `public/app.jsx` (React UI views).
   - Identified all simulated routes (diagnostics, subnet scan, metrics step simulation, fault simulation) and established clear boundaries for real CRUD vs simulated engines.

2. **Architecture Specification & Decision Record (`docs/ARCHITECTURE.md`)**:
   - Formulated **ADR-001** approving native on-premises Linux deployment on AlmaLinux 9.8.
   - Defined target deployment operational profile (250 devices, 2 campus sites, 3-tier polling intervals, 1-year retention rollups, RBAC authentication, RTO < 15m / RPO < 1m).
   - Created comprehensive **Route & Component Audit Matrix** mapping every endpoint and view to its reusable UI status and production transition target.
   - Designed collector-first architecture leveraging Telegraf, Net-SNMP, system `fping`/`nmap`, and Go2RTC gateway.
   - Formulated firewall port strategy, security/credentials policy, database migration strategy, and measurable pilot acceptance criteria.
   - Established prioritized technical backlog covering Stages 1 to 6.

3. **Production Guidance Reference (`docs/PRODUCTION_MONITORING_PROMPT_GUIDE.md`)**:
   - Documented core production monitoring principles (authentic telemetry mandate, zero-trust credential security, isolated test framework, protocol stack selection).
   - Mapped 6-stage roadmap from initial audit through AlmaLinux 9.8 systemd production release gate.

---

## Verification Checks & Results

| Check Executed | Tool / Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Workspace File Audit** | `find` / `read` | **PASSED** | Inspected all existing source code and configuration files (`package.json`, `wrangler.json`, `src/index.ts`, `public/app.jsx`). |
| **Deploy & Bundle Check** | `deploy_space` | **PASSED** | Space preview deployed successfully (`commit_hash: d981671ffa3f8583bd77b2e334dbe55e7ce21d9c`). |
| **Browser Console Verification** | `get_browser_console_logs` | **PASSED** | Verified preview load; standard 401 handling for unauthenticated preview state works as expected; zero JS exceptions or rendering errors. |

---

## Identified Risks & Mitigation Plans

1. **Host Binary Dependency on AlmaLinux 9.8**:
   - *Risk*: Systems lacking `fping`, `net-snmp-utils`, or `nmap` packages might fail to run real diagnostic and discovery routines.
   - *Mitigation*: Create an automated `install.sh` setup script for AlmaLinux 9.8 that automatically installs required EPEL/standard RPM dependencies (`dnf install -y fping net-snmp net-snmp-utils nmap`).

2. **SNMP Timeout & Local Network Latency**:
   - *Risk*: Unresponsive network switches or closed firewall ports could block polling worker loops.
   - *Mitigation*: Implement asynchronous non-blocking worker pools with per-host timeout thresholds (max 2.0s per SNMP batch request) and exponential backoff.

3. **Production Safety & Fault Simulation Isolation**:
   - *Risk*: Simulated fault routes (`/api/nodes/:id/simulate-fault`) accidentally triggered in production environment.
   - *Mitigation*: Add environment check (`process.env.NETPULSE_ENV === 'production'`) to disable all simulation endpoints server-side in production deployments.

---

## Next Stage Plan (Stage 1: Telemetry Collector Pipeline)

1. **System Binary Execution Integration**:
   - Replace `/api/tools/ping`, `/api/tools/port-scan`, and `/api/tools/traceroute` mock generators with real system commands when running on Linux hosts, falling back gracefully to safe mock drivers in cloud preview environments.

2. **Real ICMP & SNMP Telemetry Collectors**:
   - Implement real `fping` background telemetry runner for ICMP availability.
   - Add Net-SNMP interface collector (`IF-MIB` table polling) for network switches and routers.

3. **Production Mode Guard**:
   - Enforce server-side disablement of simulation endpoints when running in production mode.

## Persistence implementation (September 2026)

Implemented ADR-002 local Node.js/SQLite runtime, versioned relational schema, fail-closed startup, transactional inventory operations, staged atomic full backup replacement, partial settings updates, missing-row handling, separate encrypted credential storage and bounded telemetry history. Added real SQLite integration tests and gauge retention maintenance. See [PERSISTENCE.md](PERSISTENCE.md) for operational limits, counter retention, legacy migration constraints and verification commands. Collector integration and production load/recovery qualification remain outstanding.
