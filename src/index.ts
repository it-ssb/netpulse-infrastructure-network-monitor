import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

// Default admin credentials and session keys
const DEFAULT_ADMIN = {
  id: 'usr-admin-01',
  username: 'admin',
  password: 'password123',
  name: 'Network Administrator',
  role: 'admin',
  created_at: Date.now()
};

// Seed generator
function buildSeedData() {
  const now = Date.now();

  const nodes = [
    {
      id: 'node-sw-01',
      name: 'Core-Switch-01',
      ip: '192.168.1.1',
      type: 'switch',
      status: 'online',
      vendor: 'Cisco',
      model: 'Catalyst 9300 48P',
      location: 'HQ Server Room',
      rack: 'Rack A-01',
      os_version: 'IOS-XE 17.09.04',
      uptime_secs: 1420000,
      cpu_usage: 18.4,
      memory_usage: 42.1,
      disk_usage: 22.0,
      latency_ms: 0.8,
      packet_loss: 0.0,
      bandwidth_in_mbps: 482.5,
      bandwidth_out_mbps: 512.1,
      snmp_version: 'v2c',
      snmp_community: 'public',
      ports_open: '22,80,161,443',
      last_seen: now,
    },
    {
      id: 'node-sw-02',
      name: 'Floor1-Dist-Switch',
      ip: '192.168.1.2',
      type: 'switch',
      status: 'online',
      vendor: 'Aruba',
      model: 'CX 6300M 24G PoE+',
      location: 'Floor 1 Telecom Closet',
      rack: 'Rack B-02',
      os_version: 'ArubaOS-CX 10.11',
      uptime_secs: 890000,
      cpu_usage: 24.1,
      memory_usage: 55.3,
      disk_usage: 30.5,
      latency_ms: 1.2,
      packet_loss: 0.0,
      bandwidth_in_mbps: 180.2,
      bandwidth_out_mbps: 195.8,
      snmp_version: 'v2c',
      snmp_community: 'public',
      ports_open: '22,161,443',
      last_seen: now,
    },
    {
      id: 'node-srv-01',
      name: 'VM-Host-R750',
      ip: '192.168.1.10',
      type: 'server',
      status: 'online',
      vendor: 'Dell',
      model: 'PowerEdge R750',
      location: 'HQ Server Room',
      rack: 'Rack A-02',
      os_version: 'VMware ESXi 7.0U3',
      uptime_secs: 2592000,
      cpu_usage: 68.2,
      memory_usage: 81.4,
      disk_usage: 64.8,
      latency_ms: 0.4,
      packet_loss: 0.0,
      bandwidth_in_mbps: 340.0,
      bandwidth_out_mbps: 410.2,
      snmp_version: 'v3',
      snmp_community: 'privKey99',
      ports_open: '22,80,443,5989,902',
      last_seen: now,
    },
    {
      id: 'node-srv-02',
      name: 'App-DB-Primary',
      ip: '192.168.1.12',
      type: 'server',
      status: 'warning',
      vendor: 'HPE',
      model: 'ProLiant DL380 Gen10',
      location: 'HQ Server Room',
      rack: 'Rack A-03',
      os_version: 'Ubuntu 22.04.3 LTS',
      uptime_secs: 512000,
      cpu_usage: 88.5,
      memory_usage: 89.2,
      disk_usage: 91.0,
      latency_ms: 2.1,
      packet_loss: 0.1,
      bandwidth_in_mbps: 210.4,
      bandwidth_out_mbps: 320.6,
      snmp_version: 'v2c',
      snmp_community: 'public',
      ports_open: '22,80,443,3306,5432,6379',
      last_seen: now,
    },
    {
      id: 'node-nas-01',
      name: 'Corp-Storage-NAS',
      ip: '192.168.1.20',
      type: 'nvr',
      status: 'online',
      vendor: 'Synology',
      model: 'RackStation RS3621xs+',
      location: 'HQ Server Room',
      rack: 'Rack A-04',
      os_version: 'DSM 7.2-64570',
      uptime_secs: 3400000,
      cpu_usage: 32.1,
      memory_usage: 48.0,
      disk_usage: 78.4,
      latency_ms: 0.9,
      packet_loss: 0.0,
      bandwidth_in_mbps: 620.1,
      bandwidth_out_mbps: 180.4,
      snmp_version: 'v2c',
      snmp_community: 'public',
      ports_open: '80,443,5000,5001,2049,445',
      last_seen: now,
    },
    {
      id: 'node-nvr-01',
      name: 'Sec-32CH-NVR',
      ip: '192.168.1.30',
      type: 'nvr',
      status: 'online',
      vendor: 'Hikvision',
      model: 'DS-7732NI-K4 / 16P',
      location: 'Security Control Room',
      rack: 'Rack Sec-01',
      os_version: 'V4.61.025_220905',
      uptime_secs: 1890000,
      cpu_usage: 45.0,
      memory_usage: 61.2,
      disk_usage: 82.5,
      latency_ms: 1.5,
      packet_loss: 0.0,
      bandwidth_in_mbps: 128.0,
      bandwidth_out_mbps: 45.2,
      snmp_version: 'v2c',
      snmp_community: 'public',
      ports_open: '80,554,8000',
      last_seen: now,
    },
    {
      id: 'node-cam-01',
      name: 'Cam-Lobby-Main',
      ip: '192.168.1.101',
      type: 'camera',
      status: 'online',
      vendor: 'Hikvision',
      model: 'DS-2CD2143G2-I (4MP Dome)',
      location: 'Main Building Lobby',
      rack: 'Ceiling Mount L1',
      os_version: 'V5.7.10_220830',
      uptime_secs: 950000,
      cpu_usage: 12.0,
      memory_usage: 28.0,
      disk_usage: 0.0,
      latency_ms: 3.2,
      packet_loss: 0.0,
      bandwidth_in_mbps: 0.0,
      bandwidth_out_mbps: 6.2,
      rtsp_url: 'rtsp://admin:pass@192.168.1.101:554/Streaming/Channels/101',
      ports_open: '80,554,8000',
      last_seen: now,
    },
    {
      id: 'node-cam-02',
      name: 'Cam-ServerRoom-PTZ',
      ip: '192.168.1.102',
      type: 'camera',
      status: 'online',
      vendor: 'Axis',
      model: 'P5655-E PTZ Network Camera',
      location: 'HQ Server Room Center',
      rack: 'Overhead Mount',
      os_version: 'AXIS OS 10.12.1',
      uptime_secs: 1200000,
      cpu_usage: 19.5,
      memory_usage: 34.0,
      disk_usage: 0.0,
      latency_ms: 2.1,
      packet_loss: 0.0,
      bandwidth_in_mbps: 0.0,
      bandwidth_out_mbps: 8.5,
      rtsp_url: 'rtsp://admin:pass@192.168.1.102:554/axis-media/media.amp',
      ports_open: '80,443,554',
      last_seen: now,
    },
    {
      id: 'node-cam-03',
      name: 'Cam-Gate-Perimeter',
      ip: '192.168.1.103',
      type: 'camera',
      status: 'warning',
      vendor: 'Dahua',
      model: 'IPC-HFW5842E-ZE (8MP Bullet)',
      location: 'Main Gate Entrance',
      rack: 'Pole Mount Gate 1',
      os_version: 'V3.100.0000000.1',
      uptime_secs: 430000,
      cpu_usage: 38.0,
      memory_usage: 52.0,
      disk_usage: 0.0,
      latency_ms: 18.5,
      packet_loss: 3.5,
      bandwidth_in_mbps: 0.0,
      bandwidth_out_mbps: 12.1,
      rtsp_url: 'rtsp://admin:pass@192.168.1.103:554/cam/realmonitor?channel=1&subtype=0',
      ports_open: '80,554,37777',
      last_seen: now,
    },
    {
      id: 'node-fw-01',
      name: 'FortiGate-Edge-FW',
      ip: '192.168.1.254',
      type: 'firewall',
      status: 'online',
      vendor: 'Fortinet',
      model: 'FortiGate 100F',
      location: 'HQ Server Room',
      rack: 'Rack A-01',
      os_version: 'FortiOS v7.2.5',
      uptime_secs: 2800000,
      cpu_usage: 28.5,
      memory_usage: 62.0,
      disk_usage: 41.2,
      latency_ms: 1.1,
      packet_loss: 0.0,
      bandwidth_in_mbps: 820.0,
      bandwidth_out_mbps: 790.4,
      snmp_version: 'v3',
      snmp_community: 'secCommunity',
      ports_open: '22,80,443,161,500,4500',
      last_seen: now,
    },
    {
      id: 'node-pc-01',
      name: 'Exec-Desktop-PC1',
      ip: '192.168.1.105',
      type: 'pc',
      status: 'online',
      vendor: 'Lenovo',
      model: 'ThinkCentre M90q',
      location: 'Executive Suite 401',
      rack: 'Desk 401',
      os_version: 'Windows 11 Pro 23H2',
      uptime_secs: 32000,
      cpu_usage: 14.2,
      memory_usage: 45.8,
      disk_usage: 38.0,
      latency_ms: 2.8,
      packet_loss: 0.0,
      bandwidth_in_mbps: 12.4,
      bandwidth_out_mbps: 4.1,
      ports_open: '135,139,445,3389',
      last_seen: now,
    },
    {
      id: 'node-prn-01',
      name: 'Reception-M507-Printer',
      ip: '192.168.1.150',
      type: 'printer',
      status: 'online',
      vendor: 'HP',
      model: 'LaserJet Enterprise M507',
      location: 'Reception Desk',
      rack: 'Floor 1',
      os_version: 'FutureSmart 5.6',
      uptime_secs: 600000,
      cpu_usage: 5.0,
      memory_usage: 22.0,
      disk_usage: 12.0,
      latency_ms: 4.5,
      packet_loss: 0.0,
      bandwidth_in_mbps: 0.2,
      bandwidth_out_mbps: 0.1,
      ports_open: '80,443,515,631,9100,161',
      last_seen: now,
    }
  ];

  const switchPorts: any[] = [];
  const portDevices = [
    { p: 1, name: 'Gi1/0/1 - To FortiGate FW', status: 'up', speed: 1000, vlan: 1, poe: 0, poe_st: 'off', conn: 'node-fw-01', rx: 820, tx: 790 },
    { p: 2, name: 'Gi1/0/2 - VM-Host-R750 Eth0', status: 'up', speed: 10000, vlan: 10, poe: 0, poe_st: 'off', conn: 'node-srv-01', rx: 340, tx: 410 },
    { p: 3, name: 'Gi1/0/3 - App-DB Server', status: 'up', speed: 10000, vlan: 10, poe: 0, poe_st: 'off', conn: 'node-srv-02', rx: 210, tx: 320 },
    { p: 4, name: 'Gi1/0/4 - Corp Storage NAS', status: 'up', speed: 10000, vlan: 10, poe: 0, poe_st: 'off', conn: 'node-nas-01', rx: 620, tx: 180 },
    { p: 5, name: 'Gi1/0/5 - Sec 32CH NVR', status: 'up', speed: 1000, vlan: 30, poe: 0, poe_st: 'off', conn: 'node-nvr-01', rx: 128, tx: 45 },
    { p: 6, name: 'Gi1/0/6 - Cam Lobby Dome', status: 'up', speed: 1000, vlan: 30, poe: 12.4, poe_st: 'active', conn: 'node-cam-01', rx: 0.1, tx: 6.2 },
    { p: 7, name: 'Gi1/0/7 - Cam ServerRoom PTZ', status: 'up', speed: 1000, vlan: 30, poe: 21.8, poe_st: 'active', conn: 'node-cam-02', rx: 0.2, tx: 8.5 },
    { p: 8, name: 'Gi1/0/8 - Cam Gate Perimeter', status: 'up', speed: 1000, vlan: 30, poe: 18.2, poe_st: 'active', conn: 'node-cam-03', rx: 0.1, tx: 12.1 },
    { p: 9, name: 'Gi1/0/9 - Floor1 Dist Switch Link', status: 'up', speed: 10000, vlan: 1, poe: 0, poe_st: 'off', conn: 'node-sw-02', rx: 180, tx: 195 },
    { p: 10, name: 'Gi1/0/10 - Reception Printer', status: 'up', speed: 1000, vlan: 20, poe: 0, poe_st: 'off', conn: 'node-prn-01', rx: 0.2, tx: 0.1 },
  ];

  for (let p = 1; p <= 24; p++) {
    const match = portDevices.find((x) => x.p === p);
    const id = `port-core-${p}`;
    const name = match ? match.name : `Gi1/0/${p} - Unassigned`;
    const status = match ? match.status : (p % 4 === 0 ? 'down' : 'up');
    const speed = match ? match.speed : 1000;
    const vlan = match ? match.vlan : 1;
    const poe = match ? match.poe : 0;
    const poe_st = match ? match.poe_st : 'off';
    const conn = match ? match.conn : null;
    const rx = match ? match.rx : (status === 'up' ? Math.random() * 20 : 0);
    const tx = match ? match.tx : (status === 'up' ? Math.random() * 15 : 0);

    switchPorts.push({
      id,
      node_id: 'node-sw-01',
      port_number: p,
      port_name: name,
      status,
      speed_mbps: speed,
      vlan,
      poe_watts: poe,
      poe_status: poe_st,
      rx_kbps: rx * 1000,
      tx_kbps: tx * 1000,
      errors: p === 8 ? 142 : 0,
      connected_device_id: conn
    });
  }

  const cameraChannels = [
    { id: 'chan-01', node_id: 'node-nvr-01', channel: 1, name: 'CH01 - Main Entrance Lobby', resolution: '4K 3840x2160', fps: 30, bitrate_kbps: 6144, motion_detected: 1, status: 'online' },
    { id: 'chan-02', node_id: 'node-nvr-01', channel: 2, name: 'CH02 - Server Room Rack A/B', resolution: '1080p 1920x1080', fps: 30, bitrate_kbps: 4096, motion_detected: 0, status: 'online' },
    { id: 'chan-03', node_id: 'node-nvr-01', channel: 3, name: 'CH03 - Perimeter Gate North', resolution: '4K 3840x2160', fps: 25, bitrate_kbps: 8192, motion_detected: 1, status: 'online' },
    { id: 'chan-04', node_id: 'node-nvr-01', channel: 4, name: 'CH04 - Loading Dock East', resolution: '1080p 1920x1080', fps: 30, bitrate_kbps: 3072, motion_detected: 0, status: 'online' },
    { id: 'chan-05', node_id: 'node-nvr-01', channel: 5, name: 'CH05 - Floor 1 Open Office', resolution: '1080p 1920x1080', fps: 20, bitrate_kbps: 2048, motion_detected: 0, status: 'online' },
    { id: 'chan-06', node_id: 'node-nvr-01', channel: 6, name: 'CH06 - Floor 2 Executive Hall', resolution: '1080p 1920x1080', fps: 20, bitrate_kbps: 2048, motion_detected: 0, status: 'online' },
    { id: 'chan-07', node_id: 'node-nvr-01', channel: 7, name: 'CH07 - Underground Parking Level -1', resolution: '1080p 1920x1080', fps: 25, bitrate_kbps: 4096, motion_detected: 1, status: 'online' },
    { id: 'chan-08', node_id: 'node-nvr-01', channel: 8, name: 'CH08 - Emergency Exit Stairwell', resolution: '720p 1280x720', fps: 15, bitrate_kbps: 1536, motion_detected: 0, status: 'online' }
  ];

  const alertRules = [
    { id: 'rule-cpu-high', name: 'Server CPU Overload (> 85%)', target_type: 'server', metric_name: 'cpu', condition: 'gt', threshold: 85, severity: 'warning', enabled: 1 },
    { id: 'rule-disk-full', name: 'Disk Capacity Critical (> 90%)', target_type: 'all', metric_name: 'disk', condition: 'gt', threshold: 90, severity: 'critical', enabled: 1 },
    { id: 'rule-lat-high', name: 'High Latency Spikes (> 15ms)', target_type: 'all', metric_name: 'latency', condition: 'gt', threshold: 15, severity: 'warning', enabled: 1 },
    { id: 'rule-pkt-loss', name: 'Packet Loss Detected (> 2%)', target_type: 'all', metric_name: 'packet_loss', condition: 'gt', threshold: 2, severity: 'critical', enabled: 1 }
  ];

  const alerts = [
    {
      id: 'alt-01',
      node_id: 'node-srv-02',
      node_name: 'App-DB-Primary',
      severity: 'critical',
      title: 'High Disk Partition Usage',
      message: 'Partition /var/log reached 91.0% disk threshold on App-DB-Primary (192.168.1.12). Clean up recommended.',
      status: 'active',
      created_at: now - 3600000
    },
    {
      id: 'alt-02',
      node_id: 'node-cam-03',
      node_name: 'Cam-Gate-Perimeter',
      severity: 'warning',
      title: 'Elevated Latency & Packet Loss',
      message: 'Network latency reached 18.5ms with 3.5% packet loss on Cam-Gate-Perimeter. Check cable connection.',
      status: 'active',
      created_at: now - 1800000
    }
  ];

  const discoveredDevices = [
    { ip: '192.168.1.108', mac: 'BC:24:11:8A:4F:90', vendor: 'Apple Inc.', hostname: 'MacBookPro-Dev01', detected_type: 'pc', open_ports: '22,5000', status: 'new', last_scanned: now },
    { ip: '192.168.1.115', mac: '00:1A:2B:3C:4D:5E', vendor: 'Raspberry Pi Foundation', hostname: 'IoT-Gateway-Floor1', detected_type: 'pc', open_ports: '22,80,1883', status: 'new', last_scanned: now },
    { ip: '192.168.1.140', mac: '70:EE:50:11:22:33', vendor: 'Grandstream Networks', hostname: 'GXP2170-IPPhone', detected_type: 'phone', open_ports: '80,5060', status: 'new', last_scanned: now },
    { ip: '192.168.1.160', mac: 'E0:63:DA:AA:BB:CC', vendor: 'Ubiquiti Networks', hostname: 'U6-Pro-AccessPoint', detected_type: 'switch', open_ports: '22,80,443,8080', status: 'new', last_scanned: now }
  ];

  const users = [DEFAULT_ADMIN];

  const settings = {
    company_name: 'Corporate HQ Network',
    default_subnet: '192.168.1.0/24',
    polling_interval: 2500,
    auth_enabled: 1,
    webhook_url: 'https://hooks.slack.com/services/demo'
  };

  const auditLogs = [
    { id: 'aud-01', user: 'admin', action: 'System Setup', details: 'Initialized NetPulse Monitoring Infrastructure', timestamp: now - 86400000 },
    { id: 'aud-02', user: 'admin', action: 'Device Added', details: 'Probed and added Core-Switch-01 (192.168.1.1)', timestamp: now - 43200000 }
  ];

  const metricHistory: any[] = [];
  for (const n of nodes) {
    for (let i = 20; i >= 0; i--) {
      const ts = now - i * 15000;
      metricHistory.push({
        id: Math.random().toString(36).substring(2),
        node_id: n.id,
        timestamp: ts,
        cpu: Math.min(100, Math.max(2, n.cpu_usage + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(5, n.memory_usage + (Math.random() * 4 - 2))),
        disk: n.disk_usage,
        latency: Math.max(0.2, n.latency_ms + (Math.random() * 2 - 1)),
        rx_mbps: n.bandwidth_in_mbps,
        tx_mbps: n.bandwidth_out_mbps
      });
    }
  }

  return { nodes, switchPorts, cameraChannels, alertRules, alerts, discoveredDevices, users, settings, auditLogs, metricHistory };
}

// In-Memory Fallback Store
class InMemoryStore {
  nodes: any[];
  switchPorts: any[];
  cameraChannels: any[];
  alertRules: any[];
  alerts: any[];
  discoveredDevices: any[];
  users: any[];
  settings: any;
  auditLogs: any[];
  sessions: Map<string, any> = new Map();
  metricHistory: any[];

  constructor() {
    const seed = buildSeedData();
    this.nodes = seed.nodes;
    this.switchPorts = seed.switchPorts;
    this.cameraChannels = seed.cameraChannels;
    this.alertRules = seed.alertRules;
    this.alerts = seed.alerts;
    this.discoveredDevices = seed.discoveredDevices;
    this.users = seed.users;
    this.settings = seed.settings;
    this.auditLogs = seed.auditLogs;
    this.metricHistory = seed.metricHistory;

    // Seed default admin token
    this.sessions.set("np_demo_token_admin", DEFAULT_ADMIN);
  }

  logAudit(user: string, action: string, details: string) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user,
      action,
      details,
      timestamp: Date.now()
    });
  }

  stepSimulation() {
    const now = Date.now();
    for (const n of this.nodes) {
      if (n.status === 'offline') continue;
      const cpuDelta = (Math.random() - 0.48) * 4;
      n.cpu_usage = Math.min(99.5, Math.max(1.5, n.cpu_usage + cpuDelta));
      const memDelta = (Math.random() - 0.49) * 2;
      n.memory_usage = Math.min(98.0, Math.max(5.0, n.memory_usage + memDelta));
      const latDelta = (Math.random() - 0.5) * 0.5;
      n.latency_ms = Math.max(0.2, n.latency_ms + latDelta);
      n.uptime_secs = (n.uptime_secs || 0) + 2;
      n.last_seen = now;

      if (n.cpu_usage > 92 || n.memory_usage > 92 || n.packet_loss > 3) {
        n.status = 'critical';
      } else if (n.cpu_usage > 80 || n.memory_usage > 85 || n.packet_loss > 1) {
        n.status = 'warning';
      } else {
        n.status = 'online';
      }

      this.metricHistory.push({
        id: Math.random().toString(36).substring(2),
        node_id: n.id,
        timestamp: now,
        cpu: n.cpu_usage,
        memory: n.memory_usage,
        disk: n.disk_usage,
        latency: n.latency_ms,
        rx_mbps: n.bandwidth_in_mbps,
        tx_mbps: n.bandwidth_out_mbps
      });
    }
  }
}

const memStore = new InMemoryStore();

// Router builder
function buildApiRouter(getStore: (c: any) => { store: any, isSql: boolean }) {
  const router = new Hono();

  // Helper to get active user from token
  const getUserFromReq = (c: any) => {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || c.req.header("X-NetPulse-Token");
    if (!token) return null;

    const { store, isSql } = getStore(c);
    if (isSql) {
      const sess = store.ctx.storage.sql.exec(`SELECT * FROM sessions WHERE token = ?`, token).one() as any;
      if (!sess) return null;
      const usr = store.ctx.storage.sql.exec(`SELECT id, username, name, role, created_at FROM users WHERE id = ?`, sess.user_id).one() as any;
      return usr;
    } else {
      return memStore.sessions.get(token) || null;
    }
  };

  // Auth Middleware
  router.use("/api/*", async (c, next) => {
    const path = c.req.path;
    // Allow public auth routes & health check
    if (
      path === "/api/auth/login" ||
      path === "/api/auth/status" ||
      path === "/api/dashboard/summary"
    ) {
      return await next();
    }

    const { store, isSql } = getStore(c);
    let authEnabled = true;

    if (isSql) {
      const st = store.ctx.storage.sql.exec(`SELECT auth_enabled FROM settings LIMIT 1`).one() as any;
      if (st && st.auth_enabled === 0) authEnabled = false;
    } else {
      if (memStore.settings && memStore.settings.auth_enabled === 0) authEnabled = false;
    }

    if (!authEnabled) {
      return await next();
    }

    const user = getUserFromReq(c);
    if (!user) {
      return c.json({ error: "Unauthorized access. Please login.", auth_required: true }, 401);
    }

    c.set("user", user);
    return await next();
  });

  // Auth Status / Info
  router.get("/api/auth/status", (c) => {
    const { store, isSql } = getStore(c);
    let authEnabled = true;
    let companyName = "Corporate HQ Network";

    if (isSql) {
      const st = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).one() as any;
      if (st) {
        authEnabled = st.auth_enabled === 1;
        companyName = st.company_name;
      }
    } else {
      authEnabled = memStore.settings.auth_enabled === 1;
      companyName = memStore.settings.company_name;
    }

    const currentUser = getUserFromReq(c);
    return c.json({ auth_enabled: authEnabled, company_name: companyName, user: currentUser });
  });

  // Login Endpoint
  router.post("/api/auth/login", async (c) => {
    const { store, isSql } = getStore(c);
    const body = await c.req.json<any>();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    let user: any = null;
    if (isSql) {
      user = store.ctx.storage.sql.exec(`SELECT * FROM users WHERE LOWER(username) = ? AND password = ?`, username, password).one() as any;
    } else {
      user = memStore.users.find((u: any) => u.username.toLowerCase() === username && u.password === password);
    }

    if (!user) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const token = `np_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const now = Date.now();

    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)`,
        token, user.id, now
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`, user.username, 'User Login', `Logged in from local console`, now
      );
    } else {
      memStore.sessions.set(token, { id: user.id, username: user.username, name: user.name, role: user.role, created_at: user.created_at });
      memStore.logAudit(user.username, 'User Login', `Logged in from local console`);
    }

    return c.json({
      ok: true,
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
  });

  // Get current user info
  router.get("/api/auth/me", (c) => {
    const user = getUserFromReq(c);
    if (!user) return c.json({ error: "Not logged in" }, 401);
    return c.json(user);
  });

  // Logout
  router.post("/api/auth/logout", (c) => {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || c.req.header("X-NetPulse-Token");
    const { store, isSql } = getStore(c);

    if (token) {
      if (isSql) {
        store.ctx.storage.sql.exec(`DELETE FROM sessions WHERE token = ?`, token);
      } else {
        memStore.sessions.delete(token);
      }
    }
    return c.json({ ok: true });
  });

  // Change Password
  router.post("/api/auth/change-password", async (c) => {
    const user = getUserFromReq(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { store, isSql } = getStore(c);
    const { old_password, new_password } = await c.req.json<any>();

    if (!new_password || new_password.length < 4) {
      return c.json({ error: "New password must be at least 4 characters long" }, 400);
    }

    if (isSql) {
      const dbUser = store.ctx.storage.sql.exec(`SELECT * FROM users WHERE id = ?`, user.id).one() as any;
      if (!dbUser || dbUser.password !== old_password) {
        return c.json({ error: "Incorrect current password" }, 400);
      }
      store.ctx.storage.sql.exec(`UPDATE users SET password = ? WHERE id = ?`, new_password, user.id);
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`, user.username, 'Password Change', `Updated account password`, Date.now()
      );
    } else {
      const dbUser = memStore.users.find((u: any) => u.id === user.id);
      if (!dbUser || dbUser.password !== old_password) {
        return c.json({ error: "Incorrect current password" }, 400);
      }
      dbUser.password = new_password;
      memStore.logAudit(user.username, 'Password Change', `Updated account password`);
    }

    return c.json({ ok: true });
  });

  // Manage Users
  router.get("/api/auth/users", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const users = store.ctx.storage.sql.exec(`SELECT id, username, name, role, created_at FROM users`).toArray();
      return c.json(users);
    } else {
      return c.json(memStore.users.map((u: any) => ({ id: u.id, username: u.username, name: u.name, role: u.role, created_at: u.created_at })));
    }
  });

  router.post("/api/auth/users", async (c) => {
    const activeUser = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json<any>();
    const id = `usr-${Date.now()}`;
    const now = Date.now();

    if (!body.username || !body.password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT INTO users (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        id, body.username, body.password, body.name || body.username, body.role || 'viewer', now
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`, activeUser?.username || 'admin', 'Create User', `Created user ${body.username} (${body.role})`, now
      );
    } else {
      memStore.users.push({
        id,
        username: body.username,
        password: body.password,
        name: body.name || body.username,
        role: body.role || 'viewer',
        created_at: now
      });
      memStore.logAudit(activeUser?.username || 'admin', 'Create User', `Created user ${body.username} (${body.role})`);
    }

    return c.json({ ok: true, id });
  });

  // Dashboard summary
  router.get("/api/dashboard/summary", (c) => {
    const { store, isSql } = getStore(c);

    if (isSql) {
      store.stepSimulation();
      const nodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray() as any[];
      const activeAlerts = store.ctx.storage.sql
        .exec(`SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC`)
        .toArray() as any[];

      const totalNodes = nodes.length;
      const onlineNodes = nodes.filter((n: any) => n.status === 'online').length;
      const warningNodes = nodes.filter((n: any) => n.status === 'warning').length;
      const criticalNodes = nodes.filter((n: any) => n.status === 'critical').length;
      const offlineNodes = nodes.filter((n: any) => n.status === 'offline').length;

      const totalBandwidthIn = nodes.reduce((sum: number, n: any) => sum + (n.bandwidth_in_mbps || 0), 0);
      const totalBandwidthOut = nodes.reduce((sum: number, n: any) => sum + (n.bandwidth_out_mbps || 0), 0);
      const avgLatency = nodes.length ? (nodes.reduce((sum: number, n: any) => sum + (n.latency_ms || 0), 0) / nodes.length) : 0;
      const avgCpu = nodes.length ? (nodes.reduce((sum: number, n: any) => sum + (n.cpu_usage || 0), 0) / nodes.length) : 0;
      const avgMemory = nodes.length ? (nodes.reduce((sum: number, n: any) => sum + (n.memory_usage || 0), 0) / nodes.length) : 0;

      return c.json({
        totalNodes,
        onlineNodes,
        warningNodes,
        criticalNodes,
        offlineNodes,
        totalBandwidthIn,
        totalBandwidthOut,
        avgLatency,
        avgCpu,
        avgMemory,
        activeAlertsCount: activeAlerts.length,
        recentAlerts: activeAlerts.slice(0, 5)
      });
    } else {
      memStore.stepSimulation();
      const nodes = memStore.nodes;
      const activeAlerts = memStore.alerts.filter((a: any) => a.status === 'active');

      const totalNodes = nodes.length;
      const onlineNodes = nodes.filter((n: any) => n.status === 'online').length;
      const warningNodes = nodes.filter((n: any) => n.status === 'warning').length;
      const criticalNodes = nodes.filter((n: any) => n.status === 'critical').length;
      const offlineNodes = nodes.filter((n: any) => n.status === 'offline').length;

      const totalBandwidthIn = nodes.reduce((sum: number, n: any) => sum + (n.bandwidth_in_mbps || 0), 0);
      const totalBandwidthOut = nodes.reduce((sum: number, n: any) => sum + (n.bandwidth_out_mbps || 0), 0);
      const avgLatency = nodes.length ? (nodes.reduce((sum: number, n: any) => sum + (n.latency_ms || 0), 0) / nodes.length) : 0;
      const avgCpu = nodes.length ? (nodes.reduce((sum: number, n: any) => sum + (n.cpu_usage || 0), 0) / nodes.length) : 0;
      const avgMemory = nodes.length ? (nodes.reduce((sum: number, n: any) => sum + (n.memory_usage || 0), 0) / nodes.length) : 0;

      return c.json({
        totalNodes,
        onlineNodes,
        warningNodes,
        criticalNodes,
        offlineNodes,
        totalBandwidthIn,
        totalBandwidthOut,
        avgLatency,
        avgCpu,
        avgMemory,
        activeAlertsCount: activeAlerts.length,
        recentAlerts: activeAlerts.slice(0, 5)
      });
    }
  });

  // Nodes API
  router.get("/api/nodes", (c) => {
    const { store, isSql } = getStore(c);
    const type = c.req.query("type");
    const status = c.req.query("status");
    const search = c.req.query("search")?.toLowerCase();

    let rows: any[] = [];
    if (isSql) {
      let sql = `SELECT * FROM nodes WHERE 1=1`;
      const params: any[] = [];
      if (type && type !== "all") {
        sql += ` AND type = ?`;
        params.push(type);
      }
      if (status && status !== "all") {
        sql += ` AND status = ?`;
        params.push(status);
      }
      rows = store.ctx.storage.sql.exec(sql, ...params).toArray() as any[];
    } else {
      rows = [...memStore.nodes];
      if (type && type !== "all") {
        rows = rows.filter((n: any) => n.type === type);
      }
      if (status && status !== "all") {
        rows = rows.filter((n: any) => n.status === status);
      }
    }

    if (search) {
      rows = rows.filter(
        (n: any) =>
          n.name.toLowerCase().includes(search) ||
          n.ip.toLowerCase().includes(search) ||
          n.vendor?.toLowerCase().includes(search) ||
          n.location?.toLowerCase().includes(search)
      );
    }

    return c.json(rows);
  });

  // Probe and add node
  router.post("/api/nodes/probe-and-add", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json<any>();
    const targetIp = (body.ip || '192.168.1.200').trim();
    const id = `node-ip-${Date.now()}`;
    const now = Date.now();

    const isCustomType = body.type && body.type !== 'auto';
    let detectedType = isCustomType ? body.type : 'server';
    let vendor = body.vendor || 'Generic Device';
    let model = body.model || 'Standard Enterprise Hardware';
    let osVersion = body.os_version || 'Embedded Linux';
    let portsOpen = body.ports_open || '22,80,161,443';
    let latency = Math.round((Math.random() * 2 + 0.5) * 10) / 10;
    let cpu = Math.round((Math.random() * 25 + 10) * 10) / 10;
    let memory = Math.round((Math.random() * 30 + 20) * 10) / 10;
    let disk = Math.round((Math.random() * 40 + 20) * 10) / 10;
    let bwIn = Math.round((Math.random() * 50 + 5) * 10) / 10;
    let bwOut = Math.round((Math.random() * 40 + 5) * 10) / 10;

    if (!isCustomType) {
      const lastOctet = parseInt(targetIp.split('.').pop() || '0', 10);
      if (lastOctet === 1 || lastOctet === 2 || lastOctet === 254) {
        detectedType = 'switch';
        vendor = 'Cisco';
        model = 'Catalyst Managed Switch';
        osVersion = 'Cisco IOS-XE 17.6';
        portsOpen = '22,80,161,443';
      } else if (lastOctet >= 100 && lastOctet <= 110) {
        detectedType = 'camera';
        vendor = 'Hikvision';
        model = 'DS-2CD 4MP Dome Camera';
        osVersion = 'V5.7 Network Camera Firmware';
        portsOpen = '80,554,8000';
        disk = 0;
      } else if (lastOctet >= 30 && lastOctet <= 40) {
        detectedType = 'nvr';
        vendor = 'Dahua';
        model = '32-Channel NVR Storage';
        osVersion = 'Embedded NVR OS v4.0';
        portsOpen = '80,554,37777';
      } else if (lastOctet >= 150 && lastOctet <= 160) {
        detectedType = 'printer';
        vendor = 'HP';
        model = 'LaserJet Network Printer';
        osVersion = 'HP FutureSmart';
        portsOpen = '80,443,9100,161';
      } else if (lastOctet > 110 && lastOctet < 150) {
        detectedType = 'pc';
        vendor = 'Dell';
        model = 'OptiPlex Workstation PC';
        osVersion = 'Windows 11 Enterprise';
        portsOpen = '135,139,445,3389';
      }
    }

    const deviceName = body.name || `${detectedType.toUpperCase()}-${targetIp.split('.').slice(-2).join('.')}`;

    const newNode = {
      id,
      name: deviceName,
      ip: targetIp,
      type: detectedType,
      status: 'online',
      vendor,
      model,
      location: body.location || 'Company Local Subnet',
      rack: body.rack || 'Rack-01',
      os_version: osVersion,
      uptime_secs: 86400,
      cpu_usage: cpu,
      memory_usage: memory,
      disk_usage: disk,
      latency_ms: latency,
      packet_loss: 0.0,
      bandwidth_in_mbps: bwIn,
      bandwidth_out_mbps: bwOut,
      snmp_version: body.snmp_version || 'v2c',
      snmp_community: body.snmp_community || 'public',
      rtsp_url: body.rtsp_url || (detectedType === 'camera' ? `rtsp://admin:pass@${targetIp}:554/live` : null),
      ports_open: portsOpen,
      last_seen: now
    };

    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, deviceName, targetIp, detectedType, 'online', vendor, model, newNode.location, newNode.rack, osVersion, 86400, cpu, memory, disk, latency, 0.0, bwIn, bwOut, newNode.snmp_version, newNode.snmp_community, newNode.rtsp_url, portsOpen, now
      );

      if (detectedType === 'switch') {
        for (let p = 1; p <= 24; p++) {
          store.ctx.storage.sql.exec(
            `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            `port-${id}-${p}`, id, p, `Port ${p}`, p % 4 === 0 ? 'down' : 'up', 1000, 1, p <= 8 ? 15.4 : 0, p <= 8 ? 'active' : 'off', 1200, 800, 0, null
          );
        }
      }

      if (detectedType === 'camera' || detectedType === 'nvr') {
        store.ctx.storage.sql.exec(
          `INSERT INTO camera_channels (id, node_id, channel, name, resolution, fps, bitrate_kbps, motion_detected, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          `chan-${id}-1`, id, 1, `Stream CH01 - ${deviceName}`, '1080p 1920x1080', 30, 4096, 0, 'online'
        );
      }

      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`, user?.username || 'admin', 'Device Added', `Added ${deviceName} (${targetIp})`, now
      );
    } else {
      memStore.nodes.push(newNode);

      if (detectedType === 'switch') {
        for (let p = 1; p <= 24; p++) {
          memStore.switchPorts.push({
            id: `port-${id}-${p}`,
            node_id: id,
            port_number: p,
            port_name: `Port ${p}`,
            status: p % 4 === 0 ? 'down' : 'up',
            speed_mbps: 1000,
            vlan: 1,
            poe_watts: p <= 8 ? 15.4 : 0,
            poe_status: p <= 8 ? 'active' : 'off',
            rx_kbps: 1200,
            tx_kbps: 800,
            errors: 0,
            connected_device_id: null
          });
        }
      }

      if (detectedType === 'camera' || detectedType === 'nvr') {
        memStore.cameraChannels.push({
          id: `chan-${id}-1`,
          node_id: id,
          channel: 1,
          name: `Stream CH01 - ${deviceName}`,
          resolution: '1080p 1920x1080',
          fps: 30,
          bitrate_kbps: 4096,
          motion_detected: 0,
          status: 'online'
        });
      }

      memStore.logAudit(user?.username || 'admin', 'Device Added', `Added ${deviceName} (${targetIp})`);
    }

    const probeDiagnostics = [
      { step: 1, title: 'ICMP Ping Reachability', result: `SUCCESS (${latency}ms round-trip to ${targetIp})` },
      { step: 2, title: 'TCP/UDP Port Discovery', result: `SUCCESS (Open Services: ${portsOpen})` },
      { step: 3, title: 'SNMP & System Handshake', result: `SUCCESS (Fingerprinted: ${vendor} ${model})` },
      { step: 4, title: 'Live Telemetry Stream', result: `ACTIVE (High-frequency metrics initialized)` }
    ];

    return c.json({
      ok: true,
      id,
      node: newNode,
      diagnostics: probeDiagnostics
    });
  });

  // Single Node detail
  router.get("/api/nodes/:id", (c) => {
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");

    if (isSql) {
      const node = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).one() as any;
      if (!node) return c.json({ error: "Node not found" }, 404);
      const history = store.ctx.storage.sql.exec(`SELECT * FROM metric_history WHERE node_id = ? ORDER BY timestamp DESC LIMIT 60`, id).toArray().reverse();
      const ports = store.ctx.storage.sql.exec(`SELECT * FROM switch_ports WHERE node_id = ? ORDER BY port_number ASC`, id).toArray();
      const cameraChannels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels WHERE node_id = ? ORDER BY channel ASC`, id).toArray();
      const nodeAlerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts WHERE node_id = ? ORDER BY created_at DESC`, id).toArray();

      return c.json({ ...node, history, ports, cameraChannels, alerts: nodeAlerts });
    } else {
      const node = memStore.nodes.find((n: any) => n.id === id);
      if (!node) return c.json({ error: "Node not found" }, 404);
      const history = memStore.metricHistory.filter((h: any) => h.node_id === id).slice(-60);
      const ports = memStore.switchPorts.filter((p: any) => p.node_id === id);
      const cameraChannels = memStore.cameraChannels.filter((cc: any) => cc.node_id === id);
      const nodeAlerts = memStore.alerts.filter((a: any) => a.node_id === id);

      return c.json({ ...node, history, ports, cameraChannels, alerts: nodeAlerts });
    }
  });

  // Delete node
  router.delete("/api/nodes/:id", (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");

    if (isSql) {
      store.ctx.storage.sql.exec(`DELETE FROM nodes WHERE id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM switch_ports WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM camera_channels WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM metric_history WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM alerts WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`, user?.username || 'admin', 'Device Deleted', `Removed device ${id}`, Date.now()
      );
    } else {
      memStore.nodes = memStore.nodes.filter((n: any) => n.id !== id);
      memStore.switchPorts = memStore.switchPorts.filter((p: any) => p.node_id !== id);
      memStore.cameraChannels = memStore.cameraChannels.filter((c: any) => c.node_id !== id);
      memStore.metricHistory = memStore.metricHistory.filter((m: any) => m.node_id !== id);
      memStore.alerts = memStore.alerts.filter((a: any) => a.node_id !== id);
      memStore.logAudit(user?.username || 'admin', 'Device Deleted', `Removed device ${id}`);
    }

    return c.json({ ok: true });
  });

  // Fault simulation
  router.post("/api/nodes/:id/simulate-fault", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    const { action } = await c.req.json<{ action: string }>();
    const now = Date.now();

    let nodeName = 'Target Node';
    if (isSql) {
      const node = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).one() as any;
      if (!node) return c.json({ error: "Node not found" }, 404);
      nodeName = node.name;

      if (action === 'cpu_spike') {
        store.ctx.storage.sql.exec(`UPDATE nodes SET cpu_usage = 98.4, status = 'critical' WHERE id = ?`, id);
        store.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`, id, nodeName, 'critical', 'Extreme CPU Spike Triggered', `CPU utilization surged to 98.4% on ${nodeName}.`, 'active', now
        );
      } else if (action === 'latency_spike') {
        store.ctx.storage.sql.exec(`UPDATE nodes SET latency_ms = 145.2, packet_loss = 12.5, status = 'warning' WHERE id = ?`, id);
        store.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`, id, nodeName, 'warning', 'High Network Latency', `Ping latency reached 145.2ms on ${nodeName}.`, 'active', now
        );
      } else if (action === 'offline') {
        store.ctx.storage.sql.exec(`UPDATE nodes SET status = 'offline' WHERE id = ?`, id);
        store.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`, id, nodeName, 'critical', 'Host Unreachable / Down', `Ping check failed for ${nodeName}.`, 'active', now
        );
      } else if (action === 'restore') {
        store.ctx.storage.sql.exec(`UPDATE nodes SET status = 'online', cpu_usage = 18.0, latency_ms = 1.2, packet_loss = 0.0 WHERE id = ?`, id);
        store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE node_id = ? AND status = 'active'`, id);
      }

      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`, user?.username || 'admin', 'Simulation Fault Triggered', `${action} on ${nodeName}`, now
      );
    } else {
      const node = memStore.nodes.find((n: any) => n.id === id);
      if (!node) return c.json({ error: "Node not found" }, 404);
      nodeName = node.name;

      if (action === 'cpu_spike') {
        node.cpu_usage = 98.4;
        node.status = 'critical';
        memStore.alerts.unshift({
          id: `alt-${now}`,
          node_id: id,
          node_name: nodeName,
          severity: 'critical',
          title: 'Extreme CPU Spike Triggered',
          message: `CPU utilization surged to 98.4% on ${nodeName}.`,
          status: 'active',
          created_at: now
        });
      } else if (action === 'latency_spike') {
        node.latency_ms = 145.2;
        node.packet_loss = 12.5;
        node.status = 'warning';
        memStore.alerts.unshift({
          id: `alt-${now}`,
          node_id: id,
          node_name: nodeName,
          severity: 'warning',
          title: 'High Network Latency',
          message: `Ping latency reached 145.2ms on ${nodeName}.`,
          status: 'active',
          created_at: now
        });
      } else if (action === 'offline') {
        node.status = 'offline';
        memStore.alerts.unshift({
          id: `alt-${now}`,
          node_id: id,
          node_name: nodeName,
          severity: 'critical',
          title: 'Host Unreachable / Down',
          message: `Ping check failed for ${nodeName}.`,
          status: 'active',
          created_at: now
        });
      } else if (action === 'restore') {
        node.status = 'online';
        node.cpu_usage = 18.0;
        node.latency_ms = 1.2;
        node.packet_loss = 0.0;
        memStore.alerts.forEach((a: any) => {
          if (a.node_id === id && a.status === 'active') a.status = 'resolved';
        });
      }

      memStore.logAudit(user?.username || 'admin', 'Simulation Fault Triggered', `${action} on ${nodeName}`);
    }

    return c.json({ ok: true });
  });

  // Switch port update
  router.put("/api/nodes/:nodeId/ports/:portId", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const portId = c.req.param("portId");
    const body = await c.req.json<any>();

    if (isSql) {
      if (body.status !== undefined) {
        store.ctx.storage.sql.exec(`UPDATE switch_ports SET status = ? WHERE id = ?`, body.status, portId);
      }
      if (body.vlan !== undefined) {
        store.ctx.storage.sql.exec(`UPDATE switch_ports SET vlan = ? WHERE id = ?`, body.vlan, portId);
      }
      if (body.poe_status !== undefined) {
        store.ctx.storage.sql.exec(`UPDATE switch_ports SET poe_status = ? WHERE id = ?`, body.poe_status, portId);
      }
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`, user?.username || 'admin', 'Port Configuration', `Updated switch port ${portId}`, Date.now()
      );
    } else {
      const port = memStore.switchPorts.find((p: any) => p.id === portId);
      if (port) {
        if (body.status !== undefined) port.status = body.status;
        if (body.vlan !== undefined) port.vlan = body.vlan;
        if (body.poe_status !== undefined) port.poe_status = body.poe_status;
      }
      memStore.logAudit(user?.username || 'admin', 'Port Configuration', `Updated switch port ${portId}`);
    }

    return c.json({ ok: true });
  });

  // Network Tools (Ping, Port Scan, Traceroute)
  router.post("/api/tools/ping", async (c) => {
    const { target, count = 4 } = await c.req.json<any>();
    const host = (target || '192.168.1.1').trim();
    const packets = Math.min(10, Math.max(1, count));
    const lines: string[] = [];

    lines.push(`PING ${host} (${host}) 56(84) bytes of data.`);
    let lost = 0;
    let minLat = 999;
    let maxLat = 0;
    let totalLat = 0;

    for (let i = 1; i <= packets; i++) {
      const isDropped = Math.random() < 0.05;
      if (isDropped) {
        lost++;
        lines.push(`Request timeout for icmp_seq ${i}`);
      } else {
        const rtt = Math.round((Math.random() * 3 + 0.4) * 10) / 10;
        minLat = Math.min(minLat, rtt);
        maxLat = Math.max(maxLat, rtt);
        totalLat += rtt;
        lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${rtt} ms`);
      }
    }

    const avgLat = packets > lost ? Math.round((totalLat / (packets - lost)) * 10) / 10 : 0;
    const lossPct = Math.round((lost / packets) * 100);

    lines.push(`--- ${host} ping statistics ---`);
    lines.push(`${packets} packets transmitted, ${packets - lost} received, ${lossPct}% packet loss, time ${packets * 1000}ms`);
    lines.push(`rtt min/avg/max = ${minLat === 999 ? 0 : minLat}/${avgLat}/${maxLat} ms`);

    return c.json({
      target: host,
      success: lossPct < 100,
      packetsSent: packets,
      packetsReceived: packets - lost,
      packetLossPct: lossPct,
      avgLatencyMs: avgLat,
      output: lines
    });
  });

  router.post("/api/tools/port-scan", async (c) => {
    const { target } = await c.req.json<any>();
    const host = (target || '192.168.1.1').trim();

    const commonPorts = [
      { port: 22, name: 'SSH' },
      { port: 53, name: 'DNS' },
      { port: 80, name: 'HTTP Web Console' },
      { port: 161, name: 'SNMP Agent' },
      { port: 443, name: 'HTTPS' },
      { port: 554, name: 'RTSP Stream' },
      { port: 3389, name: 'RDP Remote Desktop' },
      { port: 5000, name: 'Synology / Custom Web' },
      { port: 8000, name: 'Hikvision SDK' },
      { port: 8080, name: 'HTTP Proxy / Admin' }
    ];

    const results = commonPorts.map((p) => {
      const open = Math.random() > 0.4;
      return {
        port: p.port,
        name: p.name,
        state: open ? 'open' : 'closed',
        latency_ms: open ? Math.round((Math.random() * 2 + 0.5) * 10) / 10 : null
      };
    });

    return c.json({ target: host, scanned_ports: results });
  });

  router.post("/api/tools/traceroute", async (c) => {
    const { target } = await c.req.json<any>();
    const host = (target || '192.168.1.1').trim();

    const hops = [
      { hop: 1, ip: '192.168.1.254', name: 'FortiGate-Edge-FW.local', rtt1: '0.4 ms', rtt2: '0.5 ms', rtt3: '0.4 ms' },
      { hop: 2, ip: '192.168.1.1', name: 'Core-Switch-01.local', rtt1: '0.8 ms', rtt2: '0.7 ms', rtt3: '0.9 ms' },
      { hop: 3, ip: host, name: `${host}.local`, rtt1: '1.2 ms', rtt2: '1.4 ms', rtt3: '1.1 ms' }
    ];

    return c.json({ target: host, hops });
  });

  // Camera list
  router.get("/api/cameras", (c) => {
    const { store, isSql } = getStore(c);

    if (isSql) {
      const cameraNodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE type IN ('camera', 'nvr')`).toArray();
      const channels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels`).toArray();
      return c.json({ cameraNodes, channels });
    } else {
      const cameraNodes = memStore.nodes.filter((n: any) => n.type === 'camera' || n.type === 'nvr');
      const channels = memStore.cameraChannels;
      return c.json({ cameraNodes, channels });
    }
  });

  // Discovery
  router.get("/api/discovery", (c) => {
    const { store, isSql } = getStore(c);

    if (isSql) {
      const discovered = store.ctx.storage.sql.exec(`SELECT * FROM discovered_devices ORDER BY last_scanned DESC`).toArray();
      return c.json(discovered);
    } else {
      return c.json(memStore.discoveredDevices);
    }
  });

  router.post("/api/discovery/scan", async (c) => {
    const { store, isSql } = getStore(c);
    const { subnet } = await c.req.json<{ subnet: string }>();
    const now = Date.now();
    const parts = (subnet || '192.168.1.0/24').split('.')[0] ? (subnet || '192.168.1.0/24').split('.') : ['192', '168', '1', '0'];

    const newDevices = [
      { ip: `${parts[0]}.${parts[1]}.${parts[2]}.118`, mac: '52:54:00:12:34:56', vendor: 'Intel Corp', hostname: 'Win11-Workstation-18', detected_type: 'pc', open_ports: '135,445,3389', status: 'new', last_scanned: now },
      { ip: `${parts[0]}.${parts[1]}.${parts[2]}.188`, mac: '90:09:D0:FE:DC:BA', vendor: 'Dahua Technology', hostname: 'IPC-HFW2431S', detected_type: 'camera', open_ports: '80,554', status: 'new', last_scanned: now },
      { ip: `${parts[0]}.${parts[1]}.${parts[2]}.210`, mac: '00:08:9B:AA:11:22', vendor: 'QNAP Systems', hostname: 'QNAP-Backup-NAS', detected_type: 'nvr', open_ports: '80,443,8080,445', status: 'new', last_scanned: now }
    ];

    if (isSql) {
      for (const dev of newDevices) {
        store.ctx.storage.sql.exec(
          `INSERT OR REPLACE INTO discovered_devices (ip, mac, vendor, hostname, detected_type, open_ports, status, last_scanned)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          dev.ip, dev.mac, dev.vendor, dev.hostname, dev.detected_type, dev.open_ports, 'new', now
        );
      }
    } else {
      for (const dev of newDevices) {
        const existingIdx = memStore.discoveredDevices.findIndex((d: any) => d.ip === dev.ip);
        if (existingIdx >= 0) {
          memStore.discoveredDevices[existingIdx] = dev;
        } else {
          memStore.discoveredDevices.unshift(dev);
        }
      }
    }

    return c.json({ ok: true, count: newDevices.length });
  });

  router.post("/api/discovery/import", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const { ip } = await c.req.json<{ ip: string }>();

    if (isSql) {
      const dev = store.ctx.storage.sql.exec(`SELECT * FROM discovered_devices WHERE ip = ?`, ip).one() as any;
      if (dev) {
        const id = `node-imp-${Date.now()}`;
        store.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, dev.hostname || dev.ip, dev.ip, dev.detected_type || 'server', 'online', dev.vendor || 'Generic', 'Auto Discovered', 'Auto Discovered Zone', 'Unassigned', 'Unknown OS', 3600, 12.0, 35.0, 40.0, 1.8, 0.0, 5.0, 2.0, 'v2c', 'public', dev.open_ports, Date.now()
        );
        store.ctx.storage.sql.exec(`UPDATE discovered_devices SET status = 'added' WHERE ip = ?`, ip);
        store.ctx.storage.sql.exec(
          `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
          `aud-${Date.now()}`, user?.username || 'admin', 'Import Device', `Imported ${dev.ip} into inventory`, Date.now()
        );
      }
    } else {
      const dev = memStore.discoveredDevices.find((d: any) => d.ip === ip);
      if (dev) {
        dev.status = 'added';
        memStore.nodes.push({
          id: `node-imp-${Date.now()}`,
          name: dev.hostname || dev.ip,
          ip: dev.ip,
          type: dev.detected_type || 'server',
          status: 'online',
          vendor: dev.vendor || 'Generic',
          model: 'Auto Discovered',
          location: 'Auto Discovered Zone',
          rack: 'Unassigned',
          os_version: 'Unknown OS',
          uptime_secs: 3600,
          cpu_usage: 12.0,
          memory_usage: 35.0,
          disk_usage: 40.0,
          latency_ms: 1.8,
          packet_loss: 0.0,
          bandwidth_in_mbps: 5.0,
          bandwidth_out_mbps: 2.0,
          snmp_version: 'v2c',
          snmp_community: 'public',
          ports_open: dev.open_ports,
          last_seen: Date.now()
        });
        memStore.logAudit(user?.username || 'admin', 'Import Device', `Imported ${dev.ip} into inventory`);
      }
    }

    return c.json({ ok: true });
  });

  // Alerts API
  router.get("/api/alerts", (c) => {
    const { store, isSql } = getStore(c);

    if (isSql) {
      const alerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts ORDER BY created_at DESC`).toArray();
      return c.json(alerts);
    } else {
      return c.json(memStore.alerts);
    }
  });

  router.post("/api/alerts/:id/ack", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    const now = Date.now();

    if (isSql) {
      store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'acknowledged', ack_at = ?, ack_by = ? WHERE id = ?`, now, user?.username || 'Admin', id);
    } else {
      const alert = memStore.alerts.find((a: any) => a.id === id);
      if (alert) {
        alert.status = 'acknowledged';
        alert.ack_at = now;
        alert.ack_by = user?.username || 'Admin';
      }
    }

    return c.json({ ok: true });
  });

  router.post("/api/alerts/:id/resolve", (c) => {
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");

    if (isSql) {
      store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE id = ?`, id);
    } else {
      const alert = memStore.alerts.find((a: any) => a.id === id);
      if (alert) alert.status = 'resolved';
    }

    return c.json({ ok: true });
  });

  // Alert Rules
  router.get("/api/alert-rules", (c) => {
    const { store, isSql } = getStore(c);

    if (isSql) {
      const rules = store.ctx.storage.sql.exec(`SELECT * FROM alert_rules`).toArray();
      return c.json(rules);
    } else {
      return c.json(memStore.alertRules);
    }
  });

  router.post("/api/alert-rules", async (c) => {
    const { store, isSql } = getStore(c);
    const body = await c.req.json<any>();
    const id = body.id || `rule-${Date.now()}`;

    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled, webhook_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, body.name, body.target_type, body.metric_name, body.condition, body.threshold, body.severity, body.enabled ? 1 : 0, body.webhook_url || null
      );
    } else {
      const existingIdx = memStore.alertRules.findIndex((r: any) => r.id === id);
      const rule = { id, name: body.name, target_type: body.target_type, metric_name: body.metric_name, condition: body.condition, threshold: body.threshold, severity: body.severity, enabled: body.enabled ? 1 : 0, webhook_url: body.webhook_url || null };
      if (existingIdx >= 0) memStore.alertRules[existingIdx] = rule;
      else memStore.alertRules.push(rule);
    }

    return c.json({ ok: true, id });
  });

  // Topology Map
  router.get("/api/topology", (c) => {
    const { store, isSql } = getStore(c);
    let nodes: any[] = [];

    if (isSql) {
      nodes = store.ctx.storage.sql.exec(`SELECT id, name, ip, type, status, vendor, location FROM nodes`).toArray() as any[];
    } else {
      nodes = memStore.nodes.map((n: any) => ({ id: n.id, name: n.name, ip: n.ip, type: n.type, status: n.status, vendor: n.vendor, location: n.location }));
    }

    const links = [
      { source: 'node-fw-01', target: 'node-sw-01', label: '10G Fiber Trunk', status: 'active' },
      { source: 'node-sw-01', target: 'node-srv-01', label: '10G LACP Bond', status: 'active' },
      { source: 'node-sw-01', target: 'node-srv-02', label: '10G Fiber', status: 'active' },
      { source: 'node-sw-01', target: 'node-nas-01', label: '10G iSCSI', status: 'active' },
      { source: 'node-sw-01', target: 'node-sw-02', label: '10G Uplink', status: 'active' },
      { source: 'node-sw-01', target: 'node-nvr-01', label: '1G Fiber', status: 'active' },
      { source: 'node-sw-01', target: 'node-cam-01', label: '1G PoE Port 6', status: 'active' },
      { source: 'node-sw-01', target: 'node-cam-02', label: '1G PoE Port 7', status: 'active' },
      { source: 'node-sw-01', target: 'node-cam-03', label: '1G PoE Port 8', status: 'degraded' },
      { source: 'node-sw-02', target: 'node-pc-01', label: '1G Cat6 Port 12', status: 'active' },
      { source: 'node-sw-02', target: 'node-prn-01', label: '1G Cat6 Port 20', status: 'active' },
    ];

    return c.json({ nodes, links });
  });

  // System Settings
  router.get("/api/settings", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const st = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).one() as any;
      return c.json(st || { company_name: 'Corporate HQ Network', auth_enabled: 1 });
    } else {
      return c.json(memStore.settings);
    }
  });

  router.post("/api/settings", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json<any>();

    if (isSql) {
      store.ctx.storage.sql.exec(
        `UPDATE settings SET company_name = ?, default_subnet = ?, polling_interval = ?, auth_enabled = ?, webhook_url = ?`,
        body.company_name, body.default_subnet, body.polling_interval, body.auth_enabled ? 1 : 0, body.webhook_url
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`, user?.username || 'admin', 'Settings Updated', `Changed system branding & authentication rules`, Date.now()
      );
    } else {
      memStore.settings = { ...memStore.settings, ...body, auth_enabled: body.auth_enabled ? 1 : 0 };
      memStore.logAudit(user?.username || 'admin', 'Settings Updated', `Changed system branding & authentication rules`);
    }

    return c.json({ ok: true });
  });

  // Audit Logs
  router.get("/api/audit-logs", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const logs = store.ctx.storage.sql.exec(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100`).toArray();
      return c.json(logs);
    } else {
      return c.json(memStore.auditLogs.slice(0, 100));
    }
  });

  // Full Database Snapshot Export
  router.get("/api/system/export", (c) => {
    const { store, isSql } = getStore(c);

    if (isSql) {
      const nodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
      const switchPorts = store.ctx.storage.sql.exec(`SELECT * FROM switch_ports`).toArray();
      const cameraChannels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels`).toArray();
      const alerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts`).toArray();
      const alertRules = store.ctx.storage.sql.exec(`SELECT * FROM alert_rules`).toArray();
      const settings = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).one();

      return c.json({
        app: "NetPulse Enterprise",
        exported_at: Date.now(),
        data: { nodes, switchPorts, cameraChannels, alerts, alertRules, settings }
      });
    } else {
      return c.json({
        app: "NetPulse Enterprise",
        exported_at: Date.now(),
        data: {
          nodes: memStore.nodes,
          switchPorts: memStore.switchPorts,
          cameraChannels: memStore.cameraChannels,
          alerts: memStore.alerts,
          alertRules: memStore.alertRules,
          settings: memStore.settings
        }
      });
    }
  });

  // Import Backup Snapshot
  router.post("/api/system/import", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json<any>();

    if (!body || !body.data || !Array.isArray(body.data.nodes)) {
      return c.json({ error: "Invalid backup JSON format" }, 400);
    }

    const backup = body.data;

    if (isSql) {
      store.ctx.storage.sql.exec(`DELETE FROM nodes`);
      store.ctx.storage.sql.exec(`DELETE FROM switch_ports`);
      store.ctx.storage.sql.exec(`DELETE FROM camera_channels`);
      store.ctx.storage.sql.exec(`DELETE FROM alerts`);
      store.ctx.storage.sql.exec(`DELETE FROM alert_rules`);

      for (const n of backup.nodes) {
        store.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          n.id, n.name, n.ip, n.type, n.status, n.vendor, n.model, n.location, n.rack, n.os_version, n.uptime_secs, n.cpu_usage, n.memory_usage, n.disk_usage, n.latency_ms, n.packet_loss, n.bandwidth_in_mbps, n.bandwidth_out_mbps, n.snmp_version, n.snmp_community, n.rtsp_url, n.ports_open, n.last_seen || Date.now()
        );
      }

      if (Array.isArray(backup.switchPorts)) {
        for (const p of backup.switchPorts) {
          store.ctx.storage.sql.exec(
            `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            p.id, p.node_id, p.port_number, p.port_name, p.status, p.speed_mbps, p.vlan, p.poe_watts, p.poe_status, p.rx_kbps, p.tx_kbps, p.errors, p.connected_device_id
          );
        }
      }

      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`, user?.username || 'admin', 'System Restore', `Restored network inventory from backup file`, Date.now()
      );
    } else {
      memStore.nodes = backup.nodes;
      if (Array.isArray(backup.switchPorts)) memStore.switchPorts = backup.switchPorts;
      if (Array.isArray(backup.cameraChannels)) memStore.cameraChannels = backup.cameraChannels;
      if (Array.isArray(backup.alerts)) memStore.alerts = backup.alerts;
      if (Array.isArray(backup.alertRules)) memStore.alertRules = backup.alertRules;
      memStore.logAudit(user?.username || 'admin', 'System Restore', `Restored network inventory from backup file`);
    }

    return c.json({ ok: true, nodeCount: backup.nodes.length });
  });

  return router;
}

// Durable Object Class with Full SQLite Schema
export class App extends DurableObject {
  private app: Hono;
  private initialized = false;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.app = buildApiRouter(() => {
      this.initDatabase();
      return { store: this, isSql: true };
    });
  }

  private initDatabase() {
    if (this.initialized) return;

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'viewer',
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        company_name TEXT PRIMARY KEY,
        default_subnet TEXT DEFAULT '192.168.1.0/24',
        polling_interval INTEGER DEFAULT 2500,
        auth_enabled INTEGER DEFAULT 1,
        webhook_url TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        vendor TEXT,
        model TEXT,
        location TEXT,
        rack TEXT,
        os_version TEXT,
        uptime_secs INTEGER DEFAULT 86400,
        cpu_usage REAL DEFAULT 0,
        memory_usage REAL DEFAULT 0,
        disk_usage REAL DEFAULT 0,
        latency_ms REAL DEFAULT 1,
        packet_loss REAL DEFAULT 0,
        bandwidth_in_mbps REAL DEFAULT 0,
        bandwidth_out_mbps REAL DEFAULT 0,
        snmp_version TEXT DEFAULT 'v2c',
        snmp_community TEXT DEFAULT 'public',
        rtsp_url TEXT,
        ports_open TEXT,
        last_seen INTEGER
      );

      CREATE TABLE IF NOT EXISTS switch_ports (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        port_number INTEGER NOT NULL,
        port_name TEXT NOT NULL,
        status TEXT NOT NULL,
        speed_mbps INTEGER DEFAULT 1000,
        vlan INTEGER DEFAULT 1,
        poe_watts REAL DEFAULT 0,
        poe_status TEXT DEFAULT 'off',
        rx_kbps REAL DEFAULT 0,
        tx_kbps REAL DEFAULT 0,
        errors INTEGER DEFAULT 0,
        connected_device_id TEXT
      );

      CREATE TABLE IF NOT EXISTS camera_channels (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        channel INTEGER NOT NULL,
        name TEXT NOT NULL,
        resolution TEXT DEFAULT '1080p',
        fps INTEGER DEFAULT 30,
        bitrate_kbps INTEGER DEFAULT 4096,
        motion_detected INTEGER DEFAULT 0,
        status TEXT DEFAULT 'online',
        codec TEXT DEFAULT 'H.265'
      );

      CREATE TABLE IF NOT EXISTS metric_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        cpu REAL,
        memory REAL,
        disk REAL,
        latency REAL,
        rx_mbps REAL,
        tx_mbps REAL
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        node_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        ack_at INTEGER,
        ack_by TEXT
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        condition TEXT NOT NULL,
        threshold REAL NOT NULL,
        severity TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        webhook_url TEXT
      );

      CREATE TABLE IF NOT EXISTS discovered_devices (
        ip TEXT PRIMARY KEY,
        mac TEXT,
        vendor TEXT,
        hostname TEXT,
        detected_type TEXT,
        open_ports TEXT,
        status TEXT DEFAULT 'new',
        last_scanned INTEGER
      );
    `);

    const userCount = this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM users`).one()?.c as number;
    if (userCount === 0) {
      this.ctx.storage.sql.exec(
        `INSERT INTO users (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        DEFAULT_ADMIN.id, DEFAULT_ADMIN.username, DEFAULT_ADMIN.password, DEFAULT_ADMIN.name, DEFAULT_ADMIN.role, DEFAULT_ADMIN.created_at
      );
      this.ctx.storage.sql.exec(
        `INSERT INTO settings (company_name, default_subnet, polling_interval, auth_enabled, webhook_url) VALUES (?, ?, ?, ?, ?)`,
        'Corporate HQ Network', '192.168.1.0/24', 2500, 1, 'https://hooks.slack.com/services/demo'
      );
    }

    const nodeCount = this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM nodes`).one()?.c as number;
    if (nodeCount === 0) {
      const seed = buildSeedData();
      for (const n of seed.nodes) {
        this.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          n.id, n.name, n.ip, n.type, n.status, n.vendor, n.model, n.location, n.rack, n.os_version, n.uptime_secs, n.cpu_usage, n.memory_usage, n.disk_usage, n.latency_ms, n.packet_loss, n.bandwidth_in_mbps, n.bandwidth_out_mbps, n.snmp_version, n.snmp_community, n.rtsp_url || null, n.ports_open, n.last_seen
        );
      }
      for (const p of seed.switchPorts) {
        this.ctx.storage.sql.exec(
          `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          p.id, p.node_id, p.port_number, p.port_name, p.status, p.speed_mbps, p.vlan, p.poe_watts, p.poe_status, p.rx_kbps, p.tx_kbps, p.errors, p.connected_device_id
        );
      }
      for (const c of seed.cameraChannels) {
        this.ctx.storage.sql.exec(
          `INSERT INTO camera_channels (id, node_id, channel, name, resolution, fps, bitrate_kbps, motion_detected, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          c.id, c.node_id, c.channel, c.name, c.resolution, c.fps, c.bitrate_kbps, c.motion_detected, c.status
        );
      }
      for (const r of seed.alertRules) {
        this.ctx.storage.sql.exec(
          `INSERT INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          r.id, r.name, r.target_type, r.metric_name, r.condition, r.threshold, r.severity, r.enabled
        );
      }
      for (const a of seed.alerts) {
        this.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          a.id, a.node_id, a.node_name, a.severity, a.title, a.message, a.status, a.created_at
        );
      }
      for (const d of seed.discoveredDevices) {
        this.ctx.storage.sql.exec(
          `INSERT INTO discovered_devices (ip, mac, vendor, hostname, detected_type, open_ports, status, last_scanned)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          d.ip, d.mac, d.vendor, d.hostname, d.detected_type, d.open_ports, d.status, d.last_scanned
        );
      }
    }

    this.initialized = true;
  }

  stepSimulation() {
    this.initDatabase();
    const now = Date.now();
    const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray() as any[];

    for (const n of nodes) {
      if (n.status === 'offline') continue;
      const cpuDelta = (Math.random() - 0.48) * 4;
      let newCpu = Math.min(99.5, Math.max(1.5, n.cpu_usage + cpuDelta));
      const memDelta = (Math.random() - 0.49) * 2;
      let newMem = Math.min(98.0, Math.max(5.0, n.memory_usage + memDelta));
      const latDelta = (Math.random() - 0.5) * 0.5;
      let newLat = Math.max(0.2, n.latency_ms + latDelta);
      const newUptime = n.uptime_secs + 2;

      let newStatus = n.status;
      if (newCpu > 92 || newMem > 92 || n.packet_loss > 3) {
        newStatus = 'critical';
      } else if (newCpu > 80 || newMem > 85 || n.packet_loss > 1) {
        newStatus = 'warning';
      } else {
        newStatus = 'online';
      }

      this.ctx.storage.sql.exec(
        `UPDATE nodes SET cpu_usage = ?, memory_usage = ?, latency_ms = ?, status = ?, uptime_secs = ?, last_seen = ? WHERE id = ?`,
        newCpu, newMem, newLat, newStatus, newUptime, now, n.id
      );

      this.ctx.storage.sql.exec(
        `INSERT INTO metric_history (node_id, timestamp, cpu, memory, disk, latency, rx_mbps, tx_mbps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        n.id, now, newCpu, newMem, n.disk_usage, newLat, n.bandwidth_in_mbps, n.bandwidth_out_mbps
      );
    }
  }

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade === "websocket") {
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return this.app.fetch(request);
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    this.stepSimulation();
    const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
    ws.send(JSON.stringify({ type: 'TELEMETRY_TICK', timestamp: Date.now(), nodes }));
  }

  webSocketClose(_ws: WebSocket, _code: number, _reason: string, _wasClean: boolean) {}
}

// Fallback Hono App instance for direct worker execution
const fallbackApp = buildApiRouter(() => ({ store: memStore, isSql: false }));

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Try Durable Object first if bound
    if (env && env.NETPULSE_DO) {
      try {
        const id = env.NETPULSE_DO.idFromName("global");
        const stub = env.NETPULSE_DO.get(id);
        return await stub.fetch(request);
      } catch (e) {
        console.error("Durable Object invocation error, using worker fallback API:", e);
      }
    }

    // Direct Worker API fallback for /api/* endpoints
    if (url.pathname.startsWith("/api/")) {
      return fallbackApp.fetch(request, env, ctx);
    }

    // Default response for unmapped paths
    return new Response("Not found", { status: 404 });
  }
};
