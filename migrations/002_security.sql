-- Revoke all prototype sessions on upgrade. No legacy/demo bearer token remains valid.
DELETE FROM sessions;
ALTER TABLE sessions ADD COLUMN last_seen INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN password_scheme TEXT NOT NULL DEFAULT 'legacy' CHECK(password_scheme IN ('legacy','scrypt-v2'));
ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1));
CREATE TABLE security_state (id INTEGER PRIMARY KEY CHECK(id=1), setup_complete INTEGER NOT NULL CHECK(setup_complete IN (0,1)), bootstrap_hash TEXT, bootstrap_expires_at INTEGER NOT NULL DEFAULT 0) STRICT;
INSERT INTO security_state VALUES (1, CASE WHEN EXISTS(SELECT 1 FROM users) THEN 1 ELSE 0 END, NULL, 0);
CREATE TABLE auth_throttle (bucket TEXT PRIMARY KEY NOT NULL, attempts INTEGER NOT NULL, window_start INTEGER NOT NULL) STRICT;
CREATE INDEX auth_throttle_expiry ON auth_throttle(window_start);
UPDATE settings SET auth_enabled=1;
CREATE TRIGGER authentication_required_update BEFORE UPDATE OF auth_enabled ON settings WHEN NEW.auth_enabled!=1 BEGIN SELECT RAISE(ABORT,'Authentication cannot be disabled'); END;
CREATE TRIGGER authentication_required_insert BEFORE INSERT ON settings WHEN NEW.auth_enabled!=1 BEGIN SELECT RAISE(ABORT,'Authentication cannot be disabled'); END;
CREATE TRIGGER revoke_security_changes AFTER UPDATE OF password,role,disabled ON users BEGIN DELETE FROM sessions WHERE user_id=NEW.id; END;
