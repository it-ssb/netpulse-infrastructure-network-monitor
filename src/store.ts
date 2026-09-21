import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomUUID, randomBytes, createCipheriv, createDecipheriv, scryptSync, timingSafeEqual } from 'node:crypto';

const migrations = ['001_initial.sql','002_security.sql'].map(name => readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8')); 
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, hash: string) {
  const [kind, salt, expected] = hash.split(':');
  if (kind !== 'scrypt' || !salt || !expected || expected.length !== 128) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, 'hex'));
}
export class Store {
  db: DatabaseSync;
  ctx: any;
  constructor(path: string, options: { staging?: boolean } = {}) {
    if (!path || ((path === ':memory:' || path.includes('mode=memory')) && !options.staging)) throw new Error('A persistent SQLite file path is required');
    this.db = new DatabaseSync(path);
    try {
      this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
      const version = Number(this.db.prepare('PRAGMA user_version').get()!.user_version);
      if (version > migrations.length) throw new Error('Unsupported database schema version');
      if (version === 0) {
        if (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").get()) throw new Error('Unversioned database: export and migrate explicitly before startup');
      }
      for (let i=version; i<migrations.length; i++) this.transaction(() => { this.db.exec(migrations[i]); this.db.exec(`PRAGMA user_version=${i+1}`); });
      this.ctx = { storage: { sql: { exec: (sql: string, ...params: any[]) => {
        const stmt = this.db.prepare(sql);
        const rows = stmt.columns().length ? stmt.all(...params) : (stmt.run(...params), []);
        return { toArray: () => rows };
      } } } };
    } catch (e) { this.db.close(); throw e; }
  }
  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  audit(user: string, action: string, details: string) {
    this.db.prepare('INSERT INTO audit_logs VALUES (?,?,?,?,?)').run(randomUUID(), user, action, details, Date.now());
  }
  tables(): string[] {
    return this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => String(r.name));
  }
  snapshot() {
    return this.transaction(() => ({ format: 'netpulse-sqlite', version: 2, exported_at: Date.now(), data: Object.fromEntries(this.tables().map(t => [t, this.db.prepare(`SELECT * FROM "${t}"`).all()])) }));
  }
  private load(data: any) {
    this.db.exec('PRAGMA defer_foreign_keys=ON');
    // Clear children first; deferred constraints also allow arbitrary insert order.
    for (const t of this.tables().reverse()) this.db.exec(`DELETE FROM "${t}"`);
    for (const t of this.tables()) {
      const columns = this.db.prepare(`PRAGMA table_info("${t}")`).all().map(r => String(r.name));
      const insert = this.db.prepare(`INSERT INTO "${t}" (${columns.map(c => `"${c}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
      for (const row of data[t]) {
        if (!row || Array.isArray(row) || Object.keys(row).sort().join() !== [...columns].sort().join()) throw new Error(`Invalid columns in ${t}`);
        insert.run(...columns.map(c => row[c]));
      }
    }
    if (this.db.prepare("SELECT m.id FROM measurements m JOIN monitor_definitions d ON d.id=m.monitor_id WHERE m.quality='good' AND ((d.semantics='counter') != (m.counter_value IS NOT NULL)) LIMIT 1").get()) throw new Error('Invalid measurement semantics');
    if (this.db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Invalid backup references');
    if (this.db.prepare('SELECT count(*) AS n FROM settings').get()!.n !== 1) throw new Error('Backup must contain singleton settings');
  }
  restore(snapshot: any) {
    if (snapshot?.format !== 'netpulse-sqlite' || snapshot.version !== 2 || !snapshot.data || Object.keys(snapshot.data).sort().join() !== this.tables().sort().join()) throw new Error('Unsupported or incomplete backup');
    for (const t of this.tables()) if (!Array.isArray(snapshot.data[t])) throw new Error(`Invalid table ${t}`);
    const stage = new Store(':memory:', { staging: true });
    try { stage.transaction(() => stage.load(snapshot.data)); }
    finally { stage.db.close(); }
    this.transaction(() => this.load(snapshot.data));
  }
  updateSettings(patch: any, user: string) {
    const allowed = ['company_name','default_subnet','polling_interval','auth_enabled','webhook_url'];
    if (!patch || Array.isArray(patch) || typeof patch !== 'object' || Object.keys(patch).some(k => !allowed.includes(k))) throw new Error('Unknown settings field');
    if ('auth_enabled' in patch) {
      if (![true,1].includes(patch.auth_enabled)) throw new Error('Invalid auth_enabled');
      patch = { ...patch, auth_enabled: Number(patch.auth_enabled) };
    }
    for (const k of ['company_name','default_subnet']) if (k in patch && (typeof patch[k] !== 'string' || (k === 'company_name' && !patch[k].trim()))) throw new Error(`Invalid ${k}`);
    if ('polling_interval' in patch && (!Number.isSafeInteger(patch.polling_interval) || patch.polling_interval < 1000)) throw new Error('Invalid polling_interval');
    if ('webhook_url' in patch && patch.webhook_url !== null && patch.webhook_url !== '') throw new Error('Store notification credentials using credential references');
    this.transaction(() => {
      const keys = Object.keys(patch);
      if (keys.length) this.db.prepare(`UPDATE settings SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=1`).run(...keys.map(k => patch[k]));
      this.audit(user, 'Settings Updated', 'Updated system settings');
    });
  }
  createDevice(input: any, user: string) {
    const allowed = ['site_id','name','ip','type','vendor','model','location','credential_id'];
    if (!input || Object.keys(input).some(k => !allowed.includes(k)) || ['name','ip','type'].some(k => typeof input[k] !== 'string' || !input[k].trim())) throw new Error('Invalid device configuration');
    const id = randomUUID(), now = Date.now();
    this.transaction(() => {
      this.db.prepare('INSERT INTO nodes (id,site_id,name,ip,type,vendor,model,location,credential_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,input.site_id ?? 'default',input.name,input.ip,input.type,input.vendor ?? null,input.model ?? null,input.location ?? null,input.credential_id ?? null,now,now);
      this.audit(user, 'Device Created', id);
    });
    return id;
  }
  deleteDevice(id: string, user: string) {
    return this.transaction(() => {
      const result = this.db.prepare('DELETE FROM nodes WHERE id=?').run(id);
      if (!result.changes) return false;
      this.audit(user, 'Device Deleted', id);
      return true;
    });
  }
  putSecret(id: string, plaintext: string, key: Buffer, keyId: string) {
    const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm',key,nonce);
    cipher.setAAD(Buffer.from(id));
    const ciphertext = Buffer.concat([cipher.update(plaintext,'utf8'),cipher.final()]);
    this.db.prepare('INSERT INTO encrypted_secrets VALUES (?,?,?,?,?) ON CONFLICT(credential_id) DO UPDATE SET key_id=excluded.key_id,nonce=excluded.nonce,ciphertext=excluded.ciphertext,tag=excluded.tag').run(id,keyId,nonce.toString('hex'),ciphertext.toString('hex'),cipher.getAuthTag().toString('hex'));
  }
  readSecret(id: string, key: Buffer): string {
    const row: any = this.db.prepare('SELECT * FROM encrypted_secrets WHERE credential_id=?').get(id);
    if (!row) throw new Error('Credential not found');
    const decipher = createDecipheriv('aes-256-gcm',key,Buffer.from(row.nonce,'hex'));
    decipher.setAAD(Buffer.from(id)); decipher.setAuthTag(Buffer.from(row.tag,'hex'));
    return Buffer.concat([decipher.update(Buffer.from(row.ciphertext,'hex')),decipher.final()]).toString('utf8');
  }
  recordMeasurement(input: any) {
    const now = Date.now();
    if (!input || Object.keys(input).some(k => !['monitor_id','observed_at','quality','source','value','counter_value'].includes(k))) throw new Error('Invalid measurement fields');
    if (!Number.isSafeInteger(input.observed_at) || input.observed_at < now - 7*86400000 || input.observed_at > now + 300000) throw new Error('Observation outside accepted time window');
    if (input.value != null && (typeof input.value !== 'number' || !Number.isFinite(input.value))) throw new Error('Invalid gauge');
    if (input.counter_value != null && (typeof input.counter_value !== 'string' || !/^(0|[1-9][0-9]{0,19})$/.test(input.counter_value) || BigInt(input.counter_value) > 18446744073709551615n)) throw new Error('Invalid uint64 counter');
    const id = randomUUID();
    this.db.prepare('INSERT INTO measurements VALUES (?,?,?,?,?,?,?,?)').run(id,input.monitor_id,input.observed_at,now,input.quality,input.source,input.value ?? null,input.counter_value ?? null);
    return id;
  }
  history(monitorId: string, from: number, to: number, limit=1000) {
    if (![from,to,limit].every(Number.isSafeInteger) || from < 0 || to < from || limit < 1 || limit > 1000) throw new Error('Invalid history range');
    return this.db.prepare('SELECT m.*,d.units,d.semantics,d.collector_id FROM measurements m JOIN monitor_definitions d ON d.id=m.monitor_id WHERE m.monitor_id=? AND m.observed_at>=? AND m.observed_at<? ORDER BY m.observed_at DESC LIMIT ?').all(monitorId,from,to,limit);
  }
  retain(now = Date.now()) {
    const day = 86400000;
    this.transaction(() => {
      for (const resolution of [60000,3600000]) {
        this.db.prepare(`INSERT INTO metric_aggregates SELECT monitor_id,CAST(observed_at / ? AS INTEGER)*?, ?,count(*),min(value),max(value),sum(value) FROM measurements WHERE quality='good' AND value IS NOT NULL AND observed_at>=? AND observed_at<? GROUP BY monitor_id,CAST(observed_at / ? AS INTEGER) ON CONFLICT(monitor_id,resolution_ms,bucket_ms) DO UPDATE SET samples=excluded.samples,minimum=excluded.minimum,maximum=excluded.maximum,total=excluded.total`).run(resolution,resolution,resolution,0,Math.floor(now/resolution)*resolution,resolution);
      }
      // Delete complete hour buckets only so repeated aggregation never overwrites a partial bucket.
      this.db.prepare('DELETE FROM measurements WHERE observed_at<?').run(Math.floor((now-7*day)/3600000)*3600000);
      this.db.prepare('DELETE FROM metric_aggregates WHERE bucket_ms<? AND resolution_ms=60000').run(now-30*day);
      this.db.prepare('DELETE FROM metric_aggregates WHERE bucket_ms<? AND resolution_ms=3600000').run(now-365*day);
      this.db.prepare('DELETE FROM state_transitions WHERE observed_at<?').run(now-365*day);
      this.db.prepare('DELETE FROM audit_logs WHERE timestamp<?').run(now-365*day);
      this.db.prepare('DELETE FROM alerts WHERE status=\'resolved\' AND created_at<?').run(now-365*day);
      this.db.prepare('DELETE FROM sessions WHERE expires_at<=? OR last_seen<?').run(now,now-1800000);
      this.db.prepare('DELETE FROM auth_throttle WHERE window_start<?').run(now-900000);
    });
  }
}
