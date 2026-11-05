"""SQLite connection helpers and schema for SmartExam."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "smart_exam.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS students (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no    TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    department TEXT NOT NULL,
    year       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    department TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT UNIQUE NOT NULL,
    capacity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    subject   TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    exam_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seat_allocations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id    INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    room_id    INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    seat_no    TEXT NOT NULL,
    UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS invigilation (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id    INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    room_id    INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    UNIQUE (exam_id, room_id, faculty_id)
);

CREATE INDEX IF NOT EXISTS idx_alloc_exam ON seat_allocations(exam_id);
CREATE INDEX IF NOT EXISTS idx_invig_exam ON invigilation(exam_id);
"""


def connect() -> sqlite3.Connection:
    """Open a connection with row access by column name and FK enforcement."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


@contextmanager
def get_conn():
    """Yield a connection, committing on success and always closing it."""
    con = connect()
    try:
        yield con
        con.commit()
    finally:
        con.close()


def init_db() -> None:
    """Create the database file and tables if they do not exist yet."""
    with get_conn() as con:
        con.executescript(SCHEMA)
