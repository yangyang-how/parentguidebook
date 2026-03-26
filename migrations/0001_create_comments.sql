-- migrations/0001_create_comments.sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  paragraph_preview TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_comments_page ON comments(page_path);
