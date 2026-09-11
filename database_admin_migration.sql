-- Youmi admin migration
-- api.php also auto-creates this column when possible.
ALTER TABLE users ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'active';
CREATE INDEX idx_users_role_status ON users(role,status);
