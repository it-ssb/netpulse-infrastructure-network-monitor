import { Hono } from "hono";
import { Store, hashPassword, verifyPassword } from './store.ts';
// Router builder
export function buildApiRouter(store: Store) {
  const getStore = (_c: any) => ({ store });
  const router = new Hono<{ Variables: { user: any } }>();

  // Helper to get active user from token
  const getUserFromReq = (c: any) => {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || c.req.header("X-NetPulse-Token");
    if (!token) return null;

    const { store } = getStore(c);
    
      const sess = store.ctx.storage.sql.exec(`SELECT * FROM sessions WHERE token = ? AND expires_at > ?`, token, Date.now()).toArray()[0] as any;
      if (!sess) return null;
      const usr = store.ctx.storage.sql.exec(`SELECT id, username, name, role, created_at FROM users WHERE id = ?`, sess.user_id).toArray()[0] as any;
      return usr;
    
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

    const { store } = getStore(c);
    let authEnabled = true;

    
      const st = store.ctx.storage.sql.exec(`SELECT auth_enabled FROM settings LIMIT 1`).toArray()[0] as any;
      if (st && st.auth_enabled === 0) authEnabled = false;
    

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

  router.use('/api/*', async (c, next) => {
    const adminOnly = c.req.path.startsWith('/api/system/') || c.req.path === '/api/auth/users' || (c.req.path === '/api/settings' && c.req.method !== 'GET');
    if (adminOnly && getUserFromReq(c)?.role !== 'admin') return c.json({error:'Administrator required'},403);
    if (!['GET','HEAD'].includes(c.req.method) && getUserFromReq(c)?.role === 'viewer' && !c.req.path.startsWith('/api/auth/')) return c.json({error:'Operator required'},403);
    await next();
  });

  // Auth Status / Info
  router.get("/api/auth/status", (c) => {
    const { store } = getStore(c);
    let authEnabled = true;
    let companyName = "Corporate HQ Network";

    
      const st = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).toArray()[0] as any;
      if (st) {
        authEnabled = st.auth_enabled === 1;
        companyName = st.company_name;
      }
    

    const currentUser = getUserFromReq(c);
    return c.json({ auth_enabled: authEnabled, company_name: companyName, user: currentUser, setup_required: store.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM users`).toArray()[0].c === 0 });
  });

  // Login Endpoint
  router.post("/api/auth/login", async (c) => {
    const { store } = getStore(c);
    const count = store.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM users`).toArray()[0].c;
    if (count === 0) return c.json({ error: "Set NETPULSE_ADMIN_PASSWORD on the server to bootstrap an administrator.", code: "SETUP_REQUIRED" }, 503);
    const body = await c.req.json<any>();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    let user: any = null;
    
      user = store.ctx.storage.sql.exec(`SELECT * FROM users WHERE LOWER(username) = ?`, username).toArray()[0] as any;
    

    if (!user || !verifyPassword(password, user.password)) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const token = `np_token_${Date.now()}_${crypto.randomUUID()}`;
    const now = Date.now();

    
      store.ctx.storage.sql.exec(
        `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
        token, user.id, now, now + 86400000
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${crypto.randomUUID()}`, user.username, 'User Login', `Logged in from local console`, now
      );
    

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
    const { store } = getStore(c);

    if (token) {
      
        store.ctx.storage.sql.exec(`DELETE FROM sessions WHERE token = ? AND expires_at > ?`, token, Date.now());
      
    }
    return c.json({ ok: true });
  });

  // Change Password
  router.post("/api/auth/change-password", async (c) => {
    const user = getUserFromReq(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { store } = getStore(c);
    const { old_password, new_password } = await c.req.json<any>();

    if (!new_password || new_password.length < 12) {
      return c.json({ error: "New password must be at least 12 characters long" }, 400);
    }

    
      const dbUser = store.ctx.storage.sql.exec(`SELECT * FROM users WHERE id = ?`, user.id).toArray()[0] as any;
      if (!dbUser || !verifyPassword(old_password, dbUser.password)) {
        return c.json({ error: "Incorrect current password" }, 400);
      }
      store.ctx.storage.sql.exec(`UPDATE users SET password = ? WHERE id = ?`, hashPassword(new_password), user.id);
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${crypto.randomUUID()}`, user.username, 'Password Change', `Updated account password`, Date.now()
      );
    

    return c.json({ ok: true });
  });

  // Manage Users
  router.get("/api/auth/users", (c) => {
    const { store } = getStore(c);
    
      const users = store.ctx.storage.sql.exec(`SELECT id, username, name, role, created_at FROM users`).toArray();
      return c.json(users);
    
  });

  router.post("/api/auth/users", async (c) => {
    const activeUser = getUserFromReq(c);
    const { store } = getStore(c);
    const body = await c.req.json<any>();
    const id = `usr-${crypto.randomUUID()}`;
    const now = Date.now();

    if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.password.length < 12) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    
      store.ctx.storage.sql.exec(
        `INSERT INTO users (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        id, body.username, hashPassword(body.password), body.name || body.username, body.role || 'viewer', now
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${crypto.randomUUID()}`, activeUser?.username || 'admin', 'Create User', `Created user ${body.username} (${body.role})`, now
      );
    

    return c.json({ ok: true, id });
  });

  // Dashboard summary
  router.get("/api/dashboard/summary", (c) => {
    const { store } = getStore(c);

    

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
    
  });

  // Nodes API
  router.get("/api/nodes", (c) => {
    const { store } = getStore(c);
    const type = c.req.query("type");
    const status = c.req.query("status");
    const search = c.req.query("search")?.toLowerCase();

    let rows: any[] = [];
    
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
    const { store } = getStore(c);
    const id = c.req.param("id");

    
      const node = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).toArray()[0] as any;
      if (!node) return c.json({ error: "Node not found" }, 404);
      const history = store.ctx.storage.sql.exec(`SELECT * FROM metric_history WHERE node_id = ? ORDER BY timestamp DESC LIMIT 60`, id).toArray().reverse();
      const ports = store.ctx.storage.sql.exec(`SELECT * FROM switch_ports WHERE node_id = ? ORDER BY port_number ASC`, id).toArray();
      const cameraChannels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels WHERE node_id = ? ORDER BY channel ASC`, id).toArray();
      const nodeAlerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts WHERE node_id = ? ORDER BY created_at DESC`, id).toArray();

      return c.json({ ...node, history, ports, cameraChannels, alerts: nodeAlerts });
    
  });

  router.post('/api/nodes', async c => {
    try { return c.json({ ok: true, id: store.createDevice(await c.req.json(), getUserFromReq(c)?.username ?? 'operator') }, 201); }
    catch { return c.json({ error: 'Invalid or conflicting device configuration' }, 400); }
  });
  router.delete('/api/nodes/:id', c => store.deleteDevice(c.req.param('id'), getUserFromReq(c)?.username ?? 'operator') ? c.json({ok:true}) : c.json({error:'Node not found'},404));

  // Fault simulation
  router.post("/api/nodes/:id/simulate-fault", (c) => c.json({
    error: "This operation is unavailable until its production implementation is complete.",
    code: "NOT_IMPLEMENTED"
  }, 501));

  router.put('/api/nodes/:nodeId/ports/:portId', async c => {
    const nodeId=c.req.param('nodeId'), portId=c.req.param('portId');
    if (!store.db.prepare('SELECT id FROM switch_ports WHERE id=? AND node_id=?').get(portId,nodeId)) return c.json({error:'Interface not found'},404);
    const body = await c.req.json();
    if (!body || Object.keys(body).some(k=> !['port_name','vlan'].includes(k)) || ('vlan' in body && (!Number.isInteger(body.vlan) || body.vlan<1 || body.vlan>4094)) || ('port_name' in body && typeof body.port_name!=='string')) return c.json({error:'Invalid interface configuration'},400);
    store.transaction(() => {
      for (const k of Object.keys(body)) store.db.prepare(`UPDATE switch_ports SET ${k}=? WHERE id=? AND node_id=?`).run(body[k],portId,nodeId);
      store.audit(getUserFromReq(c)?.username ?? 'operator','Interface Updated',portId);
    });
    return c.json({ok:true});
  });

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
    const { store } = getStore(c);

    
      const cameraNodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE type IN ('camera', 'nvr')`).toArray();
      const channels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels`).toArray();
      return c.json({ cameraNodes, channels });
    
  });

  // Discovery
  router.get("/api/discovery", (c) => {
    const { store } = getStore(c);

    
      const discovered = store.ctx.storage.sql.exec(`SELECT * FROM discovered_devices ORDER BY last_scanned DESC`).toArray();
      return c.json(discovered);
    
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
    const { store } = getStore(c);

    
      const alerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts ORDER BY created_at DESC`).toArray();
      return c.json(alerts);
    
  });

  router.post("/api/alerts/:id/ack", async (c) => {
    const user = getUserFromReq(c);
    const { store } = getStore(c);
    const id = c.req.param("id");
    if (!store.db.prepare("SELECT id FROM alerts WHERE id=?").get(id)) return c.json({error:"Alert not found"},404);
    const now = Date.now();

    
      store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'acknowledged', ack_at = ?, ack_by = ? WHERE id = ?`, now, user?.username || 'Admin', id);
    

    return c.json({ ok: true });
  });

  router.post("/api/alerts/:id/resolve", (c) => {
    const { store } = getStore(c);
    const id = c.req.param("id");

    
      if (!store.db.prepare("SELECT id FROM alerts WHERE id=?").get(id)) return c.json({error:"Alert not found"},404);
      store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE id = ?`, id);
    

    return c.json({ ok: true });
  });

  // Alert Rules
  router.get("/api/alert-rules", (c) => {
    const { store } = getStore(c);

    
      const rules = store.ctx.storage.sql.exec(`SELECT * FROM alert_rules`).toArray();
      return c.json(rules);
    
  });

  router.post("/api/alert-rules", async (c) => {
    const { store } = getStore(c);
    const body = await c.req.json<any>();
    const id = body.id || `rule-${crypto.randomUUID()}`;

    
      store.ctx.storage.sql.exec(
        `INSERT INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled, webhook_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,target_type=excluded.target_type,metric_name=excluded.metric_name,condition=excluded.condition,threshold=excluded.threshold,severity=excluded.severity,enabled=excluded.enabled`,
        id, body.name, body.target_type, body.metric_name, body.condition, body.threshold, body.severity, body.enabled ? 1 : 0, null
      );
    

    return c.json({ ok: true, id });
  });

  // Topology Map
  router.get("/api/topology", (c) => {
    const { store } = getStore(c);
    let nodes: any[] = [];

    
      nodes = store.ctx.storage.sql.exec(`SELECT id, name, ip, type, status, vendor, location FROM nodes`).toArray() as any[];
    

    const links: any[] = [];

    return c.json({ nodes, links });
  });

  // System Settings
  router.get("/api/settings", (c) => {
    const { store } = getStore(c);
    
      const st = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).toArray()[0] as any;
      return c.json(st || { company_name: 'Corporate HQ Network', auth_enabled: 1 });
    
  });

  router.post('/api/settings', async c => {
    try { store.updateSettings(await c.req.json(), getUserFromReq(c)?.username ?? 'operator'); return c.json({ok:true}); }
    catch { return c.json({error:'Invalid settings update'},400); }
  });
  // Audit Logs
  router.get("/api/audit-logs", (c) => {
    const { store } = getStore(c);
    
      const logs = store.ctx.storage.sql.exec(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100`).toArray();
      return c.json(logs);
    
  });

  router.post('/api/measurements', async c => {
    if (!['admin','operator'].includes(getUserFromReq(c)?.role)) return c.json({error:'Operator required'},403);
    try { return c.json({id:store.recordMeasurement(await c.req.json())},201); }
    catch { return c.json({error:'Invalid measurement'},400); }
  });
  router.get('/api/monitors/:id/history', c => {
    if (!store.db.prepare('SELECT id FROM monitor_definitions WHERE id=?').get(c.req.param('id'))) return c.json({error:'Monitor not found'},404);
    try { return c.json(store.history(c.req.param('id'),Number(c.req.query('from') ?? 0),Number(c.req.query('to') ?? Date.now()),Number(c.req.query('limit') ?? 1000))); }
    catch { return c.json({error:'Invalid history query'},400); }
  });

  router.get('/api/system/export', c => c.json(store.snapshot()));
  router.post('/api/system/import', async c => {
    try { store.restore(await c.req.json()); return c.json({ok:true}); }
    catch { return c.json({error:'Invalid or incompatible backup; live data unchanged'},400); }
  });

  return router;
}

