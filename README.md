# 📡 NetPulse — Self-Hosted Infrastructure & Network Monitoring

**NetPulse** is an enterprise-grade real-time infrastructure, network switch, camera/NVR, server, and workspace monitoring solution designed for local enterprise networks.

---

## ⚡ Local Setup & How the Fix Works

If you previously encountered the Wrangler error:
`Unexpected external import of "cloudflare:workers"` / `Your worker has no default export`

**This has been fixed in `src/index.ts` and `wrangler.json`!**

### Step 1: Pull / Sync Code & Install Dependencies

Make sure you have the updated files (`src/index.ts` and `wrangler.json`):

```bash
git pull
npm install
```

---

### Step 2: Run in Local Development Mode

Start the local server using Wrangler:

```bash
npm run dev
```

or directly with npx:

```bash
npx wrangler dev
```

Once started, open your browser and navigate to:
👉 **`http://localhost:8787`** or **`http://127.0.0.1:8787`**

---

### Step 3: Expose to Local Company Network (LAN)

To make NetPulse accessible to all computers, switches, and devices on your company network (e.g. `192.168.1.X`):

```bash
npx wrangler dev --ip 0.0.0.0 --port 8787
```

Access the dashboard from any browser on your network at:
👉 **`http://<YOUR_LOCAL_SERVER_IP>:8787`** (e.g. `http://192.168.1.50:8787`)

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

