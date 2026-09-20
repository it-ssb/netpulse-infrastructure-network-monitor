# 📡 NetPulse — Self-Hosted Infrastructure & Network Monitoring

**NetPulse** is an enterprise-grade real-time infrastructure, network switch, camera/NVR, server, and workspace monitoring solution designed for local enterprise networks.

---

## ⚡ Quick Start Guide (Local Machine)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** or **bun**

---

### Step 1: Install Dependencies

```bash
npm install
```

---

### Step 2: Run in Local Development Mode

Start the local server using Cloudflare Wrangler (runs locally on port `8787` with SQLite DO storage enabled):

```bash
npm run dev
```

Once started, open your browser and navigate to:
👉 **`http://localhost:8787`** or **`http://127.0.0.1:8787`**

---

### Step 3: Run on your Local Company Network (Expose to LAN)

To access NetPulse from any computer, switch dashboard, or mobile device on your local network (e.g. `192.168.1.X`):

```bash
npx wrangler dev --ip 0.0.0.0 --port 8787
```

Now any device on your LAN can access the monitoring dashboard at:
👉 **`http://<YOUR_LOCAL_IP>:8787`** (e.g. `http://192.168.1.50:8787`)

---

## 🚀 Key Features

1. **Direct IP Connection Engine**:
   - Add any local device by IP address (`192.168.1.X`).
   - Automated 4-step probe sequence: ICMP Ping, Port Sweep (SNMP `161`, RTSP `554`, SSH `22`, RDP `3389`), Hardware Fingerprinting, and Live Telemetry Streaming.

2. **Network Switch & PoE Port Inspector**:
   - Manage switch ports, active PoE wattage, VLAN assignments, error counters, and bandwidth per port.

3. **CCTV Cameras & NVR Monitoring**:
   - Live stream RTSP feeds, camera channel health, motion alarms, bitrate, and recording retention.

4. **Subnet Auto-Discovery**:
   - Probe CIDR ranges (e.g., `192.168.1.0/24`) to auto-detect switches, cameras, servers, and PCs.

5. **Alert Engine & Incident Response**:
   - Real-time threshold alerts (CPU > 85%, packet loss, link down, RTSP stream failure) with one-click resolution.

6. **Host Agent & SNMP Collector**:
   - Built-in 1-line installation scripts for Linux/Windows host metrics collection.

---

## 🛠️ Deploying to Production / On-Premise Worker

To deploy NetPulse to your company's self-hosted Cloudflare Worker or local enterprise edge node:

```bash
npm run deploy
```

---

## 📜 Architecture Overview

- **Backend**: [Hono.js](https://hono.dev/) framework running on Edge Runtime / Durable Objects with local SQLite persistence.
- **Frontend**: High-density responsive UI built with Tailwind CSS, Chart.js, Lucide Icons, and WebSockets.
- **Data Persistence**: Native SQLite embedded storage.
