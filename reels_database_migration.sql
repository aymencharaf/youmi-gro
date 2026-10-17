-- YOUmi Reels migration for installations where API auto-install is disabled.
-- public/api.php also creates these tables automatically on requests.
CREATE TABLE IF NOT EXISTS reels (
  id VARCHAR(64) PRIMARY KEY, store_id VARCHAR(64) NOT NULL, user_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NULL, caption VARCHAR(500) NOT NULL DEFAULT '', tags VARCHAR(1000) NOT NULL DEFAULT '',
  video_url VARCHAR(500) NOT NULL, likes_count INT NOT NULL DEFAULT 0, created_at DATETIME NOT NULL,
  INDEX idx_reels_created(created_at), INDEX idx_reels_store(store_id), INDEX idx_reels_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id VARCHAR(64) NOT NULL, user_id VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL,
  PRIMARY KEY (reel_id,user_id), INDEX idx_reel_likes_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS reel_comments (
  id VARCHAR(64) PRIMARY KEY, reel_id VARCHAR(64) NOT NULL, user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(150) NOT NULL, comment_text VARCHAR(1000) NOT NULL, created_at DATETIME NOT NULL,
  INDEX idx_reel_comments(reel_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
