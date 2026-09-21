# NetPulse - Production Architecture & System Design

## Architecture Decision Record (ADR-001): On-Premises AlmaLinux 9.8 Deployment

* **Status**: Approved
* **Context**: The company requires an on-premises network and infrastructure monitoring solution similar to Netdata, Datadog, and OpManager to monitor core switches, servers, security cameras, NVRs, and desktop PCs across local subnets without relying on external cloud services.
* **Decision**: Deploy NetPulse natively as an **on-premises systemd enterprise service** on **AlmaLinux 9.8 (64-bit Enterprise Linux)**, utilizing a hybrid local backend architecture (Node.js runtime + SQLite/PostgreSQL storage + Telegraf/Net-SNMP collectors).
* **Consequences**:
  - Full local data sovereignty with zero external cloud dependencies or telemetry leaks.
  - Native integration with Linux networking tools (`iputils-ping`, `net-snmp-utils`, `nmap`, `go2rtc`).
  - Strict compliance with local network firewall security boundaries and systemd process isolation.

---

## 1. System Operating Parameters & Deployment Profile

| Parameter | Specification / Deployment Target |
| :--- | :--- |
| **Deployment Location** | On-Premises Linux Server (On-Site HQ Data Center) |
| **Target OS** | **AlmaLinux 9.8** (Enterprise Linux 9 Series, RHEL 9 binary compatible) |
| **Initial Device Scope** | **250 Monitored Network Devices** across 2 Campus Sites / Buildings |
| **Monitored Device Types** | Core/Edge Switches (Cisco, Aruba, Ubiquiti), Bare-Metal & VM Servers (Dell, HPE, ESXi, Ubuntu, AlmaLinux), Security Cameras & NVRs (Hikvision, Dahua, Axis), Desktop PCs (Windows 11, Linux), Network Printers (HP) |
| **Polling Intervals** | • **Tier 1 (Critical Ping/ICMP)**: 5-second interval<br>• **Tier 2 (SNMP & Telemetry)**: 15-second interval<br>• **Tier 3 (Discovery & Interface Topology)**: 5-minute interval |
| **Metric Retention** | • **Raw (15s)**: 7 Days<br>• **1-Minute Aggregates**: 30 Days<br>• **1-Hour Aggregates**: 365 Days (1 Year) |
| **Notification Channels** | Webhooks (Slack/Teams/PagerDuty), Local Email (SMTP), Syslog (UDP 514 / TCP 6514) |
| **Identity Requirements** | Local Database RBAC (Admin, Operator, Viewer) with optional LDAP/Active Directory SSO support |
| **Recovery Objectives** | **RTO**: < 15 Minutes<br>**RPO**: < 1 Minute (WAL mode SQLite database replication and daily snapshot exports) |

---

## 2. Comprehensive Component & Route Audit Matrix

This matrix maps every existing API route (`src/index.ts`) and frontend UI component (`public/app.jsx`) to its current implementation status and the required production transition path.

### 2.1 API Route Audit Matrix

| Route Path | Method | Current Implementation | Classification | Target Production Service / Adapter |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/status` | `GET` | Reads session & settings state | **Real CRUD** | Retain in Node.js API server |
| `/api/auth/login` | `POST` | Validates local DB credentials, issues token | **Real CRUD** | Upgrade password hashing to bcrypt/Argon2id |
| `/api/auth/me` | `GET` | Validates bearer token | **Real CRUD** | Retain in Node.js API server |
| `/api/auth/logout` | `POST` | Invalidates active session | **Real CRUD** | Retain in Node.js API server |
| `/api/auth/change-password`| `POST` | Updates user password | **Real CRUD** | Add server-side policy check + audit log |
| `/api/auth/users` | `GET/POST` | Manages local system accounts | **Real CRUD** | Add RBAC role validation (Admin only) |
| `/api/dashboard/summary` | `GET` | Computes system metrics | **Hybrid (Simulated)** | Re-anchor to real time-series query service |
| `/api/nodes` | `GET` | Lists inventory | **Real CRUD** | Retain; add indexed filtering & pagination |
| `/api/nodes/probe-and-add` | `POST` | Probes target IP & creates node | **Hybrid (Mock Probe)** | Replace mock delay with actual `fping` & SNMP v2c/v3 handshake |
| `/api/nodes/:id` | `GET` | Fetches node details & metrics | **Real CRUD** | Connect to time-series DB metric engine |
| `/api/nodes/:id` | `DELETE` | Deletes node & related entities | **Real CRUD** | Retain with cascading deletion |
| `/api/nodes/:id/simulate-fault`| `POST` | Mutates state to simulate fault | **Simulation Engine** | **Isolate/Disable in Production** (Dev/Demo flag only) |
| `/api/nodes/:nodeId/ports/:portId` | `PUT` | Configures port VLAN/status | **Real CRUD (DB Only)** | Connect to SNMP Set / SSH Netmiko driver |
| `/api/tools/ping` | `POST` | Generates ping output | **Simulation Engine** | Replace mock generator with system `iputils-ping` / `fping` execution |
| `/api/tools/port-scan` | `POST` | Simulates open port array | **Simulation Engine** | Replace with actual TCP socket connection probe / `nmap` |
| `/api/tools/traceroute` | `POST` | Returns static hop tree | **Simulation Engine** | Replace with native system `traceroute` binary execution |
| `/api/cameras` | `GET` | Lists cameras & channels | **Real CRUD** | Retain; link with ONVIF camera discovery |
| `/api/discovery` | `GET` | Lists scanned devices | **Real CRUD** | Retain; connect to background scanner daemon |
| `/api/discovery/scan` | `POST` | Simulates IP subnet scan | **Simulation Engine** | Connect to `nmap` subnet ARP/ICMP scanner service |
| `/api/discovery/import` | `POST` | Moves discovered host to inventory | **Real CRUD** | Retain |
| `/api/alerts` | `GET` | Returns alert records | **Real CRUD** | Connect to real-time alerting rule engine |
| `/api/alerts/:id/ack` | `POST` | Acknowledges alert | **Real CRUD** | Retain |
| `/api/alerts/:id/resolve` | `POST` | Resolves alert | **Real CRUD** | Retain |
| `/api/alert-rules` | `GET/POST` | Manages threshold rules | **Real CRUD** | Retain |
| `/api/topology` | `GET` | Returns graph topology | **Hybrid** | Build LLDP/CDP auto-topology discovery service |
| `/api/settings` | `GET/POST` | System config | **Real CRUD** | Retain |
| `/api/audit-logs` | `GET` | System activity log | **Real CRUD** | Retain |
| `/api/system/export` | `GET` | JSON snapshot export | **Real CRUD** | Retain |
| `/api/system/import` | `POST` | JSON snapshot import | **Real CRUD** | Retain |

---

### 2.2 Frontend View & Component Audit Matrix

| Component / Tab | Role in Prototype | Production Requirement |
| :--- | :--- | :--- |
| **Overview Dashboard** | Displays live summary counters & alerts | Reusable UI. Connect polling to live metric aggregations. |
| **Inventory Grid** | Filterable list of switches, servers, cams | Reusable UI. Connect to real CRUD API with server pagination. |
| **Switch Port Mapper** | Visual 24/48-port faceplate visualizer | Reusable UI. Re-anchor port statuses to actual SNMP IF-MIB tables (`ifOperStatus`, `ifInOctets`, `ifOutOctets`). |
| **Camera & NVR Wall** | Stream grid & PTZ control modal | Reusable UI. Integrate with Go2RTC or WebRTC/HLS proxy server to deliver real RTSP video streams. |
| **Diagnostics Console** | Interactive Ping / Port Scan / Traceroute | Reusable UI. Wire to real AlmaLinux system binary executions. |
| **Subnet Auto-Discovery** | Subnet scanner & inventory importer | Reusable UI. Wire to real `nmap` ARP/ICMP background scanner. |
| **Interactive Topology** | SVG graph of network infrastructure | Reusable UI. Enrich node connections using LLDP/CDP SNMP tables. |
| **Alert Manager** | Active alerts & rule configuration | Reusable UI. Wire to server-side threshold evaluation worker. |
| **Audit Logs** | System action history | Reusable UI. Retain real CRUD integration. |
| **System Settings** | Subnet, polling interval, webhooks | Reusable UI. Add systemd service status indicator & backup triggers. |

---

## 3. Collector Architecture & Protocol Stack Strategy

To achieve high performance on AlmaLinux 9.8 without reinventing mature network protocols, NetPulse utilizes a **collector-first architecture**:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ALMALINUX 9.8 HOST SERVER                           │
 │                                                                             │
 │   ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────┐   │
 │   │ NetPulse API     │   │ Telegraf Agent   │   │ Go2RTC Streamer       │   │
 │   │ (Node.js/Hono)   │◄──│ (SNMP, ICMP, host│   │ (RTSP to WebRTC)      │   │
 │   └────────┬─────────┘   └────────┬─────────┘   └───────────┬───────────┘   │
 │            │                      │                         │               │
 └────────────┼──────────────────────┼─────────────────────────┼───────────────┘
              │                      │                         │
              ▼                      ▼                         ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      LOCAL NETWORK INFRASTRUCTURE                           │
 │  ┌──────────────┐      ┌──────────────┐     ┌──────────────┐                │
 │  │ Core Switch  │      │ Linux Server │     │ NVR / Camera │                │
 │  │ (SNMP v2c/v3)│      │ (SSH / Agent)│     │ (RTSP / ONVIF│                │
 │  └──────────────┘      └──────────────┘     └──────────────┘                │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Protocol Collector Matrix

1. **SNMP Collector (Switches, Routers, Firewalls, NAS, Printers)**:
   - **Strategy**: Leverage Telegraf `inputs.snmp` or Net-SNMP `snmpget`/`snmpwalk` utilities.
   - **Rationale**: Mature MIB parsing, automatic handling of 64-bit counters (`ifHCInOctets`), and native SNMPv3 encryption (AES/SHA).

2. **ICMP Latency & Availability Engine (All Devices)**:
   - **Strategy**: Execute system `fping` binary in batch mode.
   - **Rationale**: Efficient parallel pinging of 250+ hosts with sub-millisecond precision and 0% false positives.

3. **Camera Streaming & PTZ Engine (Security Cameras & NVRs)**:
   - **Strategy**: Go2RTC gateway running alongside NetPulse.
   - **Rationale**: Translates high-bitrate camera RTSP feeds into browser-native WebRTC / MSE streams with sub-500ms latency.

4. **Host System Telemetry (Linux & Windows Servers)**:
   - **Strategy**: Telegraf host collector or system SSH probes for agentless telemetry.
   - **Rationale**: Collects CPU, memory, disk I/O, network interface traffic, and process statistics reliably.

---

## 4. Service Boundaries, Network Security & Ports

### 4.1 Firewall & Network Port Map (AlmaLinux `firewalld`)

```bash
# Permitted AlmaLinux 9.8 Firewall Configuration
firewall-cmd --permanent --add-port=8787/tcp   # NetPulse Web UI & REST API
firewall-cmd --permanent --add-port=1984/tcp   # Go2RTC WebRTC Stream Gateway
firewall-cmd --permanent --add-port=162/udp    # Local SNMP Trap Receiver
firewall-cmd --permanent --add-port=514/udp    # Local Syslog Receiver
firewall-cmd --reload
```

### 4.2 Security & Credentials Policy
- **Secrets Storage**: SNMP community strings and camera passwords stored in encrypted columns or AlmaLinux system environment files (`/etc/netpulse/env`).
- **Authorization**: All API requests validated server-side against session token; non-admin users blocked from changing system settings or triggering diagnostics.
- **Data Isolation**: Production data stored strictly in local SQLite (`/var/lib/netpulse/netpulse.sqlite`) or local PostgreSQL instance.

---

## 5. Migration & Upgrade Strategy for AlmaLinux 9.8

1. **Database Schema Versioning**:
   - Schema updates managed via deterministic migration files (`migrations/001_initial.sql`, `migrations/002_timeseries.sql`).
   - SQLite `PRAGMA user_version` checked at startup before starting API listener.

2. **Systemd Service Lifecycle**:
   - Service unit located at `/etc/systemd/system/netpulse.service`.
   - Automatic restart on failure with graceful signal handling (`SIGINT`/`SIGTERM`).

---

## 6. Measurable Pilot Acceptance Criteria

To pass from implementation into pilot phase on AlmaLinux 9.8, the system must satisfy the following measurable benchmarks:

1. **ICMP Availability Precision**: Monitor 250 test endpoints continuously for 24 hours with zero false-down reports and < 1% CPU overhead.
2. **SNMP Polling Throughput**: Successfully poll 48 ports across core switches every 15 seconds with 100% packet ingestion reliability.
3. **Stream Latency**: Deliver live RTSP video feeds from local NVRs to the NetPulse camera view with < 1.0 second video latency.
4. **Alert Trigger Speed**: Trigger webhook notification within 5 seconds of a simulated link outage or host down event.
5. **System Recovery**: Demonstrate system recovery from hard reboot in < 60 seconds with 0 data corruption.

---

## 7. Prioritized Technical Backlog

### Stage 1: Production Telemetry Engine & System Integrations (Immediate Focus)
- [ ] Replace diagnostic mock functions (`/api/tools/*`) with actual AlmaLinux system binary invocations (`ping`, `traceroute`, TCP socket connection test).
- [ ] Implement real `fping` background ICMP polling service to replace mock data step simulation in `src/index.ts`.
- [ ] Implement real SNMP v2c/v3 driver using Net-SNMP binary/library binding to read actual interface traffic (`IF-MIB`).
- [ ] Add strict server-side validation to ensure mock simulation routes (`/api/nodes/:id/simulate-fault`) are disabled in production mode (`NETPULSE_ENV=production`).

### Stage 2: Time-Series Storage & Metrics Retention
- [ ] Implement local SQLite time-series schema with retention rollups (raw 15s -> 1m -> 1h).
- [ ] Build automated metric pruning job running on AlmaLinux cron or internal timer.

### Stage 3: Real Subnet Auto-Discovery & Host Management
- [ ] Integrate `nmap` ARP/ICMP scanner into `/api/discovery/scan` to discover active devices on local subnets.
- [ ] Implement MAC OUI lookup table for exact vendor fingerprinting.

### Stage 4: Alert Evaluation Engine & Real Webhook Dispatcher
- [ ] Build server-side background rule evaluation worker that evaluates incoming metrics against `alert_rules`.
- [ ] Add real HTTP webhook poster (Slack, Teams, Discord, custom JSON) and local SMTP email alerting.

### Stage 5: ONVIF Camera Discovery & Go2RTC Video Proxy
- [ ] Implement ONVIF WS-Discovery probe to locate cameras on local subnets automatically.
- [ ] Integrate Go2RTC binary manager to proxy RTSP streams to WebRTC feeds for the Camera Wall.

### Stage 6: AlmaLinux 9.8 RPM / Systemd Deployment & Hardening
- [ ] Create systemd service template (`netpulse.service`) and install script (`install.sh`) for AlmaLinux 9.8.
- [ ] Implement audit logging to systemd journal (`journalctl`) and local security audit file.

## ADR-002: Persistent backend selection

The implementation selects local SQLite and Node.js 24+ for the initial deployment, superseding the Cloudflare Durable Object prototype and resolving the SQLite/PostgreSQL alternative in ADR-001. See [PERSISTENCE.md](PERSISTENCE.md) for the implemented schema, migration, retention and recovery contracts, including scale limitations requiring pilot measurements.
