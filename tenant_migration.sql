-- Run once on the CENTRAL Youmi database.
CREATE TABLE IF NOT EXISTS tenant_databases (
  store_id VARCHAR(64) PRIMARY KEY,
  db_name VARCHAR(190) NOT NULL UNIQUE,
  db_host VARCHAR(190) NOT NULL,
  db_user VARCHAR(190) NOT NULL,
  db_pass VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
