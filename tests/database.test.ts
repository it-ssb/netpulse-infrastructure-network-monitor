import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Store, hashPassword } from '../src/store.ts';
import { buildApiRouter } from '../src/api.ts';

function fixture(t: any) {
  const dir = mkdtempSync(join(tmpdir(),'netpulse-'));
  const path = join(dir,'test.sqlite');
  let store = new Store(path);
  t.after(() => { if (store.db.isOpen) store.db.close(); rmSync(dir,{recursive:true,force:true}); });
  return { get store() { return store; }, reopen() { store.db.close(); store = new Store(path); return store; } };
}
function device(s: Store, ip='192.0.2.1', site_id='default') { return s.createDevice({name:'Switch',ip,type:'switch',site_id},'test'); }
function monitor(s: Store, node: string, semantics='gauge', metric='latency') {
  s.db.prepare('INSERT OR IGNORE INTO collectors VALUES (?,?,?,?)').run('collector','default','Collector',Date.now());
  const id=crypto.randomUUID();
  s.db.prepare('INSERT INTO monitor_definitions (id,site_id,node_id,collector_id,metric_name,units,semantics,interval_ms,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id,'default',node,'collector',metric,semantics==='counter'?'bytes':'ms',semantics,15000,Date.now());
  return id;
}
function sample(s: Store,m: string,at: number,value: number|null=10,counter: string|null=null) {
  s.db.prepare('INSERT INTO measurements VALUES (?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),m,at,Date.now(),'good','snmp',value,counter);
}
function admin(s: Store) {
  s.db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run('admin','admin',hashPassword('test-password'),'Admin','admin',Date.now());
  s.db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run('token','admin',Date.now(),Date.now()+60000);
  return {Authorization:'Bearer token','Content-Type':'application/json'};
}
test('file persistence, migration version, empty inventory survives restart, no memory fallback', t => {
  const f=fixture(t); const id=device(f.store); f.reopen();
  assert.equal(f.store.db.prepare('SELECT count(*) n FROM nodes').get()!.n,1);
  assert.equal(f.store.db.prepare('PRAGMA user_version').get()!.user_version,1);
  f.store.deleteDevice(id,'test'); f.reopen();
  assert.equal(f.store.db.prepare('SELECT count(*) n FROM nodes').get()!.n,0);
  assert.throws(()=>new Store(':memory:'));
  assert.throws(()=>new Store(join(tmpdir(),'does-not-exist-netpulse','db.sqlite')));
});
test('site-scoped identity, cross-site references and transactional rollback',t=>{
  const {store:s}=fixture(t); const id=device(s);
  assert.throws(()=>device(s));
  s.db.prepare('INSERT INTO sites VALUES (?,?,?)').run('other','Other',Date.now());
  device(s,'192.0.2.1','other');
  s.db.prepare('INSERT INTO credential_references VALUES (?,?,?,?,?)').run('secret','other','SNMP','snmp',Date.now());
  assert.throws(()=>s.createDevice({name:'Bad',ip:'192.0.2.2',type:'switch',credential_id:'secret'},'test'));
  s.db.exec("CREATE TRIGGER reject_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'injected audit failure'); END");
  assert.throws(()=>s.deleteDevice(id,'test'));
  assert.ok(s.db.prepare('SELECT id FROM nodes WHERE id=?').get(id));
});
test('partial settings and not-found routes use real database', async t=>{
  const {store:s}=fixture(t); const headers=admin(s), app=buildApiRouter(s);
  assert.equal((await app.request('/api/settings',{method:'POST',headers,body:JSON.stringify({company_name:'Changed'})})).status,200);
  const settings:any=await (await app.request('/api/settings',{headers})).json();
  assert.equal(settings.auth_enabled,1); assert.equal(settings.polling_interval,2500);
  assert.equal((await app.request('/api/settings',{method:'POST',headers,body:JSON.stringify({polling_interval:null})})).status,400);
  for (const [method,path] of [['GET','/api/nodes/missing'],['DELETE','/api/nodes/missing'],['POST','/api/alerts/missing/ack'],['POST','/api/alerts/missing/resolve']]) assert.equal((await app.request(path,{method,headers})).status,404);
  assert.equal((await app.request('/api/auth/login',{method:'POST',headers,body:JSON.stringify({username:'missing',password:'bad'})})).status,401);
  assert.equal((await app.request('/api/system/export')).status,401);
});
test('complete backup restores every table and invalid imports leave live data unchanged',t=>{
  const {store:s}=fixture(t); admin(s); const id=device(s), m=monitor(s,id); sample(s,m,Date.now());
  s.db.prepare('INSERT INTO credential_references VALUES (?,?,?,?,?)').run('cred','default','SNMP','snmp',Date.now());
  const key=randomBytes(32); s.putSecret('cred','private-community',key,'key-1');
  s.db.prepare('INSERT INTO switch_ports (id,node_id,port_number,port_name) VALUES (?,?,?,?)').run('port',id,1,'eth1');
  s.db.prepare('INSERT INTO camera_channels (id,node_id,channel,name) VALUES (?,?,?,?)').run('camera',id,1,'Channel');
  s.db.prepare('INSERT INTO state_transitions VALUES (?,?,?,?,?,?)').run('transition',m,'unknown','up',Date.now(),Date.now());
  s.db.prepare('INSERT INTO alert_rules (id,name,target_type,metric_name,condition,threshold,severity) VALUES (?,?,?,?,?,?,?)').run('rule','Latency','switch','latency','>',10,'warning');
  s.db.prepare('INSERT INTO alerts (id,node_id,rule_id,node_name,severity,title,message,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run('incident',id,'rule','Switch','warning','Latency','High latency','active',Date.now());
  s.db.prepare('INSERT INTO notifications (id,incident_id,channel,status,created_at) VALUES (?,?,?,?,?)').run('notification','incident','email','pending',Date.now());
  s.db.prepare('INSERT INTO discovered_devices (id,ip,last_scanned) VALUES (?,?,?)').run('discovered','192.0.2.3',Date.now());
  s.db.prepare('INSERT INTO metric_aggregates VALUES (?,?,?,?,?,?,?)').run(m,Math.floor(Date.now()/60000)*60000,60000,1,10,10,10);
  const snapshot=s.snapshot();
  assert.ok(!JSON.stringify(snapshot).includes('private-community'));
  s.deleteDevice(id,'test'); s.restore(snapshot);
  assert.deepEqual(s.snapshot().data,snapshot.data);
  assert.equal(s.readSecret('cred',key),'private-community');
  const mismatch=structuredClone(snapshot); mismatch.data.measurements[0].value=null; mismatch.data.measurements[0].counter_value='1';
  assert.throws(()=>s.restore(mismatch)); assert.deepEqual(s.snapshot().data,snapshot.data);
  const bad=structuredClone(snapshot); bad.data.measurements[0].monitor_id='missing';
  assert.throws(()=>s.restore(bad)); assert.deepEqual(s.snapshot().data,snapshot.data);
  const incomplete=structuredClone(snapshot); delete incomplete.data.sessions;
  assert.throws(()=>s.restore(incomplete)); assert.deepEqual(s.snapshot().data,snapshot.data);
  s.db.exec("CREATE TRIGGER fail_live BEFORE INSERT ON nodes BEGIN SELECT RAISE(ABORT,'live failure'); END");
  assert.throws(()=>s.restore(snapshot)); assert.deepEqual(s.snapshot().data,snapshot.data);
});
test('measurement semantics, uint64 precision, bounded metric identities and history index',t=>{
  const {store:s}=fixture(t); const id=device(s),g=monitor(s,id),c=monitor(s,id,'counter','rx_bytes');
  sample(s,c,Date.now(),null,'18446744073709551615');
  assert.equal(s.db.prepare('SELECT counter_value FROM measurements').get()!.counter_value,'18446744073709551615');
  assert.throws(()=>sample(s,c,Date.now(),10)); assert.throws(()=>sample(s,g,Date.now(),null,'1'));
  assert.throws(()=>monitor(s,id,'gauge','random-request-id'));
  const plan=s.db.prepare('EXPLAIN QUERY PLAN SELECT * FROM measurements WHERE monitor_id=? AND observed_at>=? ORDER BY observed_at DESC LIMIT 100').all(g,0);
  assert.match(JSON.stringify(plan),/measurements_history/);
  s.deleteDevice(id,'test'); assert.equal(s.db.prepare('SELECT count(*) n FROM measurements').get()!.n,0);
});
test('retention aggregates gauges idempotently and expires raw history',t=>{
  const {store:s}=fixture(t); const m=monitor(s,device(s)), now=Math.floor(Date.now()/3600000)*3600000;
  sample(s,m,now-100000,10); sample(s,m,now-90000,20); sample(s,m,now-8*86400000,99);
  s.retain(now); const first=s.db.prepare('SELECT * FROM metric_aggregates ORDER BY resolution_ms').all();
  assert.equal(first.length,4); const recent=first.find(r=>r.samples===2)!; assert.equal(recent.total,30);
  s.retain(now); assert.deepEqual(s.db.prepare('SELECT * FROM metric_aggregates ORDER BY resolution_ms').all(),first);
  assert.equal(s.db.prepare('SELECT count(*) n FROM measurements').get()!.n,2);
});

test('ingestion assigns reception time, enforces quality and history bounds',t=>{
  const {store:s}=fixture(t), m=monitor(s,device(s)), at=Date.now();
  s.recordMeasurement({monitor_id:m,observed_at:at,quality:'good',source:'snmp',value:2});
  const rows=s.history(m,at,Date.now()+1);
  assert.equal(rows.length,1); assert.equal(rows[0].units,'ms'); assert.equal(rows[0].semantics,'gauge');
  assert.ok(Number(rows[0].received_at)>=at);
  assert.throws(()=>s.recordMeasurement({monitor_id:m,observed_at:at,quality:'error',source:'snmp',value:0}));
  assert.throws(()=>s.recordMeasurement({monitor_id:m,observed_at:at,received_at:1,quality:'good',source:'snmp',value:1}));
  assert.throws(()=>s.recordMeasurement({monitor_id:m,observed_at:at,quality:'good',source:'snmp',value:Infinity}));
  assert.throws(()=>s.history(m,0,at,1001));
  assert.throws(()=>s.db.prepare("UPDATE monitor_definitions SET units='s' WHERE id=?").run(m));
});
test('API backup round trip, expired sessions, and unknown migration refusal',async t=>{
  const f=fixture(t),s=f.store,headers=admin(s),app=buildApiRouter(s);
  device(s);
  const response=await app.request('/api/system/export',{headers}); assert.equal(response.status,200);
  const snapshot=await response.json();
  assert.equal((await app.request('/api/system/import',{method:'POST',headers,body:JSON.stringify(snapshot)})).status,200);
  assert.deepEqual(JSON.parse(JSON.stringify(s.snapshot().data)),(snapshot as any).data);
  s.db.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await app.request('/api/nodes',{headers})).status,401);
  s.db.exec('PRAGMA user_version=99');
  assert.throws(()=>f.reopen(),/Unsupported database schema version/);
});
