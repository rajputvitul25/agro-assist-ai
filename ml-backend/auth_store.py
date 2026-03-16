from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


DATABASE_PATH = Path(__file__).resolve().parent / "data" / "auth.db"
PBKDF2_ITERATIONS = 200_000


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    salt_bytes = (
        base64.b64decode(salt.encode("utf-8"))
        if salt
        else secrets.token_bytes(16)
    )
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_bytes,
        PBKDF2_ITERATIONS,
    )
    return (
        base64.b64encode(salt_bytes).decode("utf-8"),
        base64.b64encode(digest).decode("utf-8"),
    )


def _verify_password(password: str, salt: str, password_hash: str) -> bool:
    _, candidate_hash = _hash_password(password, salt)
    return hmac.compare_digest(candidate_hash, password_hash)


def _record_event(
    connection: sqlite3.Connection,
    *,
    user_id: Optional[str],
    email: str,
    event_type: str,
    status: str,
    details: Optional[str] = None,
) -> None:
    connection.execute(
        """
        INSERT INTO auth_events (user_id, email, event_type, status, details, occurred_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, email, event_type, status, details, _utc_now()),
    )


def _serialize_user(row: sqlite3.Row, login_count: int = 0) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "created_at": row["created_at"],
        "last_login_at": row["last_login_at"],
        "login_count": int(login_count),
    }


def initialize_auth_db() -> None:
    connection = _get_connection()
    try:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_login_at TEXT
            );

            CREATE TABLE IF NOT EXISTS auth_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                email TEXT NOT NULL,
                event_type TEXT NOT NULL,
                status TEXT NOT NULL,
                details TEXT,
                occurred_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            """
        )
        connection.commit()
    finally:
        connection.close()


def ensure_demo_user() -> None:
    connection = _get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            ("demo@farmassist.com",),
        ).fetchone()
        if existing:
            return

        now = _utc_now()
        user_id = str(uuid.uuid4())
        salt, password_hash = _hash_password("demo123")
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_salt, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                "Demo User",
                "demo@farmassist.com",
                salt,
                password_hash,
                now,
                now,
            ),
        )
        _record_event(
            connection,
            user_id=user_id,
            email="demo@farmassist.com",
            event_type="register",
            status="success",
            details="Seeded demo account",
        )
        connection.commit()
    finally:
        connection.close()


def ensure_admin_user() -> None:
    """Create an admin user if it doesn't exist."""
    connection = _get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            ("admin@farmassist.com",),
        ).fetchone()
        if existing:
            return

        now = _utc_now()
        user_id = str(uuid.uuid4())
        salt, password_hash = _hash_password("admin123")
        connection.execute(
            """
            INSERT INTO users (id, name, email, password_salt, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                "Admin User",
                "admin@farmassist.com",
                salt,
                password_hash,
                now,
                now,
            ),
        )
        _record_event(
            connection,
            user_id=user_id,
            email="admin@farmassist.com",
            event_type="register",
            status="success",
            details="Seeded admin account",
        )
        connection.commit()
    finally:
        connection.close()


def register_user(name: str, email: str, password: str) -> Optional[Dict[str, Any]]:
    normalized_email = _normalize_email(email)
    connection = _get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()
        if existing:
            return None

        now = _utc_now()
        user_id = str(uuid.uuid4())
        salt, password_hash = _hash_password(password)

        connection.execute(
            """
            INSERT INTO users (id, name, email, password_salt, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, name.strip(), normalized_email, salt, password_hash, now, now),
        )
        _record_event(
            connection,
            user_id=user_id,
            email=normalized_email,
            event_type="register",
            status="success",
            details="Account created",
        )
        connection.commit()

        row = connection.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if row is None:
            return None
        return _serialize_user(row, login_count=0)
    finally:
        connection.close()


def login_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    normalized_email = _normalize_email(email)
    connection = _get_connection()
    try:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()
        if row is None:
            _record_event(
                connection,
                user_id=None,
                email=normalized_email,
                event_type="login",
                status="failure",
                details="Unknown email",
            )
            connection.commit()
            return None

        if not _verify_password(password, row["password_salt"], row["password_hash"]):
            _record_event(
                connection,
                user_id=row["id"],
                email=row["email"],
                event_type="login",
                status="failure",
                details="Incorrect password",
            )
            connection.commit()
            return None

        now = _utc_now()
        connection.execute(
            "UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?",
            (now, now, row["id"]),
        )
        _record_event(
            connection,
            user_id=row["id"],
            email=row["email"],
            event_type="login",
            status="success",
            details="Login successful",
        )
        connection.commit()

        refreshed_row = connection.execute(
            "SELECT * FROM users WHERE id = ?",
            (row["id"],),
        ).fetchone()
        login_count = connection.execute(
            """
            SELECT COUNT(*)
            FROM auth_events
            WHERE user_id = ? AND event_type = 'login' AND status = 'success'
            """,
            (row["id"],),
        ).fetchone()[0]
        if refreshed_row is None:
            return None
        return _serialize_user(refreshed_row, login_count=login_count)
    finally:
        connection.close()


def get_auth_overview(limit: int = 50) -> Dict[str, Any]:
    connection = _get_connection()
    try:
        user_rows = connection.execute(
            """
            SELECT
                users.*,
                COALESCE(
                    SUM(
                        CASE
                            WHEN auth_events.event_type = 'login' AND auth_events.status = 'success' THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS login_count
            FROM users
            LEFT JOIN auth_events ON auth_events.user_id = users.id
            GROUP BY users.id
            ORDER BY datetime(users.created_at) DESC, users.created_at DESC
            """
        ).fetchall()

        event_rows = connection.execute(
            """
            SELECT id, user_id, email, event_type, status, details, occurred_at
            FROM auth_events
            ORDER BY datetime(occurred_at) DESC, id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        total_users = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        total_logins = connection.execute(
            """
            SELECT COUNT(*)
            FROM auth_events
            WHERE event_type = 'login' AND status = 'success'
            """
        ).fetchone()[0]
        failed_logins = connection.execute(
            """
            SELECT COUNT(*)
            FROM auth_events
            WHERE event_type = 'login' AND status = 'failure'
            """
        ).fetchone()[0]
        latest_activity_at = connection.execute(
            "SELECT MAX(occurred_at) FROM auth_events"
        ).fetchone()[0]

        return {
            "database_path": str(DATABASE_PATH),
            "summary": {
                "total_users": int(total_users),
                "total_logins": int(total_logins),
                "failed_logins": int(failed_logins),
                "latest_activity_at": latest_activity_at,
            },
            "users": [
                _serialize_user(row, login_count=row["login_count"])
                for row in user_rows
            ],
            "events": [
                {
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "email": row["email"],
                    "event_type": row["event_type"],
                    "status": row["status"],
                    "details": row["details"],
                    "occurred_at": row["occurred_at"],
                }
                for row in event_rows
            ],
        }
    finally:
        connection.close()
