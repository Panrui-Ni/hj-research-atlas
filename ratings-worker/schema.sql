-- One mutable vote per anonymous browser token, paper, and rating dimension.
-- Never store email, GitHub username, raw browser token, or raw IP address.
CREATE TABLE IF NOT EXISTS votes (
  paper_id TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('concept','method','technical','systematic','generality')),
  voter_hash TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('very_high','high','moderate','low')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (paper_id,dimension,voter_hash)
);
CREATE INDEX IF NOT EXISTS idx_votes_paper ON votes(paper_id);
CREATE TABLE IF NOT EXISTS daily_limits (
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  writes INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day,ip_hash)
);
