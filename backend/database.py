"""SQLite database setup and helpers."""

import sqlite3
import os

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "pst_reader.db"
)


def get_db() -> sqlite3.Connection:
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initialize the database schema."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            company_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            before_image_path TEXT NOT NULL,
            after_image_path TEXT NOT NULL,
            before_rgb_r INTEGER, before_rgb_g INTEGER, before_rgb_b INTEGER,
            after_rgb_r INTEGER, after_rgb_g INTEGER, after_rgb_b INTEGER,
            before_lab_l REAL, before_lab_a REAL, before_lab_b REAL,
            after_lab_l REAL, after_lab_a REAL, after_lab_b REAL,
            delta_a REAL, delta_e REAL, delta_l REAL,
            pst_value REAL,
            is_clean BOOLEAN,
            label TEXT,
            location TEXT,
            equipment_id TEXT,
            notes TEXT,
            tested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );


        INSERT OR IGNORE INTO users (id, email, password_hash, company_name)
        VALUES (1, 'admin@pst-reader.local', 'default', 'Default');
    """)
    conn.commit()
    conn.close()


# Initialize on import
init_db()
