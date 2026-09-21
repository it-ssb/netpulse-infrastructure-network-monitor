import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

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
    this.nodes = [];
    this.switchPorts = [];
    this.cameraChannels = [];
    this.alertRules = [];
    this.alerts = [];
    this.discoveredDevices = [];
    this.users = [];
    this.settings = { company_name: 'NetPulse', default_subnet: '', polling_interval: 2500, auth_enabled: 1, webhook_url: null };
    this.auditLogs = [];
    this.metricHistory = [];
  }

  logAudit(user: string, action: string, details: string) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${crypto.randomUUID()}`,
      user,
      action,
      details,
      timestamp: Date.now()
    });
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

  // Auth Middleware only for /api/* routes
  router.use("/api/*", async (c, next) => {
    const path = c.req.path;
    // Allow public auth routes & summary check
    if (
      path.endsWith("/api/auth/login") ||
      path.endsWith("/api/auth/status") ||
      path.endsWith("/api/dashboard/summary")
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
    return c.json({ auth_enabled: authEnabled, company_name: companyName, user: currentUser, setup_required: isSql ? store.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM users`).one().c === 0 : memStore.users.length === 0 });
  });

  // Login Endpoint
  router.post("/api/auth/login", async (c) => {
    const { store, isSql } = getStore(c);
    const count = isSql ? store.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM users`).one().c : memStore.users.length;
    if (count === 0) return c.json({ error: "Administrator setup is not implemented yet. Demo access has been removed.", code: "SETUP_REQUIRED" }, 503);
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

    const token = `np_token_${Date.now()}_${crypto.randomUUID()}`;
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
  router.post("/api/nodes/probe-and-add", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

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
  router.post("/api/nodes/:id/simulate-fault", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

  router.put("/api/nodes/:nodeId/ports/:portId", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

  router.post("/api/tools/ping", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

  router.post("/api/tools/port-scan", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

  router.post("/api/tools/traceroute", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

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

  router.post("/api/discovery/scan", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

  router.post("/api/discovery/import", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

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

    const links: any[] = [];

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
  router.post("/api/system/import", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

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

    const settingsCount = this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM settings`).one().c;
    if (settingsCount === 0) {
      this.ctx.storage.sql.exec(
        `INSERT INTO settings (company_name, default_subnet, polling_interval, auth_enabled, webhook_url) VALUES (?, ?, ?, ?, ?)`,
        'NetPulse', '', 2500, 1, null
      );
    }

    this.initialized = true;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return Response.json({ error: "Telemetry streaming is not implemented", code: "NOT_IMPLEMENTED" }, { status: 501 });
    }
    return this.app.fetch(request);
  }
}

// Fallback Hono App instance for direct worker execution
const fallbackApp = buildApiRouter(() => ({ store: memStore, isSql: false }));

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route /api/* requests or websocket upgrades to the Durable Object or Hono API router
    if (url.pathname.includes("/api/") || request.headers.get("Upgrade") === "websocket") {
      if (env && env.NETPULSE_DO) {
        try {
          const id = env.NETPULSE_DO.idFromName("global");
          const stub = env.NETPULSE_DO.get(id);
          return await stub.fetch(request);
        } catch (e) {
          console.error("Durable Object invocation error, using worker fallback API:", e);
        }
      }
      return fallbackApp.fetch(request, env, ctx);
    }

    // Serve static assets via Cloudflare Workers Asset binding
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
