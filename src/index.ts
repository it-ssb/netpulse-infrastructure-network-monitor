import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Store, hashPassword } from './store.ts';
import { buildApiRouter } from './api.ts';

// Opening/migrating storage must succeed before accepting any requests.
const store = new Store(process.env.NETPULSE_DB ?? './netpulse.sqlite');
if (process.env.NETPULSE_ADMIN_PASSWORD && !store.db.prepare('SELECT id FROM users LIMIT 1').get()) {
  const password = process.env.NETPULSE_ADMIN_PASSWORD;
  if (password.length < 12) throw new Error('Bootstrap password must contain at least 12 characters');
  store.db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(crypto.randomUUID(),'admin',hashPassword(password),'Administrator','admin',Date.now());
}
const app = buildApiRouter(store);
app.use('*', serveStatic({ root: './public' }));
app.get('*', serveStatic({ path: './public/index.html' }));
store.retain();
const maintenance = setInterval(() => {
  try { store.retain(); } catch (error) { console.error('Retention failed',error); }
}, 3600000);
maintenance.unref();
const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787), hostname: process.env.HOST ?? '127.0.0.1' });
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal, () => {
  clearInterval(maintenance);
  server.close(() => { store.db.close(); process.exit(0); });
});
