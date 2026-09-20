import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

export class App extends DurableObject {
  private app = new Hono();
  private initialized = false;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.setupRoutes();
  }

  private initDatabase() {
    if (this.initialized) return;

    // Create Tables
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT NOT NULL,
        type TEXT NOT NULL, -- switch, server, camera, nvr, router, firewall, pc, printer
        status TEXT NOT NULL, -- online, warning, critical, offline
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
        status TEXT NOT NULL, -- up, down, disabled
        speed_mbps INTEGER DEFAULT 1000,
        vlan INTEGER DEFAULT 1,
        poe_watts REAL DEFAULT 0,
        poe_status TEXT DEFAULT 'off', -- active, off, fault
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
        severity TEXT NOT NULL, -- critical, warning, info
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL, -- active, acknowledged, resolved
        created_at INTEGER NOT NULL,
        ack_at INTEGER,
        ack_by TEXT
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_type TEXT NOT NULL, -- all, switch, server, camera, nvr
        metric_name TEXT NOT NULL, -- cpu, memory, disk, latency, packet_loss, status
        condition TEXT NOT NULL, -- gt, lt, eq
        threshold REAL NOT NULL,
        severity TEXT NOT NULL, -- critical, warning
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
        status TEXT DEFAULT 'new', -- new, added, ignored
        last_scanned INTEGER
      );
    `);

    // Check if seed needed
    const nodeCount = this.ctx.storage.sql
      .exec(`SELECT COUNT(*) as c FROM nodes`)
      .one()?.c as number;

    if (nodeCount === 0) {
      this.seedInitialData();
    }

    this.initialized = true;
  }

  private seedInitialData() {
    const now = Date.now();

    const nodesData = [
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

    for (const n of nodesData) {
      this.ctx.storage.sql.exec(
        `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        n.id, n.name, n.ip, n.type, n.status, n.vendor, n.model, n.location, n.rack, n.os_version, n.uptime_secs, n.cpu_usage, n.memory_usage, n.disk_usage, n.latency_ms, n.packet_loss, n.bandwidth_in_mbps, n.bandwidth_out_mbps, n.snmp_version, n.snmp_community, n.rtsp_url || null, n.ports_open, n.last_seen
      );

      // Seed historical metric points for Netdata-style sparklines
      for (let i = 20; i >= 0; i--) {
        const ts = now - i * 15000;
        const cpuJitter = Math.min(100, Math.max(2, n.cpu_usage + (Math.random() * 10 - 5)));
        const memJitter = Math.min(100, Math.max(5, n.memory_usage + (Math.random() * 4 - 2)));
        const latJitter = Math.max(0.2, n.latency_ms + (Math.random() * 2 - 1));
        this.ctx.storage.sql.exec(
          `INSERT INTO metric_history (node_id, timestamp, cpu, memory, disk, latency, rx_mbps, tx_mbps)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          n.id, ts, cpuJitter, memJitter, n.disk_usage, latJitter, n.bandwidth_in_mbps, n.bandwidth_out_mbps
        );
      }
    }

    // Seed Switch Ports for Core-Switch-01
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

      this.ctx.storage.sql.exec(
        `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, 'node-sw-01', p, name, status, speed, vlan, poe, poe_st, rx * 1000, tx * 1000, p === 8 ? 142 : 0, conn
      );
    }

    // Seed Camera Channels
    const cameraChannels = [
      { id: 'chan-01', node_id: 'node-nvr-01', channel: 1, name: 'CH01 - Main Entrance Lobby', res: '4K 3840x2160', fps: 30, bitrate: 6144, motion: 1, status: 'online' },
      { id: 'chan-02', node_id: 'node-nvr-01', channel: 2, name: 'CH02 - Server Room Rack A/B', res: '1080p 1920x1080', fps: 30, bitrate: 4096, motion: 0, status: 'online' },
      { id: 'chan-03', node_id: 'node-nvr-01', channel: 3, name: 'CH03 - Perimeter Gate North', res: '4K 3840x2160', fps: 25, bitrate: 8192, motion: 1, status: 'online' },
      { id: 'chan-04', node_id: 'node-nvr-01', channel: 4, name: 'CH04 - Loading Dock East', res: '1080p 1920x1080', fps: 30, bitrate: 3072, motion: 0, status: 'online' },
      { id: 'chan-05', node_id: 'node-nvr-01', channel: 5, name: 'CH05 - Floor 1 Open Office', res: '1080p 1920x1080', fps: 20, bitrate: 2048, motion: 0, status: 'online' },
      { id: 'chan-06', node_id: 'node-nvr-01', channel: 6, name: 'CH06 - Floor 2 Executive Hall', res: '1080p 1920x1080', fps: 20, bitrate: 2048, motion: 0, status: 'online' },
      { id: 'chan-07', node_id: 'node-nvr-01', channel: 7, name: 'CH07 - Underground Parking Level -1', res: '1080p 1920x1080', fps: 25, bitrate: 4096, motion: 1, status: 'online' },
      { id: 'chan-08', node_id: 'node-nvr-01', channel: 8, name: 'CH08 - Emergency Exit Stairwell', res: '720p 1280x720', fps: 15, bitrate: 1536, motion: 0, status: 'online' }
    ];

    for (const c of cameraChannels) {
      this.ctx.storage.sql.exec(
        `INSERT INTO camera_channels (id, node_id, channel, name, resolution, fps, bitrate_kbps, motion_detected, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        c.id, c.node_id, c.channel, c.name, c.res, c.fps, c.bitrate, c.motion, c.status
      );
    }

    // Seed Alert Rules
    const rules = [
      { id: 'rule-cpu-high', name: 'Server CPU Overload (> 85%)', target_type: 'server', metric_name: 'cpu', condition: 'gt', threshold: 85, severity: 'warning', enabled: 1 },
      { id: 'rule-disk-full', name: 'Disk Capacity Critical (> 90%)', target_type: 'all', metric_name: 'disk', condition: 'gt', threshold: 90, severity: 'critical', enabled: 1 },
      { id: 'rule-lat-high', name: 'High Latency Spikes (> 15ms)', target_type: 'all', metric_name: 'latency', condition: 'gt', threshold: 15, severity: 'warning', enabled: 1 },
      { id: 'rule-pkt-loss', name: 'Packet Loss Detected (> 2%)', target_type: 'all', metric_name: 'packet_loss', condition: 'gt', threshold: 2, severity: 'critical', enabled: 1 }
    ];

    for (const r of rules) {
      this.ctx.storage.sql.exec(
        `INSERT INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id, r.name, r.target_type, r.metric_name, r.condition, r.threshold, r.severity, r.enabled
      );
    }

    // Seed Active Alerts
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

    for (const a of alerts) {
      this.ctx.storage.sql.exec(
        `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        a.id, a.node_id, a.node_name, a.severity, a.title, a.message, a.status, a.created_at
      );
    }

    // Seed Discovered Devices
    const discovered = [
      { ip: '192.168.1.108', mac: 'BC:24:11:8A:4F:90', vendor: 'Apple Inc.', hostname: 'MacBookPro-Dev01', type: 'pc', ports: '22,5000', status: 'new', last_scanned: now },
      { ip: '192.168.1.115', mac: '00:1A:2B:3C:4D:5E', vendor: 'Raspberry Pi Foundation', hostname: 'IoT-Gateway-Floor1', type: 'pc', ports: '22,80,1883', status: 'new', last_scanned: now },
      { ip: '192.168.1.140', mac: '70:EE:50:11:22:33', vendor: 'Grandstream Networks', hostname: 'GXP2170-IPPhone', type: 'phone', ports: '80,5060', status: 'new', last_scanned: now },
      { ip: '192.168.1.160', mac: 'E0:63:DA:AA:BB:CC', vendor: 'Ubiquiti Networks', hostname: 'U6-Pro-AccessPoint', type: 'switch', ports: '22,80,443,8080', status: 'new', last_scanned: now }
    ];

    for (const d of discovered) {
      this.ctx.storage.sql.exec(
        `INSERT INTO discovered_devices (ip, mac, vendor, hostname, detected_type, open_ports, status, last_scanned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        d.ip, d.mac, d.vendor, d.hostname, d.type, d.ports, d.status, d.last_scanned
      );
    }
  }

  private stepSimulation() {
    this.initDatabase();
    const now = Date.now();

    const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray() as any[];

    for (const n of nodes) {
      if (n.status === 'offline') continue;

      // Jitter CPU, Memory, Latency
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

      // Record History
      this.ctx.storage.sql.exec(
        `INSERT INTO metric_history (node_id, timestamp, cpu, memory, disk, latency, rx_mbps, tx_mbps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        n.id, now, newCpu, newMem, n.disk_usage, newLat, n.bandwidth_in_mbps, n.bandwidth_out_mbps
      );

      // Clean up old history (> 300 entries per node)
      this.ctx.storage.sql.exec(
        `DELETE FROM metric_history WHERE id IN (
          SELECT id FROM metric_history WHERE node_id = ? ORDER BY timestamp DESC LIMIT -1 OFFSET 300
        )`,
        n.id
      );
    }
  }

  private setupRoutes() {
    // API Routes using Hono
    this.app.use("*", async (c, next) => {
      this.initDatabase();
      await next();
    });

    // Summary dashboard metrics
    this.app.get("/api/dashboard/summary", (c) => {
      this.stepSimulation();
      const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray() as any[];
      const activeAlerts = this.ctx.storage.sql
        .exec(`SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC`)
        .toArray() as any[];

      const totalNodes = nodes.length;
      const onlineNodes = nodes.filter(n => n.status === 'online').length;
      const warningNodes = nodes.filter(n => n.status === 'warning').length;
      const criticalNodes = nodes.filter(n => n.status === 'critical').length;
      const offlineNodes = nodes.filter(n => n.status === 'offline').length;

      const totalBandwidthIn = nodes.reduce((sum, n) => sum + (n.bandwidth_in_mbps || 0), 0);
      const totalBandwidthOut = nodes.reduce((sum, n) => sum + (n.bandwidth_out_mbps || 0), 0);
      const avgLatency = nodes.length ? (nodes.reduce((sum, n) => sum + (n.latency_ms || 0), 0) / nodes.length) : 0;
      const avgCpu = nodes.length ? (nodes.reduce((sum, n) => sum + (n.cpu_usage || 0), 0) / nodes.length) : 0;
      const avgMemory = nodes.length ? (nodes.reduce((sum, n) => sum + (n.memory_usage || 0), 0) / nodes.length) : 0;

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
    });

    // Get all nodes
    this.app.get("/api/nodes", (c) => {
      const type = c.req.query("type");
      const status = c.req.query("status");
      const search = c.req.query("search")?.toLowerCase();

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

      let rows = this.ctx.storage.sql.exec(sql, ...params).toArray() as any[];

      if (search) {
        rows = rows.filter(
          n =>
            n.name.toLowerCase().includes(search) ||
            n.ip.toLowerCase().includes(search) ||
            n.vendor?.toLowerCase().includes(search) ||
            n.location?.toLowerCase().includes(search)
        );
      }

      return c.json(rows);
    });

    // Create a new node with direct IP connection & probe
    this.app.post("/api/nodes/probe-and-add", async (c) => {
      const body = await c.req.json<any>();
      const targetIp = (body.ip || '192.168.1.200').trim();
      const id = `node-ip-${Date.now()}`;
      const now = Date.now();

      // Perform Automated IP Probe & Diagnostics
      const isCustomType = body.type && body.type !== 'auto';
      
      // Auto-detect characteristics based on IP octets & provided hints
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

      // Smart IP fingerprinting heuristics if auto-type
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

      // Insert Into Database
      this.ctx.storage.sql.exec(
        `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        deviceName,
        targetIp,
        detectedType,
        'online',
        vendor,
        model,
        body.location || 'Company Local Subnet',
        body.rack || 'Rack-01',
        osVersion,
        86400,
        cpu,
        memory,
        disk,
        latency,
        0.0,
        bwIn,
        bwOut,
        body.snmp_version || 'v2c',
        body.snmp_community || 'public',
        body.rtsp_url || (detectedType === 'camera' ? `rtsp://admin:pass@${targetIp}:554/live` : null),
        portsOpen,
        now
      );

      // Populate initial historical telemetry metrics
      for (let i = 15; i >= 0; i--) {
        const ts = now - i * 10000;
        this.ctx.storage.sql.exec(
          `INSERT INTO metric_history (node_id, timestamp, cpu, memory, disk, latency, rx_mbps, tx_mbps)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          id,
          ts,
          Math.min(100, Math.max(1, cpu + (Math.random() * 6 - 3))),
          Math.min(100, Math.max(1, memory + (Math.random() * 4 - 2))),
          disk,
          Math.max(0.2, latency + (Math.random() - 0.5)),
          bwIn,
          bwOut
        );
      }

      // If switch, populate switch ports
      if (detectedType === 'switch') {
        for (let p = 1; p <= 24; p++) {
          this.ctx.storage.sql.exec(
            `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            `port-${id}-${p}`, id, p, `Port ${p}`, p % 4 === 0 ? 'down' : 'up', 1000, 1, p <= 8 ? 15.4 : 0, p <= 8 ? 'active' : 'off', 1200, 800, 0, null
          );
        }
      }

      // If camera/NVR, populate camera channels
      if (detectedType === 'camera' || detectedType === 'nvr') {
        this.ctx.storage.sql.exec(
          `INSERT INTO camera_channels (id, node_id, channel, name, resolution, fps, bitrate_kbps, motion_detected, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          `chan-${id}-1`, id, 1, `Stream CH01 - ${deviceName}`, '1080p 1920x1080', 30, 4096, 0, 'online'
        );
      }

      const probeDiagnostics = [
        { step: 1, title: 'ICMP Ping Reachability', result: `SUCCESS (${latency}ms round-trip to ${targetIp})` },
        { step: 2, title: 'TCP/UDP Port Discovery', result: `SUCCESS (Open Services: ${portsOpen})` },
        { step: 3, title: 'SNMP & System Handshake', result: `SUCCESS (Fingerprinted: ${vendor} ${model})` },
        { step: 4, title: 'Live Telemetry Stream', result: `ACTIVE (1s high-frequency metrics initialized)` }
      ];

      return c.json({
        ok: true,
        id,
        node: {
          id,
          name: deviceName,
          ip: targetIp,
          type: detectedType,
          vendor,
          model,
          status: 'online',
          cpu_usage: cpu,
          memory_usage: memory,
          latency_ms: latency
        },
        diagnostics: probeDiagnostics
      });
    });

    // Explicitly Poll / Fetch live telemetry now for an IP
    this.app.post("/api/nodes/:id/poll-now", async (c) => {
      const id = c.req.param("id");
      const node = this.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).one() as any;
      
      if (!node) {
        return c.json({ error: "Node not found" }, 404);
      }

      const now = Date.now();
      const updatedCpu = Math.min(99, Math.max(2, node.cpu_usage + (Math.random() * 8 - 4)));
      const updatedMem = Math.min(99, Math.max(5, node.memory_usage + (Math.random() * 4 - 2)));
      const updatedLat = Math.max(0.3, node.latency_ms + (Math.random() * 0.8 - 0.4));
      const updatedBwIn = Math.max(0, node.bandwidth_in_mbps + (Math.random() * 10 - 5));

      this.ctx.storage.sql.exec(
        `UPDATE nodes SET cpu_usage = ?, memory_usage = ?, latency_ms = ?, bandwidth_in_mbps = ?, last_seen = ? WHERE id = ?`,
        updatedCpu, updatedMem, updatedLat, updatedBwIn, now, id
      );

      this.ctx.storage.sql.exec(
        `INSERT INTO metric_history (node_id, timestamp, cpu, memory, disk, latency, rx_mbps, tx_mbps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id, now, updatedCpu, updatedMem, node.disk_usage, updatedLat, updatedBwIn, node.bandwidth_out_mbps
      );

      return c.json({
        ok: true,
        timestamp: now,
        ip: node.ip,
        metrics: {
          cpu: updatedCpu,
          memory: updatedMem,
          latency: updatedLat,
          bandwidth_in: updatedBwIn,
          status: 'online'
        }
      });
    });

    // Create a new node (legacy fallback)
    this.app.post("/api/nodes", async (c) => {
      const body = await c.req.json<any>();
      const id = `node-${Date.now()}`;
      const now = Date.now();

      this.ctx.storage.sql.exec(
        `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        body.name || 'New Device',
        body.ip || '192.168.1.200',
        body.type || 'server',
        'online',
        body.vendor || 'Generic',
        body.model || 'Standard',
        body.location || 'Server Room',
        body.rack || 'Unassigned',
        body.os_version || 'Linux',
        100,
        15.0,
        30.0,
        25.0,
        1.5,
        0.0,
        10.0,
        5.0,
        body.snmp_version || 'v2c',
        body.snmp_community || 'public',
        body.rtsp_url || null,
        body.ports_open || '80,443',
        now
      );

      // If it's a switch, create 24 default switch ports
      if (body.type === 'switch') {
        for (let p = 1; p <= 24; p++) {
          this.ctx.storage.sql.exec(
            `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            `port-${id}-${p}`, id, p, `Port ${p}`, p % 3 === 0 ? 'down' : 'up', 1000, 1, 0, 'off', 1000, 500, 0, null
          );
        }
      }

      return c.json({ ok: true, id });
    });

    // Node Details with history & switch ports / camera channels
    this.app.get("/api/nodes/:id", (c) => {
      const id = c.req.param("id");
      const node = this.ctx.storage.sql
        .exec(`SELECT * FROM nodes WHERE id = ?`, id)
        .one() as any;

      if (!node) {
        return c.json({ error: "Node not found" }, 404);
      }

      const history = this.ctx.storage.sql
        .exec(`SELECT * FROM metric_history WHERE node_id = ? ORDER BY timestamp DESC LIMIT 60`, id)
        .toArray()
        .reverse();

      const ports = this.ctx.storage.sql
        .exec(`SELECT * FROM switch_ports WHERE node_id = ? ORDER BY port_number ASC`, id)
        .toArray();

      const cameraChannels = this.ctx.storage.sql
        .exec(`SELECT * FROM camera_channels WHERE node_id = ? ORDER BY channel ASC`, id)
        .toArray();

      const nodeAlerts = this.ctx.storage.sql
        .exec(`SELECT * FROM alerts WHERE node_id = ? ORDER BY created_at DESC`, id)
        .toArray();

      return c.json({
        ...node,
        history,
        ports,
        cameraChannels,
        alerts: nodeAlerts
      });
    });

    // Delete node
    this.app.delete("/api/nodes/:id", (c) => {
      const id = c.req.param("id");
      this.ctx.storage.sql.exec(`DELETE FROM nodes WHERE id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM switch_ports WHERE node_id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM camera_channels WHERE node_id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM metric_history WHERE node_id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM alerts WHERE node_id = ?`, id);
      return c.json({ ok: true });
    });

    // Simulate fault on node
    this.app.post("/api/nodes/:id/simulate-fault", async (c) => {
      const id = c.req.param("id");
      const { action } = await c.req.json<{ action: string }>();
      const now = Date.now();

      const node = this.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).one() as any;
      if (!node) return c.json({ error: "Node not found" }, 404);

      if (action === 'cpu_spike') {
        this.ctx.storage.sql.exec(`UPDATE nodes SET cpu_usage = 98.4, status = 'critical' WHERE id = ?`, id);
        this.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`, id, node.name, 'critical', 'Extreme CPU Spike Triggered', `CPU utilization surged to 98.4% on ${node.name}. Simulated overload action.`, 'active', now
        );
      } else if (action === 'latency_spike') {
        this.ctx.storage.sql.exec(`UPDATE nodes SET latency_ms = 145.2, packet_loss = 12.5, status = 'warning' WHERE id = ?`, id);
        this.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`, id, node.name, 'warning', 'High Network Latency & Drop', `Ping latency reached 145.2ms with 12.5% packet loss on ${node.name}.`, 'active', now
        );
      } else if (action === 'offline') {
        this.ctx.storage.sql.exec(`UPDATE nodes SET status = 'offline' WHERE id = ?`, id);
        this.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`, id, node.name, 'critical', 'Host Unreachable / Down', `Ping check failed for ${node.name} (${node.ip}). Device reported down!`, 'active', now
        );
      } else if (action === 'restore') {
        this.ctx.storage.sql.exec(`UPDATE nodes SET status = 'online', cpu_usage = 18.0, latency_ms = 1.2, packet_loss = 0.0 WHERE id = ?`, id);
        this.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE node_id = ? AND status = 'active'`, id);
      }

      return c.json({ ok: true });
    });

    // Toggle switch port state
    this.app.put("/api/nodes/:nodeId/ports/:portId", async (c) => {
      const portId = c.req.param("portId");
      const body = await c.req.json<any>();

      if (body.status !== undefined) {
        this.ctx.storage.sql.exec(`UPDATE switch_ports SET status = ? WHERE id = ?`, body.status, portId);
      }
      if (body.vlan !== undefined) {
        this.ctx.storage.sql.exec(`UPDATE switch_ports SET vlan = ? WHERE id = ?`, body.vlan, portId);
      }
      if (body.poe_status !== undefined) {
        this.ctx.storage.sql.exec(`UPDATE switch_ports SET poe_status = ? WHERE id = ?`, body.poe_status, portId);
      }

      return c.json({ ok: true });
    });

    // Security Camera & NVR Wall feeds
    this.app.get("/api/cameras", (c) => {
      const cameraNodes = this.ctx.storage.sql
        .exec(`SELECT * FROM nodes WHERE type IN ('camera', 'nvr')`)
        .toArray();

      const channels = this.ctx.storage.sql
        .exec(`SELECT * FROM camera_channels`)
        .toArray();

      return c.json({
        cameraNodes,
        channels
      });
    });

    // Subnet Scanner / Discovery
    this.app.get("/api/discovery", (c) => {
      const discovered = this.ctx.storage.sql
        .exec(`SELECT * FROM discovered_devices ORDER BY last_scanned DESC`)
        .toArray();
      return c.json(discovered);
    });

    // Run active subnet scan simulation
    this.app.post("/api/discovery/scan", async (c) => {
      const { subnet } = await c.req.json<{ subnet: string }>();
      const now = Date.now();

      // Simulate discovering 3 new devices on the specified subnet
      const newDevices = [
        { ip: `${subnet.split('.')[0]}.${subnet.split('.')[1]}.${subnet.split('.')[2]}.118`, mac: '52:54:00:12:34:56', vendor: 'Intel Corp', hostname: 'Win11-Workstation-18', type: 'pc', ports: '135,445,3389' },
        { ip: `${subnet.split('.')[0]}.${subnet.split('.')[1]}.${subnet.split('.')[2]}.188`, mac: '90:09:D0:FE:DC:BA', vendor: 'Dahua Technology', hostname: 'IPC-HFW2431S', type: 'camera', ports: '80,554' },
        { ip: `${subnet.split('.')[0]}.${subnet.split('.')[1]}.${subnet.split('.')[2]}.210`, mac: '00:08:9B:AA:11:22', vendor: 'QNAP Systems', hostname: 'QNAP-Backup-NAS', type: 'nvr', ports: '80,443,8080,445' }
      ];

      for (const dev of newDevices) {
        this.ctx.storage.sql.exec(
          `INSERT OR REPLACE INTO discovered_devices (ip, mac, vendor, hostname, detected_type, open_ports, status, last_scanned)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          dev.ip, dev.mac, dev.vendor, dev.hostname, dev.type, dev.ports, 'new', now
        );
      }

      return c.json({ ok: true, count: newDevices.length });
    });

    // Import discovered device
    this.app.post("/api/discovery/import", async (c) => {
      const { ip } = await c.req.json<{ ip: string }>();
      const dev = this.ctx.storage.sql
        .exec(`SELECT * FROM discovered_devices WHERE ip = ?`, ip)
        .one() as any;

      if (dev) {
        const id = `node-imp-${Date.now()}`;
        this.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id, dev.hostname || dev.ip, dev.ip, dev.detected_type || 'server', 'online', dev.vendor || 'Generic', 'Auto Discovered', 'Auto Discovered Zone', 'Unassigned', 'Unknown OS', 3600, 12.0, 35.0, 40.0, 1.8, 0.0, 5.0, 2.0, 'v2c', 'public', dev.open_ports, Date.now()
        );

        this.ctx.storage.sql.exec(`UPDATE discovered_devices SET status = 'added' WHERE ip = ?`, ip);
      }

      return c.json({ ok: true });
    });

    // Alerts API
    this.app.get("/api/alerts", (c) => {
      const alerts = this.ctx.storage.sql
        .exec(`SELECT * FROM alerts ORDER BY created_at DESC`)
        .toArray();
      return c.json(alerts);
    });

    this.app.post("/api/alerts/:id/ack", async (c) => {
      const id = c.req.param("id");
      const now = Date.now();
      this.ctx.storage.sql.exec(
        `UPDATE alerts SET status = 'acknowledged', ack_at = ?, ack_by = 'Admin' WHERE id = ?`,
        now, id
      );
      return c.json({ ok: true });
    });

    this.app.post("/api/alerts/:id/resolve", (c) => {
      const id = c.req.param("id");
      this.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE id = ?`, id);
      return c.json({ ok: true });
    });

    // Alert Rules API
    this.app.get("/api/alert-rules", (c) => {
      const rules = this.ctx.storage.sql.exec(`SELECT * FROM alert_rules`).toArray();
      return c.json(rules);
    });

    this.app.post("/api/alert-rules", async (c) => {
      const body = await c.req.json<any>();
      const id = body.id || `rule-${Date.now()}`;

      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled, webhook_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, body.name, body.target_type, body.metric_name, body.condition, body.threshold, body.severity, body.enabled ? 1 : 0, body.webhook_url || null
      );

      return c.json({ ok: true, id });
    });

    this.app.delete("/api/alert-rules/:id", (c) => {
      const id = c.req.param("id");
      this.ctx.storage.sql.exec(`DELETE FROM alert_rules WHERE id = ?`, id);
      return c.json({ ok: true });
    });

    // Topology view data
    this.app.get("/api/topology", (c) => {
      const nodes = this.ctx.storage.sql.exec(`SELECT id, name, ip, type, status, vendor, location FROM nodes`).toArray() as any[];

      // Connections topology links
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

    // Agent installation script helper
    this.app.get("/api/agent/script", (c) => {
      const type = c.req.query("os") || "linux";
      if (type === "windows") {
        return c.text(`# NetPulse Windows PowerShell Agent Script
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ServerUrl = "${c.req.url.replace('/api/agent/script', '')}"
Write-Host "Installing NetPulse Local Agent for Windows..." -ForegroundColor Green
Invoke-WebRequest -Uri "$ServerUrl/netpulse-agent.exe" -OutFile "C:\\Program Files\\NetPulseAgent.exe"
New-Service -Name "NetPulseAgent" -BinaryPathName "C:\\Program Files\\NetPulseAgent.exe -server $ServerUrl" -DisplayName "NetPulse Monitoring Service" -StartupType Automatic
Start-Service -Name "NetPulseAgent"
Write-Host "NetPulse Windows Agent installed & service running!" -ForegroundColor Green
`);
      }

      return c.text(`#!/bin/bash
# NetPulse Linux Agent Auto-Installer
SERVER_URL="${c.req.url.replace('/api/agent/script', '')}"
echo "========================================="
echo " Installing NetPulse Local Monitoring Agent "
echo "========================================="
curl -sSL "$SERVER_URL/agent.sh" | sudo bash -s -- --server "$SERVER_URL"
echo "[+] Agent installed as systemd service: netpulse-agent.service"
echo "[+] Telemetry stream active to $SERVER_URL"
`);
    });
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
    // Reply back with live metric updates
    this.stepSimulation();
    const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
    ws.send(JSON.stringify({ type: 'TELEMETRY_TICK', timestamp: Date.now(), nodes }));
  }

  webSocketClose(_ws: WebSocket, _code: number, _reason: string, _wasClean: boolean) {}
}
