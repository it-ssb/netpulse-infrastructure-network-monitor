# NetPulse Production Monitoring Prompt & Architecture Guide

## Overview
This document serves as the master guide and reference specification for evolving NetPulse from a prototype prototype UI into an enterprise-grade, on-premises production monitoring system like Netdata, Datadog, and OpManager, designed to run natively on Linux (AlmaLinux 9.8).

---

## Core Production Principles & Safety Rules

1. **Authentic Telemetry Mandate**:
   - Production metrics must originate strictly from verified physical device checks (ICMP ping, SNMP v2c/v3, TCP socket probes, WMI/SSH, ONVIF/RTSP).
   - **Zero Hardcoded/Simulated Measurements**: Demo fixtures and mock generators must remain completely isolated from production storage and strictly disabled when operating in production mode.

2. **Zero-Trust & Credentials Protection**:
   - Server-side authorization enforcement for all API endpoints.
   - Passwords, SNMP community strings, API secrets, and credential-bearing RTSP URLs must never be exposed, logged, or returned in plain text to client views.

3. **Isolated Test Framework**:
   - Hardware-independent unit and integration tests using mocked network responses and local loopback fixtures.
   - Explicit labeling of hardware-dependent integration test gates before deployment onto physical company switches, routers, and NVRs.

4. **Protocol Stack Selection**:
   - Avoid reimplementing complex mature network protocols (e.g., custom SNMP parsers or native ICMP raw socket code in node/js).
   - Leverage maintained standard tools and libraries (Telegraf, Net-SNMP, Prometheus SNMP Exporter, Go2RTC, Ping binaries).

---

## Implementation Stage Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 0: Audit, Architecture Decision Record (ADR) & Technical Backlog      │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 1: Production Collector Pipeline (Real ICMP, SNMP, TCP Diagnostics)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 2: Persistence & Time-Series Data Layer (SQLite / PostgreSQL / TSDB)  │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 3: Local Network Auto-Discovery & Host Monitoring Agents               │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 4: Real-Time Alerting Engine, Escalation & Webhook Integration        │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 5: ONVIF / RTSP Camera Streaming & Switch Driver Integrations          │
├─────────────────────────────────────────────────────────────────────────────┤
│ STAGE 6: Production Release Gate & AlmaLinux 9.8 Systemd Deployment         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage Guidelines & Acceptance Standard

Every development stage must complete:
- Explicit code changes meeting stage scope (no premature scope creep).
- Comprehensive local verification and test runs.
- Detailed progress record in `docs/IMPLEMENTATION_PROGRESS.md`.
- Updated architectural records in `docs/ARCHITECTURE.md`.
